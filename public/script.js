// === public/script.js ===
window.__WB_CURRENT_USER = null;

// 로그인한 사용자 표시
window.showCurrentUser = async function(requireLogin = false) {
  try {
    const res = await fetch("/api/me");
    if (!res.ok) return null;
    const data = await res.json();
    const user = data.user || null;
    window.__WB_CURRENT_USER = user;

    const userArea = document.getElementById("userArea");
    if (userArea) {
      if (user) {
        userArea.innerHTML = `
          <div style="text-align:right">
            <small>안녕하세요, <strong>${escapeHtml(user.nickname)}</strong></small>
            <div style="margin-top:6px">
              <button onclick="doLogout()">로그아웃</button>
            </div>
          </div>`;
      } else {
        userArea.innerHTML = `<div style="text-align:right"><small class="muted">비로그인</small></div>`;
      }
    }

    if (requireLogin && !user) {
      alert("로그인이 필요합니다.");
      location.href = "login.html";
      return null;
    }

    return user;
  } catch (e) {
    console.error(e);
    return null;
  }
};

// 로그아웃
window.doLogout = async function() {
  try {
    const res = await fetch("/api/logout", { method: "POST" });
    if (res.ok) {
      window.__WB_CURRENT_USER = null;
      location.href = "index.html";
    } else alert("로그아웃 실패");
  } catch (e) {
    console.error(e);
    alert("네트워크 오류");
  }
};

// 새 글 작성 (POST)
window.postNew = async function(title, content) {
  try {
    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content })
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data };
  } catch (e) {
    console.error("postNew error:", e);
    return { ok: false, error: e.message };
  }
};

// === 게시글 목록 ===
window.loadPosts = async function(search = "", sort = "latest") {
  try {
    const res = await fetch("/api/posts");
    const data = await res.json();
    const posts = data.posts || [];

    let filtered = posts;
    if (search) {
      filtered = posts.filter(
        p =>
          p.title.includes(search) ||
          p.content.includes(search) ||
          p.author.includes(search)
      );
    }

    if (sort === "random") filtered.sort(() => Math.random() - 0.5);
    else if (sort === "likes") filtered.sort((a, b) => b.likes - a.likes);
    else if (sort === "comments") filtered.sort((a, b) => b.comments.length - a.comments.length);
    else filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const list = document.getElementById("postsList");
    if (!list) return;
    list.innerHTML =
      filtered.length === 0
        ? `<div class="card">게시글이 없습니다</div>`
        : filtered
            .map(
              p => `
        <div class="card post" onclick="location.href='view.html?id=${p.id}'">
          <h3>${escapeHtml(p.title)}</h3>
          <p>${truncate(p.content, 100)}</p>
          <div class="meta">
            <span>👤 ${escapeHtml(p.author)}</span>
            <span>❤️ ${p.likes}</span>
            <span>💬 ${p.comments.length}</span>
          </div>
        </div>`
            )
            .join("");
  } catch (e) {
    console.error("loadPosts error:", e);
  }
};

// === 게시글 보기 ===
window.loadPost = async function(id) {
  try {
    const res = await fetch(`/api/posts/${id}`);
    if (!res.ok) throw new Error("글 불러오기 실패");
    const data = await res.json();
    const post = data.post;

    const likedPosts = JSON.parse(localStorage.getItem("likedPosts") || "[]");
    const alreadyLiked = likedPosts.includes(id);

    const card = document.getElementById("postCard");
    card.innerHTML = `
      <h2>${escapeHtml(post.title)}</h2>
      <p>${escapeHtml(post.content)}</p>
      <div class="meta">
        <span>👤 ${escapeHtml(post.author)}</span>
        <span>❤️ <span id="likeCount">${post.likes}</span></span>
      </div>
      <div style="margin-top:8px">
        <button id="likeBtn" style="background:${alreadyLiked ? '#ffcccc' : ''}">
          ${alreadyLiked ? "좋아요 취소" : "좋아요"}
        </button>
      </div>
    `;

    // 댓글 표시
    const commentsArea = document.getElementById("commentsArea");
    commentsArea.innerHTML =
      post.comments.length === 0
        ? `<p>댓글이 없습니다</p>`
        : post.comments
            .map(
              c => `<div class="comment">
                      <b>${escapeHtml(c.author)}</b>: ${escapeHtml(c.text)}
                    </div>`
            )
            .join("");

    // 좋아요 버튼 동작
    document.getElementById("likeBtn").onclick = async () => {
      const liked = JSON.parse(localStorage.getItem("likedPosts") || "[]");
      const isLiked = liked.includes(id);

      const res2 = await fetch(`/api/posts/${id}/like`, { method: "POST" });
      if (res2.ok) {
        const data2 = await res2.json();
        document.getElementById("likeCount").textContent = data2.likes;

        // 상태 토글
        if (isLiked) {
          localStorage.setItem("likedPosts", JSON.stringify(liked.filter(x => x !== id)));
          document.getElementById("likeBtn").textContent = "좋아요";
          document.getElementById("likeBtn").style.background = "";
        } else {
          liked.push(id);
          localStorage.setItem("likedPosts", JSON.stringify(liked));
          document.getElementById("likeBtn").textContent = "좋아요 취소";
          document.getElementById("likeBtn").style.background = "#ffcccc";
        }
      } else {
        alert("좋아요 요청 실패");
      }
    };
  } catch (e) {
    console.error("loadPost error:", e);
    alert("글 불러오기 실패");
  }
};

// === 유틸 ===
function escapeHtml(s) {
  if (!s) return "";
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function truncate(s, n) {
  if (!s) return "";
  return s.length > n ? s.slice(0, n) + "..." : s;
      }
