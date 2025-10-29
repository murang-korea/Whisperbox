const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");
const fs = require("fs-extra");
const path = require("path");
const app = express();

const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(express.static("public"));
app.use(session({
  secret: "whisperbox_secret",
  resave: false,
  saveUninitialized: true
}));

const USERS_FILE = path.join(__dirname, "data/users.json");
const POSTS_FILE = path.join(__dirname, "data/posts.json");

// 초기 JSON 파일 생성
fs.ensureFileSync(USERS_FILE);
fs.ensureFileSync(POSTS_FILE);
if (!fs.readJsonSync(USERS_FILE, { throws: false })) fs.writeJsonSync(USERS_FILE, []);
if (!fs.readJsonSync(POSTS_FILE, { throws: false })) fs.writeJsonSync(POSTS_FILE, []);

// --- 인증 관련 ---
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;
  const users = await fs.readJson(USERS_FILE);
  const user = users.find(u => u.username === username && u.password === password);
  if (user) {
    req.session.user = { username };
    res.json({ ok: true });
  } else {
    res.status(400).json({ error: "아이디 또는 비밀번호가 틀렸습니다." });
  }
});

app.post("/api/register", async (req, res) => {
  const { username, password } = req.body;
  const users = await fs.readJson(USERS_FILE);
  if (users.find(u => u.username === username)) {
    return res.status(400).json({ error: "이미 존재하는 아이디입니다." });
  }
  users.push({ username, password });
  await fs.writeJson(USERS_FILE, users);
  res.json({ ok: true });
});

app.get("/api/current-user", (req, res) => {
  res.json(req.session.user || null);
});

app.post("/api/logout", (req, res) => {
  req.session.destroy(err => {
    if (err) return res.status(500).json({ error: "로그아웃 실패" });
    res.json({ ok: true });
  });
});

// --- 게시글/댓글 ---
app.get("/api/posts", async (req, res) => {
  const posts = await fs.readJson(POSTS_FILE);
  res.json(posts);
});

app.post("/api/posts", async (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: "로그인 필요" });
  const { title, content } = req.body;
  const posts = await fs.readJson(POSTS_FILE);
  const newPost = {
    id: Date.now(),
    title,
    content,
    author: req.session.user.username,
    date: new Date(),
    comments: []
  };
  posts.push(newPost);
  await fs.writeJson(POSTS_FILE, posts);
  res.json({ ok: true });
});

app.get("/api/posts/:id", async (req, res) => {
  const posts = await fs.readJson(POSTS_FILE);
  const post = posts.find(p => p.id == req.params.id);
  if (!post) return res.status(404).json({ error: "게시글 없음" });
  res.json(post);
});

app.post("/api/posts/:id/comments", async (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: "로그인 필요" });
  const { content } = req.body;
  const posts = await fs.readJson(POSTS_FILE);
  const post = posts.find(p => p.id == req.params.id);
  if (!post) return res.status(404).json({ error: "게시글 없음" });

  post.comments.push({
    content,
    author: req.session.user.username,
    date: new Date()
  });
  await fs.writeJson(POSTS_FILE, posts);
  res.json({ ok: true });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
