window.__WB_CURRENT_USER = null;

window.showCurrentUser = async function(requireLogin=false){
  try{
    const res = await fetch("/api/me");
    const data = await res.json();
    const user = data.user || null;
    window.__WB_CURRENT_USER = user;
    const ua = document.getElementById("userArea");
    if(ua){
      ua.innerHTML = user ? `<div style="text-align:right"><small>안녕하세요, <strong>${escapeHtml(user.nickname)}</strong></small><div style="margin-top:6px"><button onclick="doLogout()">로그아웃</button></div></div>` : `<div style="text-align:right"><small class="muted">비로그인</small></div>`;
    }
    if(requireLogin && !user){ alert("로그인이 필요합니다."); location.href="login.html"; return null; }
    return user;
  }catch(e){ console.error(e); return null; }
}

window.doLogout = async function(){
  const res = await fetch("/api/logout",{method:"POST"});
  if(res.ok){ window.__WB_CURRENT_USER=null; location.href="index.html"; }
  else alert("로그아웃 실패");
}

window.loadPosts = async function(query){
  try{
    const res = await fetch("/api/posts");
    const data = await res.json();
    let posts = data.posts || [];
    if(query){
      const q=query.toLowerCase();
      posts = posts.filter(p=> (p.title||"").toLowerCase().includes(q) || (p.content||"").toLowerCase().includes(q) || (p.author||"").toLowerCase().includes(q));
    }
    posts.sort(()=>Math.random()-0.5);
    const container = document.getElementById("postsList");
    if(!container) return;
    if(posts.length===0){ container.innerHTML="<div class='card'>게시글이 없습니다</div>"; return; }

    container.innerHTML = posts.map(p=>`
      <div class="card">
        <div class="post-title"><a href="view.html?id=${p.id}">${escapeHtml(p.title)}</a></div>
        <div class="post-meta">${escapeHtml(p.author)} · ${new Date(p.createdAt).toLocaleString()}</div>
        <div style="margin-top:8px">${escapeHtml(truncate(p.content,200))}</div>
        <div style="margin-top:10px" class="actions">
          <button onclick="location.href='view.html?id=${p.id}'">열기</button>
        </div>
      </div>
    `).join("");
  }catch(e){ console.error(e); }
}

window.loadPost = async function(id){
  try{
    const res = await fetch("/api/posts/"+id);
    const data = await res.json();
    const p = data.post;
    if(!p){ document.getElementById("postCard").innerHTML="글 없음"; return; }
    document.getElementById("postCard").innerHTML = `
      <div class="post-title">${escapeHtml(p.title)}</div>
      <div class="post-meta">${escapeHtml(p.author)} · ${new Date(p.createdAt).toLocaleString()}</div>
      <div style="margin-top:10px">${escapeHtml(p.content)}</div>
    `;
    const ca = document.getElementById("commentsArea");
    ca.innerHTML = (p.comments && p.comments.length) ? p.comments.map(c=>`<div class="comment"><strong>${escapeHtml(c.author)}</strong> · ${new Date(c.createdAt).toLocaleString()}<div>${escapeHtml(c.text)}</div></div>`).join("") : "<div class='muted'>댓글이 없습니다</div>";
  }catch(e){ console.error(e); document.getElementById("postCard").innerHTML="게시글 로드 실패"; }
}

function escapeHtml(s){ if(!s) return ""; return s.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;"); }
function truncate(s,n){ if(!s) return ""; return s.length>n ? s.slice(0,n)+"..." : s; }
