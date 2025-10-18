import express from "express";
import bodyParser from "body-parser";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));

// 메모리 DB
let users = []; // { nickname, password }
let posts = []; // { id, title, content, author, comments: [{author, text}] }
let nextPostId = 1;

// 회원가입
app.post("/signup", (req, res) => {
  const { nickname, password } = req.body;
  if (!nickname || !password) return res.status(400).json({ error: "빈 칸 있음" });
  if (users.find(u => u.nickname === nickname)) return res.status(400).json({ error: "닉네임 중복" });
  users.push({ nickname, password });
  res.json({ success: true });
});

// 로그인
app.post("/login", (req, res) => {
  const { nickname, password } = req.body;
  const user = users.find(u => u.nickname === nickname && u.password === password);
  if (!user) return res.status(400).json({ error: "로그인 실패" });
  res.json({ success: true });
});

// 게시글 목록
app.get("/posts", (req, res) => {
  res.json(posts);
});

// 게시글 작성
app.post("/posts", (req, res) => {
  const { title, content, author } = req.body;
  if (!title || !content || !author) return res.status(400).json({ error: "빈 칸 있음" });
  const post = { id: nextPostId++, title, content, author, comments: [] };
  posts.push(post);
  res.json({ success: true, post });
});

// 게시글 상세보기
app.get("/posts/:id", (req, res) => {
  const post = posts.find(p => p.id == req.params.id);
  if (!post) return res.status(404).json({ error: "게시글 없음" });
  res.json(post);
});

// 댓글 작성
app.post("/posts/:id/comments", (req, res) => {
  const post = posts.find(p => p.id == req.params.id);
  if (!post) return res.status(404).json({ error: "게시글 없음" });
  const { author, text } = req.body;
  if (!author || !text) return res.status(400).json({ error: "빈 칸 있음" });
  post.comments.push({ author, text });
  res.json({ success: true });
});

app.listen(PORT, () => console.log(`✅ 서버 실행 중 ${PORT}`));
