import express from "express";
import bodyParser from "body-parser";
import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 10000;

// 🗂️ DB 세팅
const adapter = new JSONFile("db.json");
const db = new Low(adapter, { users: [], posts: [] });
await db.read();
db.data ||= { users: [], posts: [] };

app.use(bodyParser.json());
app.use(express.static("public"));

// 관리자 계정 (여기서만 설정)
const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "1234";

// 🧾 회원가입
app.post("/signup", async (req, res) => {
  const { username, password, nickname } = req.body;
  if (db.data.users.find(u => u.username === username)) {
    return res.status(400).json({ message: "이미 존재하는 아이디" });
  }
  db.data.users.push({ username, password, nickname });
  await db.write();
  res.json({ message: "회원가입 완료" });
});

// 🔑 로그인
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  const user = db.data.users.find(u => u.username === username && u.password === password);
  if (!user) return res.status(401).json({ message: "로그인 실패" });
  res.json({ message: "로그인 성공", nickname: user.nickname });
});

// 👑 관리자 로그인
app.post("/admin-login", (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    res.json({ success: true, message: "관리자 로그인 성공" });
  } else {
    res.status(403).json({ success: false, message: "관리자 인증 실패" });
  }
});

// 📜 게시글 목록
app.get("/posts", (req, res) => {
  res.json(db.data.posts.sort((a, b) => b.id - a.id));
});

// ✏️ 게시글 작성
app.post("/posts", async (req, res) => {
  const { title, content, nickname } = req.body;
  if (!title || !content || !nickname)
    return res.status(400).json({ message: "필수 항목 누락" });

  const newPost = {
    id: Date.now(),
    title,
    content,
    nickname,
    comments: [],
    createdAt: new Date().toLocaleString("ko-KR"),
  };
  db.data.posts.push(newPost);
  await db.write();
  res.json(newPost);
});

// 💬 댓글 작성
app.post("/posts/:id/comments", async (req, res) => {
  const post = db.data.posts.find(p => p.id == req.params.id);
  if (!post) return res.status(404).json({ message: "게시글 없음" });
  post.comments.push({ text: req.body.text, nickname: req.body.nickname });
  await db.write();
  res.json(post);
});

// ❌ 게시글 삭제 (관리자만)
app.delete("/posts/:id", async (req, res) => {
  db.data.posts = db.data.posts.filter(p => p.id != req.params.id);
  await db.write();
  res.json({ message: "게시글 삭제 완료" });
});

// 🧹 DB 초기화 (관리자 전용)
app.post("/reset", async (req, res) => {
  db.data = { users: [], posts: [] };
  await db.write();
  res.json({ message: "DB 초기화 완료" });
});

// 🧭 라우팅
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "public/index.html")));
app.get("/login", (req, res) => res.sendFile(path.join(__dirname, "public/login.html")));
app.get("/signup", (req, res) => res.sendFile(path.join(__dirname, "public/signup.html")));
app.get("/write", (req, res) => res.sendFile(path.join(__dirname, "public/write.html")));
app.get("/admin", (req, res) => res.sendFile(path.join(__dirname, "public/admin.html")));

app.listen(port, () => console.log(`✅ 서버 실행 중 (포트 ${port})`));
