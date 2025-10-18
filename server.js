import express from "express";
import session from "express-session";
import bodyParser from "body-parser";
import fs from "fs-extra";
import path from "path";

const app = express();
const PORT = process.env.PORT || 10000;

const DB_FILE = path.resolve("./db.json");

// JSON 초기화
if (!fs.existsSync(DB_FILE)) {
  fs.writeJsonSync(DB_FILE, { users: [], posts: [] });
}

// 미들웨어
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: "secret_key",
  resave: false,
  saveUninitialized: true
}));
app.use(express.static("public"));

// 유틸
const readDB = () => fs.readJsonSync(DB_FILE);
const writeDB = (data) => fs.writeJsonSync(DB_FILE, data);

// 로그인 확인
const requireLogin = (req, res, next) => {
  if (!req.session.userId) return res.status(401).json({ error: "로그인 필요" });
  next();
};

// 회원가입
app.post("/signup", (req, res) => {
  const { username, nickname, password } = req.body;
  if (!username || !password || !nickname) return res.status(400).json({ error: "모든 항목 필요" });

  const db = readDB();
  if (db.users.find(u => u.username === username)) return res.status(400).json({ error: "이미 존재하는 아이디" });

  db.users.push({ id: Date.now(), username, nickname, password });
  writeDB(db);
  res.json({ success: true });
});

// 로그인
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  const db = readDB();
  const user = db.users.find(u => u.username === username && u.password === password);
  if (!user) return res.status(400).json({ error: "아이디 또는 비밀번호 틀림" });

  req.session.userId = user.id;
  req.session.nickname = user.nickname;
  res.json({ success: true, nickname: user.nickname });
});

// 로그아웃
app.post("/logout", (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

// 게시글 목록
app.get("/posts", (req, res) => {
  const db = readDB();
  res.json(db.posts);
});

// 게시글 작성
app.post("/posts", requireLogin, (req, res) => {
  const { title, content } = req.body;
  if (!title || !content) return res.status(400).json({ error: "제목/내용 필요" });

  const db = readDB();
  const post = {
    id: Date.now(),
    title,
    content,
    author: req.session.nickname,
    comments: []
  };
  db.posts.push(post);
  writeDB(db);
  res.json({ success: true, post });
});

// 댓글 작성
app.post("/posts/:id/comments", requireLogin, (req, res) => {
  const { content } = req.body;
  const postId = parseInt(req.params.id);
  if (!content) return res.status(400).json({ error: "내용 필요" });

  const db = readDB();
  const post = db.posts.find(p => p.id === postId);
  if (!post) return res.status(404).json({ error: "게시글 없음" });

  post.comments.push({ content, author: req.session.nickname, id: Date.now() });
  writeDB(db);
  res.json({ success: true, post });
});

app.listen(PORT, () => console.log(`✅ 서버 실행 중: ${PORT}`));
