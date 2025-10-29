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
