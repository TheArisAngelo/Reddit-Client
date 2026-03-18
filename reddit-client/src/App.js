import React, { useEffect, useMemo, useState } from "react";
import { Routes, Route, Link, Navigate } from "react-router-dom";
import "./App.css";
import Profile from "./Profile";
import CreatePage from "./CreatePage";
import LoginPage from "./LoginPage";
import SignUpPage from "./SignUpPage";
import NewsPage from "./NewsPage";
import ForgotPassword from "./ForgotPassword";

const DEFAULT_SUBREDDITS = [
  "reactjs",
  "javascript",
  "webdev",
  "memes",
  "dankmemes",
  "ProgrammerHumor",
];
const STORAGE_KEY = "reddit-client-lanes";
const AUTH_STORAGE_KEY = "reddit-client-auth";

function normalizeSubredditName(value) {
  return value.replace(/^r\//i, "").trim().toLowerCase();
}

function getStoredAuth() {
  const saved = localStorage.getItem(AUTH_STORAGE_KEY);

  try {
    const parsed = saved ? JSON.parse(saved) : null;
    return parsed?.isLoggedIn ? parsed : { isLoggedIn: false, username: "" };
  } catch (error) {
    return { isLoggedIn: false, username: "" };
  }
}

function normalizeSearchInput(value) {
  return value.trim().replace(/^r\//i, "");
}

async function parseJsonResponse(response) {
  const contentType = response.headers.get("content-type") || "";
  const text = await response.text();

  if (!contentType.includes("application/json")) {
    throw new Error(
      "API returned HTML instead of JSON. Check your backend route or dev proxy.",
    );
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new Error("API returned invalid JSON");
  }
}

async function fetchSubredditPosts(subreddit) {
  const cleanSubreddit = normalizeSubredditName(subreddit);

  const response = await fetch(
    `/api/reddit/subreddit/${encodeURIComponent(cleanSubreddit)}?limit=12`,
  );

  const data = await parseJsonResponse(response);

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(data.error || `r/${cleanSubreddit} was not found.`);
    }

    throw new Error(data.error || "Unable to fetch subreddit right now.");
  }

  return data.posts || [];
}

async function findSubredditByTopic(query) {
  const cleanQuery = normalizeSearchInput(query);

  const response = await fetch(
    `/api/reddit/search-subreddits?q=${encodeURIComponent(cleanQuery)}&limit=5`,
  );

  const data = await parseJsonResponse(response);

  if (!response.ok) {
    throw new Error(data.error || "Unable to search for that topic now.");
  }

  const results = data.results || [];

  if (results.length === 0) {
    throw new Error(`No subreddit found for "${cleanQuery}".`);
  }

  const exactMatch = results.find(
    (item) => item?.display_name?.toLowerCase() === cleanQuery.toLowerCase(),
  );

  const bestMatch = exactMatch || results[0];
  const subredditName = bestMatch?.display_name;

  if (!subredditName) {
    throw new Error(`No subreddit found for "${cleanQuery}".`);
  }

  return subredditName;
}

async function resolveLaneToSubreddit(input) {
  const cleaned = normalizeSearchInput(input);

  if (!cleaned) {
    throw new Error("Enter a subreddit name or topic.");
  }

  try {
    await fetchSubredditPosts(cleaned);
    return normalizeSubredditName(cleaned);
  } catch (error) {
    const matchedSubreddit = await findSubredditByTopic(cleaned);
    return normalizeSubredditName(matchedSubreddit);
  }
}

function AddLaneForm({ onAdd, isSubmitting }) {
  const [input, setInput] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    const cleaned = input.trim();

    if (!cleaned) {
      setError("Enter a subreddit name or topic.");
      return;
    }

    setError("");

    try {
      const result = await onAdd(cleaned);
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

function ProtectedRoute({ isLoggedIn, children }) {
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function SideNav({ auth, onLogout }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        className={`side-nav-toggle ${isOpen ? "open" : ""}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? "✕" : "☰"}
      </button>

      <aside className={`side-nav ${isOpen ? "open" : ""}`}>
        <div className="side-nav-header">
          <h3>Menu</h3>
          <p>{auth.isLoggedIn ? `Hi, ${auth.username}` : "Welcome"}</p>
        </div>

        <div className="side-nav-links">
          {!auth.isLoggedIn ? (
            <>
              <Link
                to="/login"
                className="side-nav-link"
                onClick={() => setIsOpen(false)}
              >
                Log In
              </Link>
              <Link
                to="/signup"
                className="side-nav-link side-nav-link-alt"
                onClick={() => setIsOpen(false)}
              >
                Sign Up
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/profile"
                className="side-nav-link"
                onClick={() => setIsOpen(false)}
              >
                Profile
              </Link>
              <Link
                to="/news"
                className="side-nav-link"
                onClick={() => setIsOpen(false)}
              >
                News
              </Link>
              <Link
                to="/create"
                className="side-nav-link side-nav-link-alt"
                onClick={() => setIsOpen(false)}
              >
                Create Page
              </Link>
              <button
                className="side-nav-link side-nav-logout"
                onClick={() => {
                  onLogout();
                  setIsOpen(false);
                }}
              >
                Log Out
              </button>
            </>
          )}
        </div>
      </aside>

      {isOpen && (
        <div className="side-nav-overlay" onClick={() => setIsOpen(false)} />
      )}
    </>
  );
}

function HomePage({ auth, onLogout }) {
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

    if (lanes.length > 0 && auth.isLoggedIn) {
      loadInitialLanes();
    }
  }, [lanes.length, auth.isLoggedIn]);

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

  const addLane = async (input) => {
    setIsAdding(true);

    try {
      const resolvedSubreddit = await resolveLaneToSubreddit(input);

      if (laneNames.includes(resolvedSubreddit)) {
        return { error: `r/${resolvedSubreddit} is already added.` };
      }

      const posts = await fetchSubredditPosts(resolvedSubreddit);

      setLanes((current) => [
        ...current,
        {
          name: resolvedSubreddit,
          posts,
          loading: false,
          error: "",
        },
      ]);

      return { ok: true };
    } catch (error) {
      return {
        error: error.message || "Could not add this lane.",
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

      <SideNav auth={auth} onLogout={onLogout} />

      <header className="app-header">
        <div className="hero-copy">
          <p className="eyebrow">REDDIT COMMAND CENTER</p>
          <h1>Track multiple subreddits in a bold, live lane board.</h1>
          <p className="app-description">
            Build your own Reddit dashboard, add feeds instantly, refresh them
            on demand, and keep your setup saved between sessions.
          </p>
        </div>

        <div className="auth-status">
          {auth.isLoggedIn ? (
            <span>
              Logged in as <strong>{auth.username}</strong>
            </span>
          ) : (
            <span>You are currently browsing as a guest.</span>
          )}
        </div>

        <div className="header-side">
          {auth.isLoggedIn && (
            <AddLaneForm onAdd={addLane} isSubmitting={isAdding} />
          )}
        </div>
      </header>

      {auth.isLoggedIn && (
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
      )}
    </div>
  );
}

export default function App() {
  const [auth, setAuth] = useState(getStoredAuth());

  const handleLogin = (authData) => {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));
    setAuth(authData);
  };

  const handleLogout = () => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setAuth({ isLoggedIn: false, username: "" });
  };

  useEffect(() => {
    setAuth(getStoredAuth());
  }, []);

  return (
    <Routes>
      <Route
        path="/"
        element={<HomePage auth={auth} onLogout={handleLogout} />}
      />
      <Route path="/profile" element={<Profile />} />
      <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
      <Route path="/signup" element={<SignUpPage onLogin={handleLogin} />} />
      <Route path="/news" element={<NewsPage />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route
        path="/create"
        element={
          <ProtectedRoute isLoggedIn={auth.isLoggedIn}>
            <CreatePage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
