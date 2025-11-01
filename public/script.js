// --- Supabase 연결 ---
const SUPABASE_URL = "https://abcd1234.supabase.co";  // 네 프로젝트 URL
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6..."; // 네 anon key
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// --- 로그인 유저 관리 ---
let currentUser = JSON.parse(localStorage.getItem("whisper_user") || "null");

// 현재 로그인 유저 반환 (없으면 null)
function showCurrentUser(requireLogin = false) {
  if (requireLogin && !currentUser) {
    alert("로그인이 필요합니다!");
    location.href = "login.html";
    return null;
  }
  return currentUser;
}

// 로그아웃
function logout() {
  localStorage.removeItem("whisper_user");
  currentUser = null;
  alert("로그아웃되었습니다.");
  location.href = "index.html";
}

// --- 로그인 ---
async function login(username, password) {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("username", username)
    .eq("password", password)
    .single();

  if (error || !data) {
    alert("아이디나 비밀번호가 틀렸습니다.");
    return;
  }

  currentUser = data;
  localStorage.setItem("whisper_user", JSON.stringify(data));
  alert("로그인 성공!");
  location.href = "index.html";
}

// --- 회원가입 ---
async function register(username, password) {
  const { error } = await supabase
    .from("users")
    .insert([{ username, password }]);

  if (error) {
    alert("회원가입 실패: " + error.message);
  } else {
    alert("회원가입 완료! 로그인해주세요.");
    location.href = "login.html";
  }
}

// --- 게시글 ---
async function postNew(title, content) {
  if (!currentUser) return alert("로그인이 필요합니다.");

  const { error } = await supabase
    .from("posts")
    .insert([{ title, content, author: currentUser.username }]);

  if (error) {
    alert("작성 실패: " + error.message);
  } else {
    alert("작성 완료!");
    location.href = "index.html";
  }
}

async function loadPosts() {
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .order("created_at", { ascending: false });

  const list = document.getElementById("postList");
  if (error) return (list.innerHTML = "<p>불러오기 실패</p>");

  if (!data || data.length === 0) {
    list.innerHTML = "<p>아직 글이 없습니다.</p>";
    return;
  }

  list.innerHTML = data
    .map(
      (p) => `
    <div class="card post" onclick="viewPost(${p.id})">
      <h3>${p.title}</h3>
      <p>${p.author} · ${new Date(p.created_at).toLocaleString()}</p>
    </div>`
    )
    .join("");
}

function viewPost(id) {
  location.href = `post.html?id=${id}`;
}

async function loadPostDetail() {
  const params = new URLSearchParams(location.search);
  const id = params.get("id");

  const { data: post, error } = await supabase
    .from("posts")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !post) {
    alert("게시글을 불러올 수 없습니다.");
    location.href = "index.html";
    return;
  }

  document.getElementById("postTitle").innerText = post.title;
  document.getElementById("postContent").innerText = post.content;
  document.getElementById("postMeta").innerText = `${post.author} · ${new Date(
    post.created_at
  ).toLocaleString()}`;

  // 댓글 로드
  const { data: comments } = await supabase
    .from("comments")
    .select("*")
    .eq("post_id", id)
    .order("created_at", { ascending: true });

  const list = document.getElementById("commentList");
  if (!comments || comments.length === 0)
    return (list.innerHTML = "<p>댓글이 없습니다.</p>");

  list.innerHTML = comments
    .map(
      (c) => `
    <div class="comment"><b>${c.author}</b>: ${c.content}</div>
  `
    )
    .join("");
}

async function submitComment() {
  const content = document.getElementById("commentInput").value.trim();
  if (!content) return alert("댓글을 입력해주세요.");
  if (!currentUser) return alert("로그인이 필요합니다.");

  const params = new URLSearchParams(location.search);
  const postId = params.get("id");

  const { error } = await supabase
    .from("comments")
    .insert([{ post_id: postId, author: currentUser.username, content }]);

  if (error) alert("댓글 작성 실패: " + error.message);
  else {
    alert("댓글 작성 완료!");
    location.reload();
  }
      }
