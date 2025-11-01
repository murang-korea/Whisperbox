import express from "express";
import session from "express-session";
import bodyParser from "body-parser";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

app.use(bodyParser.json());
app.use(express.static("public"));
app.use(session({
  secret: "whisperbox_secret",
  resave: false,
  saveUninitialized: true
}));

// --- 회원가입 ---
app.post("/api/register", async (req, res) => {
  const { username, password } = req.body;
  const { data: exists } = await supabase.from("users").select("*").eq("username", username);
  if (exists && exists.length > 0)
    return res.status(400).json({ error: "이미 존재하는 아이디입니다." });

  await supabase.from("users").insert([{ username, password }]);
  res.json({ ok: true });
});

// --- 로그인 ---
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;
  const { data: users } = await supabase.from("users")
    .select("*")
    .eq("username", username)
    .eq("password", password)
    .limit(1);
  if (users && users.length > 0) {
    req.session.user = { username };
    res.json({ ok: true });
  } else res.status(400).json({ error: "아이디 또는 비밀번호가 틀렸습니다." });
});

// --- 세션 확인 / 로그아웃 ---
app.get("/api/current-user", (req, res) => res.json(req.session.user || null));
app.post("/api/logout", (req, res) => req.session.destroy(() => res.json({ ok: true })));

// --- 게시글 ---
app.get("/api/posts", async (_, res) => {
  const { data } = await supabase.from("posts").select("*").order("created_at", { ascending: false });
  res.json(data || []);
});

app.post("/api/posts", async (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: "로그인 필요" });
  const { title, content } = req.body;
  await supabase.from("posts").insert([{ title, content, author: req.session.user.username }]);
  res.json({ ok: true });
});

// --- 댓글 ---
app.post("/api/posts/:id/comments", async (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: "로그인 필요" });
  const { content } = req.body;
  await supabase.from("comments").insert([
    { post_id: req.params.id, author: req.session.user.username, content }
  ]);
  res.json({ ok: true });
});

app.get("/api/posts/:id/comments", async (req, res) => {
  const { data } = await supabase
    .from("comments")
    .select("*")
    .eq("post_id", req.params.id)
    .order("created_at", { ascending: true });
  res.json(data || []);
});

app.listen(PORT, () => console.log(`🧡 WhisperBox running on port ${PORT}`));
