// 공통 유틸 스크립트
window.__WB_CURRENT_USER = null;

// 현재 로그인 유저 정보 로드 (비동기)
export async function fetchCurrentUser(){
  try {
    const res = await fetch("/api/me");
    if(!res.ok) return null;
    const data = await res.json();
    return data.user || null;
  } catch(e){
    console.error("fetchCurrentUser error", e);
    return null;
  }
}

// 전역으로 사용 가능하게 함수 정의 (브라우저 전역)
window.showCurrentUser = async function(requireLogin=false){
  const res = await fetch("/api/me");
  if(!res.ok) {
    document.getElementById("userArea")?.innerText = "";
    return null;
  }
  const data = await res.json();
  const user = data.user || null;
  window.__WB_CURRENT_USER = user;
  const userArea = document.getElementById("userArea");
  if(userArea){
    if(user) {
      userArea.innerHTML = `<div style="text-align:right"><small>안녕하세요, <strong>${escapeHtml(user.nickname)}</strong></small><div style="margin-top:6px"><button onclick="doLogout()">로그아웃</button></div></div>`;
    } else {
      userArea.innerHTML = `<div style="text-align:right"><small class="muted">비로그인</small></div>`;
    }
  }
  if(requireLogin && !user){
    alert("로그인이 필요합니다.");
    location.href = "login.html";
    return null;
  }
  return user;
}

window.doLogout = async function(){
  const res = await fetch("/api/logout", { method:"POST" });
  if(res.ok) { window.__WB_CURRENT_USER = null; location.href="index.html"; }
  else alert("로그아웃 실패");
}

// posts 로드 및 렌더 (검색어 optional)
window.loadPosts = async function(query){
  try {
    const res = await fetch("/api/posts");
    if(!res.ok) throw new Error("posts fetch fail");
    const data = await res.json();
    let posts = data.posts || [];
    if(query){
      const q = query.toLowerCase();
      posts = posts.filter(p => (p.title||"").toLowerCase().includes(q) || (p.content||"").toLowerCase().includes(q) || (p.author||"").toLowerCase().includes(q));
    }
    const container = document.getElementById("postsList");
    if(!container) return;
    if(posts.length===0){ container.innerHTML = `<div class="card">게시글이 없습니다</div>`; return; }

    container.innerHTML = posts.map(p => `
      <div class="card">
        <div class="post-title"><a href="view.html?id=${p.id}">${escapeHtml(p.title)}</a></div>
        <div class="post-meta post-meta">${escapeHtml(p.author)} · ${new Date(p.createdAt).toLocaleString()}</div>
        <div style="margin-top:8px">${escapeHtml(truncate(p.content,200))}</div>
        <div style="margin-top:10px" class="actions">
          <button onclick="location.href='view.html?id=${p.id}'">열기</button>
        </div>
      </div>
    `).join("");
  } catch (e){
    console.error(e);
    document.getElementById("postsList").innerHTML = `<div class="card">게시글 불러오기 실패</div>`;
  }
}

// load single post
window.loadPost = async function(id){
  try {
    const res = await fetch("/api/posts/" + id);
    if(!res.ok) throw new Error("post fetch fail");
    const data = await res.json();
    const p = data.post;
    if(!p) { document.getElementById("postCard").innerHTML = "<div>글 없음</div>"; return; }
    document.getElementById("postCard").innerHTML = `<div class="post-title">${escapeHtml(p.title)}</div>
      <div class="post-meta">${escapeHtml(p.author)} · ${new Date(p.createdAt).toLocaleString()}</div>
      <div style="margin-top:10px">${escapeHtml(p.content)}</div>
      <div style="margin-top:10px" class="actions">
        ${ window.__WB_CURRENT_USER && window.__WB_CURRENT_USER.username === p.authorUsername ? `<button onclick="editPost(${p.id})">수정</button><button onclick="deletePost(${p.id})">삭제</button>` : "" }
        <button onclick="location.href='index.html'">목록</button>
      </div>
    `;

    // comments
    const ca = document.getElementById("commentsArea");
    ca.innerHTML = (p.comments && p.comments.length) ? p.comments.map(c=>`<div class="comment"><strong>${escapeHtml(c.author)}</strong> · ${new Date(c.createdAt).toLocaleString()}<div style="margin-top:6px">${escapeHtml(c.text)}</div></div>`).join("") : "<div class='muted'>댓글이 없습니다</div>";
  } catch(e){
    console.error(e);
    document.getElementById("postCard").innerHTML = "<div>게시글 로드 실패</div>";
  }
}

// delete post (author or admin)
window.deletePost = async function(id){
  if(!confirm("정말 삭제할까요?")) return;
  const res = await fetch(`/api/posts/${id}`, { method:"DELETE" });
  if(res.ok){ alert("삭제됨"); location.href="index.html"; }
  else {
    const j = await res.json().catch(()=>({}));
    alert(j.error || "삭제 실패");
  }
}

// helper: escape
function escapeHtml(s){
  if(!s) return "";
  return s.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");
}

function truncate(s,n){ if(!s) return ""; return s.length>n ? s.slice(0,n)+"..." : s; }
