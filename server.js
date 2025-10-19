import express from "express";
import session from "express-session";
import bodyParser from "body-parser";
import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 10000;

// --- lowdb 설정
const adapter = new JSONFile(path.join(__dirname, "db.json"));
const db = new Low(adapter);
await db.read();
db.data ||= { users: [], posts: [] };
await db.write();

// --- 미들웨어
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET || "keyboard_cat_secret",
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000*60*60*24 }
}));
app.use(express.static(path.join(__dirname, "public")));

// --- 관리자 계정
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "1234";

// --- 유틸
const saveDB = async () => await db.write();
const requireLogin = (req,res,next) => {
  if(!req.session?.user) return res.status(401).json({error:"로그인 필요"});
  next();
};
const requireAdmin = (req,res,next) => {
  if(!req.session?.isAdmin) return res.status(403).json({error:"관리자 인증 필요"});
  next();
};

// --- API
app.get("/api/me", (req,res)=>{
  res.json({ user: req.session.user || null });
});

app.post("/api/signup", async (req,res)=>{
  const {username,password,nickname} = req.body;
  if(!username || !password || !nickname) return res.status(400).json({error:"모든 항목 입력"});
  if(db.data.users.find(u=>u.username===username)) return res.status(400).json({error:"이미 존재하는 아이디"});
  const user = { id:Date.now(), username, password, nickname };
  db.data.users.push(user);
  await saveDB();
  res.json({success:true});
});

app.post("/api/login", (req,res)=>{
  const {username,password} = req.body;
  if(!username || !password) return res.status(400).json({error:"아이디/비밀번호 입력"});
  if(username===ADMIN_USERNAME && password===ADMIN_PASSWORD){
    req.session.isAdmin=true;
    req.session.user={id:0, username:ADMIN_USERNAME, nickname:"관리자"};
    return res.json({success:true, isAdmin:true, nickname:"관리자"});
  }
  const user = db.data.users.find(u=>u.username===username && u.password===password);
  if(!user) return res.status(401).json({error:"아이디 또는 비밀번호 틀림"});
  req.session.user = {id:user.id, username:user.username, nickname:user.nickname};
  req.session.isAdmin=false;
  res.json({success:true, nickname:user.nickname});
});

app.post("/api/logout",(req,res)=>{
  req.session.destroy(err=>{
    if(err) return res.status(500).json({error:"로그아웃 실패"});
    res.json({success:true});
  });
});

app.get("/api/posts", async (req,res)=>{
  await db.read();
  const posts = (db.data.posts||[]).slice().sort(()=>Math.random()-0.5);
  res.json({ posts });
});

app.post("/api/posts", requireLogin, async (req,res)=>{
  const {title, content} = req.body;
  if(!title || !content) return res.status(400).json({error:"제목과 내용 입력"});
  const user = req.session.user;
  const newPost = { id:Date.now(), title, content, author:user.nickname, authorUsername:user.username, comments:[], createdAt:new Date().toISOString() };
  db.data.posts.push(newPost);
  await saveDB();
  res.json({success:true, post:newPost});
});

app.get("/api/posts/:id", async (req,res)=>{
  await db.read();
  const post = db.data.posts.find(p=>p.id==req.params.id);
  if(!post) return res.status(404).json({error:"게시글 없음"});
  res.json({post});
});

app.post("/api/posts/:id/comments", requireLogin, async (req,res)=>{
  const {text} = req.body;
  if(!text) return res.status(400).json({error:"댓글 입력"});
  const post = db.data.posts.find(p=>p.id==req.params.id);
  if(!post) return res.status(404).json({error:"게시글 없음"});
  const user = req.session.user;
  post.comments.push({id:Date.now(), text, author:user.nickname, authorUsername:user.username, createdAt:new Date().toISOString()});
  await saveDB();
  res.json({success:true});
});

app.listen(PORT, ()=>console.log(`✅ 서버 실행: http://localhost:${PORT}`));
