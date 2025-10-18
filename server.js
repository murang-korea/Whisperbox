import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 10000;
const DATA_FILE = path.join(__dirname, "data.json");

app.use(express.static("public"));
app.use(express.json());

// ✅ 데이터 로드
function loadData() {
  if (!fs.existsSync(DATA_FILE)) return { posts: [] };
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
}

// ✅ 데이터 저장
function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// 📄 모든 글 가져오기
app.get("/api/posts", (req, res) => {
  res.json(loadData().posts);
});

// ✏️ 새 글 작성
app.post("/api/posts", (req, res) => {
  const { title, content } = req.body;
  if (!title || !content) return res.status(400).json({ error: "빈칸 있음!" });

  const data = loadData();
  const newPost = {
    id: Date.now(),
    title,
    content,
    likes: 0,
    replies: [],
    createdAt: new Date().toISOString(),
  };
  data.posts.unshift(newPost);
  saveData(data);
  res.json(newPost);
});

// 💬 댓글 달기
app.post("/api/posts/:id/reply", (req, res) => {
  const { content } = req.body;
  const { id } = req.params;
  const data = loadData();
  const post = data.posts.find((p) => p.id == id);
  if (!post) return res.status(404).json({ error: "글 없음" });

  const reply = { id: Date.now(), content };
  post.replies.push(reply);
  saveData(data);
  res.json(reply);
});

app.listen(PORT, () => console.log(`✅ 서버 실행됨: ${PORT}`));
