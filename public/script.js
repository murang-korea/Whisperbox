window.__WB_CURRENT_USER = null;

const PAGE_SIZE = 5;
let currentPage = 1;
let currentPosts = [];

window.showCurrentUser = async function(requireLogin=false){
  try{
    const res = await fetch("/api/me");
    const data = await res.json();
    const user = data.user || null;
    window.__WB_CURRENT_USER = user;
    const userArea = document.getElementById("userArea");
    if(userArea){
      if(user){
        userArea.innerHTML = `<div style="text-align:right"><small>안녕하세요, <strong>${escapeHtml(user.nickname)}</strong></small><div style="margin-top:6px"><button onclick="doLogout()">로그아웃</button></div></div>`;
      } else {
        userArea.innerHTML = `<div style="text-align:right"><small class="muted">비로그인</small></div>`;
      }
    }
    if(requireLogin && !user){
      alert("로그인이 필요합니다.");
      location.href="login.html";
      return null;
    }
    return user;
  }catch(e){ console.error(e); return null; }
}

window.doLogout = async function(){
  const res = await fetch("/api/logout",{method:"POST"});
  if(res.ok){ window.__WB_CURRENT_USER = null; location.href="index.html"; }
  else alert("로그아웃 실패");
}

// 게시글 로드 + 정렬 + 페이지네이션
window.loadPosts = async function(query="", sortBy="random"){
  try{
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

    if(sortBy==="latest") posts.sort((a,b)=> new Date(b.createdAt) - new Date(a.createdAt));
    else if(sortBy==="popular") posts.sort((a,b)=> (b.comments?.length||0) - (a.comments?.length||0));
    else posts.sort(()=>Math.random()-0.5);

    currentPosts = posts;
    currentPage = 1;
    renderPosts();
  }catch(e){ console.error(e); document.getElementById("postsList").innerHTML="<div class='card'>게시글 불러오기 실패</div>"; }
}

function renderPosts(){
  const container = document.getElementById("postsList");
  if(!container) return;

  const totalPages = Math.ceil(currentPosts.length / PAGE_SIZE);
  const paginated = currentPosts.slice((currentPage-1)*PAGE_SIZE, currentPage*PAGE_SIZE);

  if(paginated.length===0){ container.innerHTML="<div class='card'>게시글이 없습니다</div>"; return; }

  container.innerHTML = paginated.map(p=>`
    <div class="card">
      <div class="post-title"><a href="view.html?id=${p.id}">${escapeHtml(p.title)}</a></div>
      <div class="post-meta">${escapeHtml(p.author)} · ${new Date(p.createdAt).toLocaleString()}</div>
      <div style="margin-top:8px">${escapeHtml(truncate(p.content,200))}</div>
      <div style="margin-top:10px" class="actions">
        <button onclick="location.href='view.html?id=${p.id}'">열기</button>
        <button onclick="toggleLike(${p.id})">👍 ${p.likes?.length||0}</button>
      </div>
    </div>
  `).join("");

  const pagDiv = document.getElementById("pagination");
  pagDiv.innerHTML = "";
  for(let i=1;i<=totalPages;i++){
    const btn = document.createElement("button");
    btn.textContent=i;
    if(i===currentPage) btn.disabled=true;
    btn.onclick=()=>{ currentPage=i; renderPosts(); }
    pagDiv.appendChild(btn);
  }
}

// 좋아요 토글
window.toggleLike = async function(id){
  if(!window.__WB_CURRENT_USER){ alert("로그인이 필요합니다"); return; }
  const res = await fetch(`/api/posts/${id}/like`,{method:"POST"});
  if(res.ok) await loadPosts(); 
  else { const j=await res.json().catch(()=>({})); alert(j.error || "좋아요 실패"); }
}

// 헬퍼
function escapeHtml(s){ if(!s) return ""; return s.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;"); }
function truncate(s,n){ if(!s) return ""; return s.length>n ? s.slice(0,n)+"..." : s; }
