import express from "express";
import bodyParser from "body-parser";
import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";

const app = express();
const port = process.env.PORT || 10000;

// DB 초기 설정
const adapter = new JSONFile("db.json");
const db = new Low(adapter, { users: [], posts: [] });

await db.read();
db.data ||= { users: [], posts: [] };

app.use(bodyParser.json());
app.use(express.static("public"));

// 회원가입
app.post("/signup", async (req, res) => {
  const { username, password, nickname } = req.body;
  if (db.data.users.find(u => u.username === username)) {
    return res.status(400).json({ message: "이미 존재하는 닉네임임" });
  }
  db.data.users.push({ username, password, nickname });
  await db.write();
  res.json({ message: "회원가입 완료" });
});

// 로그인
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  const user = db.data.users.find(u => u.username === username && u.password === password);
  if (!user) return res.status(401).json({ message: "로그인 실패" });
  res.json({ message: "로그인 성공", nickname: user.nickname });
});

// 게시글 목록
app.get("/posts", (req, res) => {
  res.json(db.data.posts);
});

// 게시글 작성
app.post("/posts", async (req, res) => {
  const { title, content, nickname } = req.body;
  const newPost = { id: Date.now(), title, content, nickname, comments: [] };
  db.data.posts.push(newPost);
  await db.write();
  res.json(newPost);
});

// 댓글 추가
app.post("/posts/:id/comments", async (req, res) => {
  const post = db.data.posts.find(p => p.id == req.params.id);
  if (!post) return res.status(404).json({ message: "게시글 없음" });
  post.comments.push({ text: req.body.text, nickname: req.body.nickname });
  await db.write();
  res.json(post);
});

// 초기화 (관리자용)
app.post("/reset", async (req, res) => {
  db.data = { users: [], posts: [] };
  await db.write();
  res.json({ message: "DB 초기화 완료" });
});

app.listen(port, () => console.log(`✅ 서버 실행 중: ${port}`));
