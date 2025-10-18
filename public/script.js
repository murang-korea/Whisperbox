let nickname = null;

async function fetchPosts() {
  const res = await fetch("/posts");
  const posts = await res.json();
  const postsDiv = document.getElementById("posts");
  postsDiv.innerHTML = "";
  posts.forEach(post => {
    const div = document.createElement("div");
    div.className = "post";
    div.innerHTML = `
      <h4>${post.title} - ${post.author}</h4>
      <p>${post.content}</p>
      <button onclick="showCommentBox(${post.id})">댓글</button>
      <div id="comments-${post.id}">
        ${post.comments.map(c => `<div class="comment">${c.author}: ${c.content}</div>`).join("")}
      </div>
      <div id="comment-box-${post.id}" style="display:none;">
        <input type="text" id="comment-input-${post.id}" placeholder="댓글 내용">
        <button onclick="addComment(${post.id})">작성</button>
      </div>
    `;
    postsDiv.appendChild(div);
  });
}

async function addPost() {
  const title = document.getElementById("title").value;
  const content = document.getElementById("content").value;
  const res = await fetch("/posts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, content })
  });
  const data = await res.json();
  if (data.success) fetchPosts();
  else alert(data.error);
}

function showCommentBox(id) {
  const box = document.getElementById(`comment-box-${id}`);
  box.style.display = box.style.display === "none" ? "block" : "none";
}

async function addComment(postId) {
  const input = document.getElementById(`comment-input-${postId}`);
  const content = input.value;
  const res = await fetch(`/posts/${postId}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content })
  });
  const data = await res.json();
  if (data.success) {
    fetchPosts();
    input.value = "";
  } else alert(data.error);
}

async function logout() {
  await fetch("/logout", { method: "POST" });
  nickname = null;
  document.getElementById("user-area").innerText = "";
}

fetchPosts();
