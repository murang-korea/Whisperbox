window.__WB_CURRENT_USER = null;

export async function showCurrentUser(requireLogin=false){
  try {
    const res = await fetch("/api/me");
    const data = await res.json();
    const user = data.user || null;
    window.__WB_CURRENT_USER = user;

    const userArea = document.getElementById("userArea");
    if(userArea){
      if(user){
        userArea.innerHTML = `<div style="text-align:right">
          <small><strong>${escapeHtml(user.nickname)}</strong></small>
          <div><button onclick="doLogout()">로그아웃</button></div>
        </div>`;
      } else {
        userArea.innerHTML = `<div style="text-align:right"><small class="muted">비로그인</small></div>`;
      }
    }

    if(requireLogin && !user){ alert("로그인이 필요합니다."); location.href="login.html"; return null; }
    return user;
  } catch(e){ console.error(e); return null; }
}

window.doLogout = async function(){
  const res = await fetch("/api/logout",{method:"POST"});
  if(res.ok){ window.__WB_CURRENT_USER=null; location.href="index.html"; }
}

export async function loadPosts(query, sortType="random"){
  try {
    const res = await fetch("/api/posts");
    const data = await res.json();
    let posts = data.posts || [];

    if(query){
      const q = query.toLowerCase();
      posts = posts.filter(p =>
        (p.title||"").toLowerCase().includes(q) ||
        (p.content||"").toLowerCase().includes(q) ||
        (p.author||"").toLowerCase().includes(q)
      );
    }

    switch(sortType){
      case "latest":
        posts.sort((a,b)=> new Date(b.createdAt) - new Date(a.createdAt)); break;
      case "likes":
        posts.sort((a,b)=> (b.likes||0) - (a.likes||0)); break;
      case "comments":
        posts.sort((a,b)=> (b.comments?.length||0) - (a.comments?.length||0)); break;
      default:
        posts.sort(()=>Math.random()-0.5);
    }

    const container = document.getElementById("postsList");
    if(!container) return;
    if(posts.length===0){ container.innerHTML=`<div class="card">게시글이 없습니다</div>`; return; }

    container.innerHTML = posts.map(p=>`
      <div class="card">
        <div class="post-title"><a href="view.html?id=${p.id}">${escapeHtml(p.title)}</a></div>
        <div class="post-meta">${escapeHtml(p.author)} · ${new Date(p.createdAt).toLocaleString()}</div>
        <div>${escapeHtml(truncate(p.content,150))}</div>
        <div class="post-info" style="margin-top:6px; font-size:13px;">
          ❤️ ${p.likes||0} · 💬 ${p.comments?.length||0}
        </div>
      </div>
    `).join("");

  } catch(e){
    console.error(e);
    const container = document.getElementById("postsList");
    if(container) container.innerHTML=`<div class="card">게시글 불러오기 실패</div>`;
  }
}

export async function loadPost(id){
  try {
    const res = await fetch(`/api/posts/${id}`);
    const data = await res.json();
    const p = data.post;
    if(!p) return document.getElementById("postCard").innerHTML="<div>글 없음</div>";

    document.getElementById("postCard").innerHTML = `
      <div class="post-title">${escapeHtml(p.title)}</div>
      <div class="post-meta">${escapeHtml(p.author)} · ${new Date(p.createdAt).toLocaleString()}</div>
      <div style="margin-top:10px">${escapeHtml(p.content)}</div>
      <div class="actions" style="margin-top:10px">
        <button onclick="likePost(${p.id})">❤️ 좋아요 (${p.likes||0})</button>
        <button onclick="location.href='index.html'">목록</button>
      </div>
    `;

    const ca = document.getElementById("commentsArea");
    ca.innerHTML = (p.comments?.length)
      ? p.comments.map(c=>`
        <div class="comment"><strong>${escapeHtml(c.author)}</strong> · ${new Date(c.createdAt).toLocaleString()}
          <div>${escapeHtml(c.text)}</div>
        </div>`).join("")
      : "<div class='muted'>댓글이 없습니다</div>";

  } catch(e){
    console.error(e);
    document.getElementById("postCard").innerHTML="<div>게시글 로드 실패</div>";
  }
}

window.likePost = async function(id){
  const res = await fetch(`/api/posts/${id}/like`,{method:"POST"});
  const data = await res.json();
  if(data?.success) loadPost(id);
}

function escapeHtml(s){ if(!s) return ""; return s.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;"); }
function truncate(s,n){ if(!s) return ""; return s.length>n ? s.slice(0,n)+"..." : s; }
