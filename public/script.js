<!-- Include this as <script src="script.js"></script> in each HTML -->
<script>
/* script.js - 공통 유틸 & 세션 관련 함수 */
async function api(path, opts = {}) {
  const res = await fetch(path, opts);
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    const j = await res.json();
    if (!res.ok && j && j.error) throw new Error(j.error);
    return j;
  }
  return res;
}

async function showCurrentUser(requireLogin = false){
  try{
    const res = await fetch("/api/current-user", { credentials: "include" });
    const user = await res.json();
    if(requireLogin && !user){
      alert("로그인이 필요합니다!");
      location.href="login.html";
      return null;
    }
    return user;
  }catch(e){
    console.error(e);
    if(requireLogin){
      alert("로그인 상태 확인 중 오류 발생!");
      location.href="login.html";
    }
    return null;
  }
}

async function logout(){
  try{
    await fetch("/api/logout", { method:"POST", credentials:"include" });
    alert("로그아웃 되었습니다.");
    location.href="index.html";
  }catch(e){
    console.error(e);
  }
}

// 로그아웃 함수
async function logout() {
  try {
    await fetch("/api/logout", {
      method: "POST",
      credentials: "include",
    });
    alert("로그아웃되었습니다.");
    location.href = "index.html";
  } catch (err) {
    console.error("로그아웃 실패:", err);
  }
}

async function showCurrentUser(requireLogin=false){
  const res = await fetch("/api/current-user");
  const user = await res.json();
  if(requireLogin && !user){
    location.href = "login.html";
    return null;
  }
  return user;
}

async function logout(){
  await fetch("/api/logout", {method:"POST"});
  location.href = "index.html";
}

/* 로그인 상태 표시용(헤더에 넣을 수 있도록) */
async function renderHeaderAuth(containerSelector) {
  const cont = document.querySelector(containerSelector);
  if(!cont) return;
  const user = await getCurrentUser();
  if(user && user.username) {
    cont.innerHTML = `
      <div class="row" style="gap:8px">
        <div class="small">안녕하세요, <strong>${escapeHtml(user.username)}</strong></div>
        <button class="btn ghost" id="logoutBtn">로그아웃</button>
      </div>
    `;
    document.getElementById('logoutBtn').addEventListener('click', async ()=>{
      await fetch('/api/logout', { method:'POST' });
      location.href = '/';
    });
  } else {
    cont.innerHTML = `
      <div class="row">
        <button class="btn" onclick="location.href='/login.html'">로그인</button>
        <button class="btn ghost" onclick="location.href='/register.html'">회원가입</button>
      </div>
    `;
  }
}

/* 간단한 XSS 방지 */
function escapeHtml(s){ return String(s).replace(/[&<>"']/g, c=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

/* helper: show alert-like toast (simple) */
function showMsg(msg){ alert(msg); }

/* export to global */
window.api = api;
window.getCurrentUser = getCurrentUser;
window.renderHeaderAuth = renderHeaderAuth;
window.escapeHtml = escapeHtml;
window.showMsg = showMsg;
</script>
