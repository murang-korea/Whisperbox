const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

app.use(bodyParser.json());
app.use(express.static("public"));
app.use(
  session({
    secret: process.env.SESSION_SECRET || "secret",
    resave: false,
    saveUninitialized: true,
  })
);

// ---------------- 로그인 & 회원가입 ----------------
app.post("/api/register", async (req, res) => {
  const { username, password } = req.body;
  const { data: existing } = await supabase.from("users").select("*").eq("username", username).single();
  if (existing) return res.status(400).json({ error: "이미 존재하는 아이디입니다." });

  const { error } = await supabase.from("users").insert([{ username, password }]);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;
  const { data: user } = await supabase
    .from("users")
    .select("*")
    .eq("username", username)
    .eq("password", password)
    .single();

  if (!user) return res.status(400).json({ error: "아이디 또는 비밀번호가 틀렸습니다." });
  req.session.user = { username };
  res.json({ ok: true });
});

app.get("/api/current-user", (req, res) => res.json(req.session.user || null));

app.post("/api/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ error: "로그아웃 실패" });
    res.json({ ok: true });
  });
});

// ---------------- 게시글 ----------------
app.get("/api/posts", async (req, res) => {
  const { data, error } = await supabase.from("posts").select("*").order("id", { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.post("/api/posts", async (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: "로그인 필요" });
  const { title, content } = req.body;
  const { error } = await supabase
    .from("posts")
    .insert([{ title, content, author: req.session.user.username }]);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

// ---------------- 댓글 ----------------
app.get("/api/posts/:id/comments", async (req, res) => {
  const { data, error } = await supabase
    .from("comments")
    .select("*")
    .eq("post_id", req.params.id)
    .order("id", { ascending: true });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.post("/api/posts/:id/comments", async (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: "로그인 필요" });
  const { content } = req.body;
  const { error } = await supabase.from("comments").insert([
    { post_id: req.params.id, content, author: req.session.user.username },
  ]);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

app.listen(PORT, () => console.log(`🚀 WhisperBox Supabase 서버 ON : ${PORT}`));
