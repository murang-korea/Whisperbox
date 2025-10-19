// === public/script.js ===
window.__WB_CURRENT_USER = null;

// 로그인한 사용자 표시
window.showCurrentUser = async function(requireLogin=false){
  try {
    const res = await fetch("/api/me");
    if(!res.ok) return null;
    const data = await res.json();
    const user = data.user || null;
    window.__WB_CURRENT_USER = user;

    const userArea = document.getElementById("userArea");
    if(userArea){
      if(user){
        userArea.innerHTML = `<div style="text-align:right">
          <small>안녕하세요, <strong>${escapeHtml(user.nickname)}</strong></small>
          <div style="margin-top:6px"><button onclick="doLogout()">로그아웃</button></div>
        </div>`;
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
  } catch(e){
    console.error(e);
    return null;
  }
}

// 로그아웃
window.doLogout = async function(){
  try {
    const res = await fetch("/api/logout",{method:"POST"});
    if(res.ok){ window.__WB_CURRENT_USER = null; location.href="index.html"; }
    else alert("로그아웃 실패");
  } catch(e){
    console.error(e);
    alert("네트워크 오류");
  }
}

// 새 글 작성 (POST)
window.postNew = async function(title, content){
  try {
    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content })
    });
    const data = await res.json().catch(()=>({}));
    return { ok: res.ok, status: res.status, data };
  } catch(e){
    console.error("postNew error:", e);
    return { ok:false, error: e.message };
  }
}

// 유틸 함수
function escapeHtml(s){ if(!s) return ""; return s.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;"); }
function truncate(s,n){ if(!s) return ""; return s.length>n ? s.slice(0,n)+"..." : s; }
