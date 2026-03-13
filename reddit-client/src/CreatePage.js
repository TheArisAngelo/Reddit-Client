import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./App.css";

const POSTS_STORAGE_KEY = "reddit-client-created-posts";

function formatSubreddit(value) {
  return value.replace(/^r\//i, "").trim().toLowerCase();
}

export default function CreatePage() {
  const [formData, setFormData] = useState({
    title: "",
    subreddit: "",
    content: "",
    imageUrl: "",
  });
  const [posts, setPosts] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const savedPosts = localStorage.getItem(POSTS_STORAGE_KEY);

    try {
      const parsedPosts = savedPosts ? JSON.parse(savedPosts) : [];
      setPosts(Array.isArray(parsedPosts) ? parsedPosts : []);
    } catch (err) {
      setPosts([]);
    }
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));

    if (error) setError("");
    if (success) setSuccess("");
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const title = formData.title.trim();
    const subreddit = formatSubreddit(formData.subreddit);
    const content = formData.content.trim();
    const imageUrl = formData.imageUrl.trim();

    if (!title) {
      setError("Please enter a post title.");
      return;
    }

    if (!subreddit) {
      setError("Please enter a subreddit/community.");
      return;
    }

    if (!content && !imageUrl) {
      setError("Please add post content or an image URL.");
      return;
    }

    const newPost = {
      id: Date.now(),
      title,
      subreddit,
      content,
      imageUrl,
      createdAt: new Date().toLocaleString(),
      author:
        JSON.parse(localStorage.getItem("reddit-client-auth"))?.username ||
        "TheArisAngelo",
    };

    const updatedPosts = [newPost, ...posts];
    setPosts(updatedPosts);
    localStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(updatedPosts));

    setFormData({
      title: "",
      subreddit: "",
      content: "",
      imageUrl: "",
    });
    setError("");
    setSuccess("Post created successfully.");
  };

  const handleDeletePost = (postId) => {
    const updatedPosts = posts.filter((post) => post.id !== postId);
    setPosts(updatedPosts);
    localStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(updatedPosts));
  };

  const previewSubreddit = formatSubreddit(formData.subreddit || "community");

  return (
    <div className="app-shell">
      <div className="bg-orb bg-orb-1" />
      <div className="bg-orb bg-orb-2" />
      <div className="bg-grid" />

      <div className="profile-topbar">
        <div>
          <p className="eyebrow">CREATE POST</p>
          <h1 className="create-page-title">
            Share something with your community.
          </h1>
        </div>

        <div className="create-top-actions">
          <Link to="/" className="nav-btn">
            Home
          </Link>
        </div>
      </div>

      <main className="create-layout">
        <section className="create-card create-form-card">
          <div className="lane-chip">Create Page</div>

          <form className="create-form" onSubmit={handleSubmit}>
            <label className="create-field">
              <span>Post Title</span>
              <input
                type="text"
                name="title"
                placeholder="What do you want to talk about?"
                value={formData.title}
                onChange={handleChange}
              />
            </label>

            <label className="create-field">
              <span>Subreddit / Community</span>
              <div className="input-wrap create-input-wrap">
                <span className="input-prefix">r/</span>
                <input
                  type="text"
                  name="subreddit"
                  placeholder="webdev"
                  value={formData.subreddit}
                  onChange={handleChange}
                />
              </div>
            </label>

            <label className="create-field">
              <span>Post Content</span>
              <textarea
                name="content"
                rows="8"
                placeholder="Write your thoughts here..."
                value={formData.content}
                onChange={handleChange}
              />
            </label>

            <label className="create-field">
              <span>Image URL (optional)</span>
              <input
                type="text"
                name="imageUrl"
                placeholder="https://example.com/image.jpg"
                value={formData.imageUrl}
                onChange={handleChange}
              />
            </label>

            {error ? <div className="lane-error">{error}</div> : null}
            {success ? <div className="create-success">{success}</div> : null}

            <button type="submit" className="create-submit-btn">
              Post Now
            </button>
          </form>
        </section>

        <section className="create-card create-preview-card">
          <div className="lane-chip">Live Preview</div>

          <article className="created-post-card">
            <div className="created-post-top">
              <p className="created-post-community">r/{previewSubreddit}</p>
              <p className="created-post-author">
                Posted by u/
                {JSON.parse(localStorage.getItem("reddit-client-auth"))
                  ?.username || "TheArisAngelo"}
              </p>
            </div>

            <h2 className="created-post-title">
              {formData.title.trim() || "Your post title will appear here"}
            </h2>

            <p className="created-post-body">
              {formData.content.trim() ||
                "Your post content preview will appear here."}
            </p>

            {formData.imageUrl.trim() ? (
              <img
                src={formData.imageUrl}
                alt="Post preview"
                className="created-post-image"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            ) : null}
          </article>
        </section>
      </main>

      <section className="created-posts-section">
        <div className="created-posts-header">
          <p className="eyebrow">YOUR POSTS</p>
          <h2 className="created-posts-title">Created Posts</h2>
        </div>

        {posts.length === 0 ? (
          <div className="lane-status">No created posts yet.</div>
        ) : (
          <div className="created-posts-list">
            {posts.map((post) => (
              <article
                key={post.id}
                className="created-post-card saved-post-card"
              >
                <div className="created-post-top">
                  <div>
                    <p className="created-post-community">r/{post.subreddit}</p>
                    <p className="created-post-author">
                      Posted by {post.author}
                    </p>
                  </div>

                  <button
                    className="danger-btn"
                    onClick={() => handleDeletePost(post.id)}
                  >
                    Delete
                  </button>
                </div>

                <h3 className="created-post-title">{post.title}</h3>

                {post.content ? (
                  <p className="created-post-body">{post.content}</p>
                ) : null}

                {post.imageUrl ? (
                  <img
                    src={post.imageUrl}
                    alt={post.title}
                    className="created-post-image"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                ) : null}

                <p className="created-post-date">{post.createdAt}</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
