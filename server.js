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
const defaultData = { users: [], posts: [] };
const adapter = new JSONFile(path.join(__dirname, "db.json"));
const db = new Low(adapter, defaultData);
await db.read();
await db.write(); // 파일 없으면 생성

// --- 미들웨어
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET || "keyboard_cat_secret",
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000*60*60*24 } // 1일
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

// --- 세션 확인
app.get("/api/me", (req,res)=>{
  if(req.session?.user) return res.json({user:req.session.user});
  return res.json({user:null});
});

// --- 회원가입
app.post("/api/signup", async (req,res)=>{
  const {username,password,nickname} = req.body;
  if(!username || !password || !nickname) return res.status(400).json({error:"모든 항목 입력"});
  const exists = db.data.users.find(u=>u.username===username);
  if(exists) return res.status(400).json({error:"이미 존재하는 아이디"});
  const user = {id:Date.now(), username, password, nickname};
  db.data.users.push(user);
  await saveDB();
  res.json({success:true, message:"회원가입 완료"});
});

// --- 로그인
app.post("/api/login", (req,res)=>{
  const {username,password} = req.body;
  if(!username || !password) return res.status(400).json({error:"아이디/비밀번호 입력"});
  if(username===ADMIN_USERNAME && password===ADMIN_PASSWORD){
    req.session.isAdmin=true;
    req.session.user={id:0, username:ADMIN_USERNAME, nickname:"관리자"};
    return res.json({success:true,isAdmin:true,nickname:"관리자"});
  }
  const user = db.data.users.find(u=>u.username===username && u.password===password);
  if(!user) return res.status(401).json({error:"아이디 또는 비밀번호 틀림"});
  req.session.user={id:user.id, username:user.username, nickname:user.nickname};
  req.session.isAdmin=false;
  res.json({success:true, nickname:user.nickname});
});

// --- 로그아웃
app.post("/api/logout",(req,res)=>{
  req.session.destroy(err=>{
    if(err) return res.status(500).json({error:"로그아웃 실패"});
    res.json({success:true});
  });
});

// --- 게시글 목록
app.get("/api/posts",(req,res)=>{
  // --- lowdb 설정 (오류 없는 안전한 방식)
const defaultData = { users: [], posts: [] };
const adapter = new JSONFile(path.join(__dirname, "db.json"));
const db = new Low(adapter, defaultData);

await db.read();
if (!db.data) db.data = defaultData; // ✅ 누락 방지
await db.write();
});

// --- 게시글 작성
app.post("/api/posts", requireLogin, async (req,res)=>{
  const {title, content} = req.body;
  if(!title||!content) return res.status(400).json({error:"제목과 내용 입력"});
  const user = req.session.user;
  const newPost = {
    id:Date.now(),
    title,
    content,
    author:user.nickname,
    authorUsername:user.username,
    comments:[],
    createdAt:new Date().toISOString()
  };
  db.data.posts.push(newPost);
  await saveDB();
  res.json({success:true, post:newPost});
});

// --- 게시글 조회
app.get("/api/posts/:id",(req,res)=>{
  const post = db.data.posts.find(p=>p.id==req.params.id);
  if(!post) return res.status(404).json({error:"게시글 없음"});
  res.json({post});
});

// --- 댓글 작성
app.post("/api/posts/:id/comments", requireLogin, async (req,res)=>{
  const {text} = req.body;
  if(!text) return res.status(400).json({error:"댓글 입력"});
  const post = db.data.posts.find(p=>p.id==req.params.id);
  if(!post) return res.status(404).json({error:"게시글 없음"});
  const user = req.session.user;
  const comment = {id:Date.now(), text, author:user.nickname, authorUsername:user.username, createdAt:new Date().toISOString()};
  post.comments.push(comment);
  await saveDB();
  res.json({success:true, post});
});

// --- 게시글 삭제
app.delete("/api/posts/:id", requireLogin, async (req,res)=>{
  const postId = Number(req.params.id);
  const post = db.data.posts.find(p=>p.id===postId);
  if(!post) return res.status(404).json({error:"게시글 없음"});
  const isAuthor = req.session.user?.username===post.authorUsername;
  if(!isAuthor && !req.session.isAdmin) return res.status(403).json({error:"삭제 권한 없음"});
  db.data.posts = db.data.posts.filter(p=>p.id!==postId);
  await saveDB();
  res.json({success:true});
});

// --- 게시글 수정
app.put("/api/posts/:id", requireLogin, async (req,res)=>{
  const postId = Number(req.params.id);
  const {title, content} = req.body;
  const post = db.data.posts.find(p=>p.id===postId);
  if(!post) return res.status(404).json({error:"게시글 없음"});
  if(req.session.user.username!==post.authorUsername) return res.status(403).json({error:"수정 권한 없음"});
  post.title = title ?? post.title;
  post.content = content ?? post.content;
  await saveDB();
  res.json({success:true, post});
});

// --- 관리자: 사용자 목록
app.get("/api/admin/users", requireAdmin,(req,res)=>{
  const users = (db.data.users||[]).map(u=>({id:u.id, username:u.username, nickname:u.nickname}));
  res.json({users});
});

// --- 관리자: 게시글 삭제
app.delete("/api/admin/posts/:id", requireAdmin, async (req,res)=>{
  const postId = Number(req.params.id);
  db.data.posts = db.data.posts.filter(p=>p.id!==postId);
  await saveDB();
  res.json({success:true});
});

// --- 관리자: DB 초기화
app.post("/api/admin/reset", requireAdmin, async (req,res)=>{
  db.data = {users:[], posts:[]};
  await saveDB();
  res.json({success:true});
});

// --- 기본 페이지
app.get("/", (req,res)=> res.sendFile(path.join(__dirname,"public","index.html")));

app.listen(PORT, ()=>console.log(`✅ 서버 실행 중: http://localhost:${PORT}`));
