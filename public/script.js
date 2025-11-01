const SUPABASE_URL = "https://abcd1234.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6..."; 
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let currentUser = JSON.parse(localStorage.getItem("whisper_user") || "null");

function showCurrentUser(requireLogin = false) {
  if (requireLogin && !currentUser) {
    alert("로그인이 필요합니다!");
    location.href = "login.html";
    return null;
  }
  return currentUser;
}

function logout() {
  localStorage.removeItem("whisper_user");
  currentUser = null;
  alert("로그아웃되었습니다.");
  location.href = "index.html";
}

async function login(username, password) {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("username", username)
    .eq("password", password)
    .single();

  if (error || !data) return alert("아이디나 비밀번호가 틀렸습니다.");
  currentUser = data;
  localStorage.setItem("whisper_user", JSON.stringify(data));
  alert("로그인 성공!");
  location.href = "index.html";
}

async function register(username, password) {
  const { error } = await supabase.from("users").insert([{ username, password }]);
  if (error) alert("회원가입 실패: " + error.message);
  else { alert("회원가입 완료! 로그인해주세요."); location.href="login.html"; }
}

async function postNew(title, content){
  if(!currentUser) return alert("로그인이 필요합니다.");
  const { error } = await supabase.from("posts").insert([{ title, content, author: currentUser.username }]);
  if(error) alert("작성 실패: " + error.message);
  else { alert("작성 완료!"); location.href="index.html"; }
}

async function loadPosts(){
  const { data } = await supabase.from("posts").select("*").order("created_at", { ascending:false });
  const list = document.getElementById("postList");
  list.innerHTML = data.map(p=>`
    <div class="card" onclick="viewPost(${p.id})">
      <h3>${p.title}</h3>
      <p>${p.author} · ${new Date(p.created_at).toLocaleString()}</p>
    </div>`).join("");
}

function viewPost(id){ location.href = `post.html?id=${id}`; }

async function loadPostDetail(){
  const params = new URLSearchParams(location.search);
  const id = params.get("id");
  const { data: post } = await supabase.from("posts").select("*").eq("id", id).single();
  document.getElementById("postTitle").innerText = post.title;
  document.getElementById("postContent").innerText = post.content;
  document.getElementById("postMeta").innerText = `${post.author} · ${new Date(post.created_at).toLocaleString()}`;
  const { data: comments } = await supabase.from("comments").select("*").eq("post_id", id).order("created_at", { ascending:true });
  const list = document.getElementById("commentList");
  list.innerHTML = comments.map(c=>`<div class="comment"><b>${c.author}</b>: ${c.content}</div>`).join("");
}

async function submitComment(){
  const content = document.getElementById("commentInput").value.trim();
  if(!content) return alert("댓글을 입력해주세요.");
  if(!currentUser) return alert("로그인이 필요합니다.");
  const params = new URLSearchParams(location.search);
  const postId = params.get("id");
  await supabase.from("comments").insert([{ post_id: postId, author: currentUser.username, content }]);
  alert("댓글 작성 완료!");
  location.reload();
}
