import React, { useEffect, useMemo, useState } from "react";
import { Routes, Route, Link } from "react-router-dom";
import "./App.css";
import Profile from "./Profile";
import CreatePage from "./CreatePage";

const DEFAULT_SUBREDDITS = ["reactjs", "javascript", "webdev"];
const STORAGE_KEY = "reddit-client-lanes";

function normalizeSubredditName(value) {
  return value.replace(/^r\//i, "").trim().toLowerCase();
}

async function fetchSubredditPosts(subreddit) {
  const response = await fetch(
    `https://www.reddit.com/r/${subreddit}.json?raw_json=1`,
  );

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`r/${subreddit} was not found.`);
    }
    throw new Error("Unable to fetch subreddit right now.");
  }

  const data = await response.json();

  if (!data?.data?.children) {
    throw new Error(`r/${subreddit} is unavailable.`);
  }

  return data.data.children.map((child) => {
    const post = child.data;
    return {
      id: post.id,
      title: post.title,
      author: post.author,
      ups: post.ups,
      numComments: post.num_comments,
      permalink: `https://www.reddit.com${post.permalink}`,
      thumbnail: post.thumbnail,
    };
  });
}

function AddLaneForm({ onAdd, isSubmitting }) {
  const [input, setInput] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    const subreddit = normalizeSubredditName(input);

    if (!subreddit) {
      setError("Enter a subreddit name.");
      return;
    }

    setError("");

    try {
      const result = await onAdd(subreddit);
      if (result?.error) {
        setError(result.error);
      } else {
        setInput("");
      }
    } catch (err) {
      setError("Something went wrong.");
    }
  };

  return (
    <form className="add-lane-form" onSubmit={handleSubmit}>
      <div className="form-topline">
        <span className="form-badge">Add Feed</span>
      </div>

      <div className="input-row">
        <div className="input-wrap">
          <span className="input-prefix">r/</span>
          <input
            type="text"
            placeholder="technology"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isSubmitting}
          />
        </div>

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Adding..." : "Add Lane"}
        </button>
      </div>

      {error ? <p className="form-error">{error}</p> : null}
    </form>
  );
}

function PostCard({ post }) {
  const validThumbnail =
    post.thumbnail &&
    post.thumbnail.startsWith("http") &&
    !["self", "default", "nsfw", "spoiler", "image"].includes(post.thumbnail);

  return (
    <article className="post-card">
      <div className="post-content">
        <h3 className="post-title">
          <a href={post.permalink} target="_blank" rel="noreferrer">
            {post.title}
          </a>
        </h3>

        <div className="post-meta">
          <span>👤 u/{post.author}</span>
          <span>⬆ {post.ups}</span>
          <span>💬 {post.numComments}</span>
        </div>
      </div>

      {validThumbnail ? (
        <img className="post-thumb" src={post.thumbnail} alt={post.title} />
      ) : (
        <div className="post-thumb post-thumb-fallback">r</div>
      )}
    </article>
  );
}

function Lane({ lane, onRemove, onRefresh }) {
  return (
    <section className="lane">
      <div className="lane-glow" />
      <div className="lane-header">
        <div>
          <div className="lane-chip">Subreddit lane</div>
          <h2>r/{lane.name}</h2>
          <p className="lane-subtitle">
            {lane.loading
              ? "Pulling fresh posts..."
              : lane.error
                ? "Could not load this feed"
                : `${lane.posts.length} posts ready`}
          </p>
        </div>

        <div className="lane-actions">
          <button
            className="secondary-btn"
            onClick={() => onRefresh(lane.name)}
            disabled={lane.loading}
          >
            Refresh
          </button>
          <button
            className="danger-btn"
            onClick={() => onRemove(lane.name)}
            disabled={lane.loading}
          >
            Remove
          </button>
        </div>
      </div>

      {lane.loading ? (
        <div className="lane-status">
          Loading the latest from r/{lane.name}...
        </div>
      ) : null}

      {lane.error ? <div className="lane-error">{lane.error}</div> : null}

      {!lane.loading && !lane.error && lane.posts.length === 0 ? (
        <div className="lane-status">No posts found.</div>
      ) : null}

      <div className="posts-list">
        {lane.posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </section>
  );
}

function HomePage() {
  const [lanes, setLanes] = useState([]);
  const [isAdding, setIsAdding] = useState(false);

  const laneNames = useMemo(() => lanes.map((lane) => lane.name), [lanes]);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const parsed = saved ? JSON.parse(saved) : null;
    const initialNames =
      Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_SUBREDDITS;

    setLanes(
      initialNames.map((name) => ({
        name,
        posts: [],
        loading: true,
        error: "",
      })),
    );
  }, []);

  useEffect(() => {
    if (lanes.length === 0) return;
    const names = lanes.map((lane) => lane.name);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(names));
  }, [lanes]);

  useEffect(() => {
    async function loadInitialLanes() {
      const lanesToLoad = lanes.filter(
        (lane) => lane.loading && lane.posts.length === 0 && !lane.error,
      );

      for (const lane of lanesToLoad) {
        await refreshLane(lane.name);
      }
    }

    if (lanes.length > 0) {
      loadInitialLanes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lanes.length]);

  const refreshLane = async (subreddit) => {
    setLanes((current) =>
      current.map((lane) =>
        lane.name === subreddit ? { ...lane, loading: true, error: "" } : lane,
      ),
    );

    try {
      const posts = await fetchSubredditPosts(subreddit);

      setLanes((current) =>
        current.map((lane) =>
          lane.name === subreddit
            ? { ...lane, posts, loading: false, error: "" }
            : lane,
        ),
      );
    } catch (error) {
      setLanes((current) =>
        current.map((lane) =>
          lane.name === subreddit
            ? {
                ...lane,
                posts: [],
                loading: false,
                error: error.message || "Failed to load posts.",
              }
            : lane,
        ),
      );
    }
  };

  const addLane = async (subreddit) => {
    const normalized = normalizeSubredditName(subreddit);

    if (laneNames.includes(normalized)) {
      return { error: `r/${normalized} is already added.` };
    }

    setIsAdding(true);

    try {
      const posts = await fetchSubredditPosts(normalized);

      setLanes((current) => [
        ...current,
        {
          name: normalized,
          posts,
          loading: false,
          error: "",
        },
      ]);

      return { ok: true };
    } catch (error) {
      return {
        error: error.message || `Could not add r/${normalized}.`,
      };
    } finally {
      setIsAdding(false);
    }
  };

  const removeLane = (subreddit) => {
    setLanes((current) => current.filter((lane) => lane.name !== subreddit));
  };

  return (
    <div className="app-shell">
      <div className="bg-orb bg-orb-1" />
      <div className="bg-orb bg-orb-2" />
      <div className="bg-grid" />

      <header className="app-header">
        <div className="hero-copy">
          <p className="eyebrow">REDDIT COMMAND CENTER</p>
          <h1>Track multiple subreddits in a bold, live lane board.</h1>
          <p className="app-description">
            Build your own Reddit dashboard, add feeds instantly, refresh them
            on demand, and keep your setup saved between sessions.
          </p>
        </div>

        <div className="header-side">
          <div className="home-nav-group">
            <Link to="/profile" className="nav-btn">
              Profile Page
            </Link>
            <Link to="/create" className="nav-btn nav-btn-alt">
              Create Page
            </Link>
          </div>

          <AddLaneForm onAdd={addLane} isSubmitting={isAdding} />
        </div>
      </header>

      <main className="lanes-grid">
        {lanes.map((lane) => (
          <Lane
            key={lane.name}
            lane={lane}
            onRemove={removeLane}
            onRefresh={refreshLane}
          />
        ))}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/create" element={<CreatePage />} />
    </Routes>
  );
}
