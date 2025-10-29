const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");
const fs = require("fs-extra");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// 기본 설정
app.use(express.static("public"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 세션 설정
app.use(
  session({
    secret: "whisperbox-secret",
    resave: false,
    saveUninitialized: true,
  })
);

// 데이터 파일 경로
const usersFile = path.join(__dirname, "data", "users.json");
const postsFile = path.join(__dirname, "data", "posts.json");

// 데이터 파일 초기화
fs.ensureFileSync(usersFile);
fs.ensureFileSync(postsFile);
if (fs.readFileSync(usersFile, "utf8").trim() === "") fs.writeFileSync(usersFile, "[]");
if (fs.readFileSync(postsFile, "utf8").trim() === "") fs.writeFileSync(postsFile, "[]");

// ✅ 현재 로그인 사용자 반환
app.get("/api/current-user", (req, res) => {
  res.json(req.session.user || null);
});

// ✅ 로그인
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;
  const users = await fs.readJson(usersFile);

  const found = users.find(u => u.username === username && u.password === password);
  if (!found) return res.status(401).json({ error: "아이디나 비밀번호가 틀렸습니다." });

  req.session.user = { username };
  res.json({ ok: true });
});

// ✅ 회원가입
app.post("/api/register", async (req, res) => {
  const { username, password } = req.body;
  const users = await fs.readJson(usersFile);

  if (users.some(u => u.username === username)) {
    return res.status(400).json({ error: "이미 존재하는 사용자입니다." });
  }

  users.push({ username, password });
  await fs.writeJson(usersFile, users);
  res.json({ ok: true });
});

// ✅ 로그아웃
app.post("/api/logout", (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

// ✅ 게시글 목록
app.get("/api/posts", async (req, res) => {
  const posts = await fs.readJson(postsFile);
  res.json(posts.reverse());
});

// ✅ 새 글 작성
app.post("/api/posts", async (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: "로그인 필요" });

  const { title, content } = req.body;
  if (!title || !content) return res.status(400).json({ error: "제목과 내용을 입력하세요." });

  const posts = await fs.readJson(postsFile);
  const newPost = {
    id: Date.now(),
    author: req.session.user.username,
    title,
    content,
    comments: [],
    date: new Date().toISOString(),
  };

  posts.push(newPost);
  await fs.writeJson(postsFile, posts);
  res.json({ ok: true });
});

// ✅ 특정 게시글 보기
app.get("/api/posts/:id", async (req, res) => {
  const posts = await fs.readJson(postsFile);
  const post = posts.find(p => p.id === parseInt(req.params.id));
  if (!post) return res.status(404).json({ error: "게시글 없음" });
  res.json(post);
});

// ✅ 댓글 작성
app.post("/api/posts/:id/comments", async (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: "로그인 필요" });
  const { content } = req.body;
  if (!content) return res.status(400).json({ error: "내용을 입력하세요." });

  const posts = await fs.readJson(postsFile);
  const post = posts.find(p => p.id === parseInt(req.params.id));
  if (!post) return res.status(404).json({ error: "게시글 없음" });

  post.comments.push({
    author: req.session.user.username,
    content,
    date: new Date().toISOString(),
  });

  await fs.writeJson(postsFile, posts);
  res.json({ ok: true });
});

// 서버 시작
app.listen(PORT, () => console.log(`✅ WhisperBox running on port ${PORT}`));
