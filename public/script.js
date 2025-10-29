async function showCurrentUser(requireLogin=false){
  try {
    const res = await fetch("/api/current-user", { credentials:"include" });
    const user = await res.json();
    if(requireLogin && !user){
      alert("로그인이 필요합니다!");
      location.href="login.html";
      return null;
    }
    return user;
  } catch(e){
    console.error(e);
    if(requireLogin){
      alert("로그인 확인 중 오류 발생!");
      location.href="login.html";
    }
    return null;
  }
}

async function logout(){
  try {
    await fetch("/api/logout", { method:"POST", credentials:"include" });
    alert("로그아웃 되었습니다.");
    location.href="index.html";
  } catch(e){
    console.error(e);
  }
}

// 로그인 요청
async function doLogin(username, password) {
  try {
    const res = await fetch("/api/login", {
      method: "POST",
      credentials: "include", // 세션 쿠키 저장용
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();

    if (!res.ok || !data.ok) {
      alert(data.error || "로그인 실패");
      return;
    }

    alert("로그인 성공!");
    location.href = "index.html"; // 로그인 후 메인으로
  } catch (e) {
    console.error(e);
    alert("로그인 중 오류 발생");
  }
}

// 회원가입 요청
async function doRegister(username, password) {
  try {
    const res = await fetch("/api/register", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();

    if (!res.ok || !data.ok) {
      alert(data.error || "회원가입 실패");
      return;
    }

    alert("회원가입 완료! 로그인 페이지로 이동합니다.");
    location.href = "login.html";
  } catch (e) {
    console.error(e);
    alert("회원가입 중 오류 발생");
  }
}
