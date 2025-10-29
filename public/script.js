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

async function getCurrentUser() {
  try {
    const r = await fetch('/api/current-user');
    const j = await r.json();
    return j || null;
  } catch(e) { return null; }
}

function el(sel){ return document.querySelector(sel); }
function elAll(sel){ return document.querySelectorAll(sel); }

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
