// ✅ 글 목록 불러오기
if (location.pathname.endsWith("index.html") || location.pathname === "/") {
  fetch("/api/posts")
    .then((res) => res.json())
    .then((posts) => {
      const list = document.getElementById("posts");
      list.innerHTML = posts
        .map(
          (p) => `
        <div class="post" onclick="location.href='view.html?id=${p.id}'">
          <h3>${p.title}</h3>
          <p>${p.content.slice(0, 60)}...</p>
          <small>${new Date(p.createdAt).toLocaleString()}</small>
        </div>`
        )
        .join("");
    });
}

// ✅ 글 작성
function submitPost() {
  const title = document.getElementById("title").value.trim();
  const content = document.getElementById("content").value.trim();
  if (!title || !content) return alert("제목과 내용을 입력하세요!");

  fetch("/api/posts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, content }),
  })
    .then((r) => r.json())
    .then(() => location.href = "index.html");
}

// ✅ 글 보기 + 댓글
if (location.pathname.endsWith("view.html")) {
  const id = new URLSearchParams(location.search).get("id");
  fetch("/api/posts")
    .then((r) => r.json())
    .then((posts) => {
      const post = posts.find((p) => p.id == id);
      if (!post) return (document.body.innerHTML = "<p>글을 찾을 수 없습니다.</p>");
      document.getElementById("post").innerHTML = `
        <div class="post">
          <h2>${post.title}</h2>
          <p>${post.content}</p>
          <hr>
          <h4>답장</h4>
          ${
            post.replies.length
              ? post.replies.map(r => `<p>• ${r.content}</p>`).join("")
              : "<p>아직 답장이 없습니다.</p>"
          }
        </div>`;
    });
}

// ✅ 댓글 작성
function submitReply() {
  const id = new URLSearchParams(location.search).get("id");
  const content = document.getElementById("reply").value.trim();
  if (!content) return alert("답장 내용을 입력하세요!");

  fetch(`/api/posts/${id}/reply`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  }).then(() => location.reload());
}
