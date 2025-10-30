import express from "express";
import session from "express-session";
import bodyParser from "body-parser";
import { Pool } from "pg";
import path from "path";
import bcrypt from "bcrypt";

const app = express();
const PORT = process.env.PORT || 3000;

// PostgreSQL 연결
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

app.use(bodyParser.json());
app.use(express.static("public"));
app.use(session({
  secret: "whisperbox_secret",
  resave: false,
  saveUninitialized: true
}));

// 테이블 자동 생성
(async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS posts (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      author TEXT NOT NULL,
      date TIMESTAMP DEFAULT NOW()
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS comments (
      id SERIAL PRIMARY KEY,
      post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
      author TEXT NOT NULL,
      content TEXT NOT NULL,
      date TIMESTAMP DEFAULT NOW()
    );
  `);
  console.log("✅ DB ready!");
})();

// --- 회원가입 ---
app.post("/api/register", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: "아이디와 비밀번호를 입력하세요." });

  try {
    const hash = await bcrypt.hash(password, 10);
    await pool.query("INSERT INTO users (username, password) VALUES ($1, $2)", [username, hash]);
    res.json({ ok: true });
  } catch (e) {
    if (e.code === "23505") return res.status(400).json({ error: "이미 존재하는 아이디입니다." });
    console.error(e);
    res.status(500).json({ error: "회원가입 실패" });
  }
});

// --- 로그인 ---
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;
  const result = await pool.query("SELECT * FROM users WHERE username=$1", [username]);
  const user = result.rows[0];
  if (!user) return res.status(400).json({ error: "존재하지 않는 사용자입니다." });

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(400).json({ error: "비밀번호가 틀렸습니다." });

  req.session.user = { username };
  res.json({ ok: true });
});

// --- 현재 사용자 ---
app.get("/api/current-user", (req, res) => {
  res.json(req.session.user || null);
});

// --- 로그아웃 ---
app.post("/api/logout", (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

// --- 글 목록 ---
app.get("/api/posts", async (req, res) => {
  const { rows } = await pool.query("SELECT * FROM posts ORDER BY id DESC");
  res.json(rows);
});

// --- 글 작성 ---
app.post("/api/posts", async (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: "로그인 필요" });
  const { title, content } = req.body;
  await pool.query(
    "INSERT INTO posts (title, content, author) VALUES ($1, $2, $3)",
    [title, content, req.session.user.username]
  );
  res.json({ ok: true });
});

// --- 특정 글 + 댓글 ---
app.get("/api/posts/:id", async (req, res) => {
  const { id } = req.params;
  const post = await pool.query("SELECT * FROM posts WHERE id=$1", [id]);
  const comments = await pool.query("SELECT * FROM comments WHERE post_id=$1 ORDER BY id ASC", [id]);
  if (!post.rows[0]) return res.status(404).json({ error: "게시글 없음" });
  res.json({ ...post.rows[0], comments: comments.rows });
});

// --- 댓글 작성 ---
app.post("/api/posts/:id/comments", async (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: "로그인 필요" });
  const { content } = req.body;
  const { id } = req.params;
  await pool.query(
    "INSERT INTO comments (post_id, author, content) VALUES ($1, $2, $3)",
    [id, req.session.user.username, content]
  );
  res.json({ ok: true });
});

app.listen(PORT, () => console.log(`🚀 WhisperBox DB version running on ${PORT}`));
