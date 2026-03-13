import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./App.css";

const NEWS_API_URL = "https://api.spaceflightnewsapi.net/v4/articles/?limit=12";

export default function NewsPage() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchNews() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(NEWS_API_URL);

        if (!response.ok) {
          throw new Error("Failed to fetch news.");
        }

        const data = await response.json();
        setArticles(data.results || []);
      } catch (err) {
        setError(err.message || "Something went wrong while loading news.");
      } finally {
        setLoading(false);
      }
    }

    fetchNews();
  }, []);

  return (
    <div className="app-shell">
      <div className="bg-orb bg-orb-1" />
      <div className="bg-orb bg-orb-2" />
      <div className="bg-grid" />

      <div className="profile-topbar">
        <div>
          <p className="eyebrow">NEWS</p>
          <h1 className="create-page-title">Latest space news</h1>
        </div>

        <div className="create-top-actions">
          <Link to="/" className="nav-btn">
            Home
          </Link>
        </div>
      </div>

      <main className="lanes-grid">
        {loading && <div className="lane-status">Loading news...</div>}

        {error && <div className="lane-error">{error}</div>}

        {!loading &&
          !error &&
          articles.map((article) => (
            <article key={article.id} className="lane">
              <div className="lane-glow" />
              <div className="lane-header">
                <div>
                  <div className="lane-chip">{article.news_site}</div>
                  <h2>{article.title}</h2>
                  <p className="lane-subtitle">
                    {new Date(article.published_at).toLocaleString()}
                  </p>
                </div>
              </div>

              {article.image_url ? (
                <img
                  src={article.image_url}
                  alt={article.title}
                  className="post-thumb"
                  style={{
                    width: "100%",
                    height: "220px",
                    objectFit: "cover",
                    borderRadius: "16px",
                    marginBottom: "16px",
                  }}
                />
              ) : null}

              <p style={{ marginBottom: "16px", lineHeight: "1.6" }}>
                {article.summary}
              </p>

              <a
                href={article.url}
                target="_blank"
                rel="noreferrer"
                className="nav-btn nav-btn-alt"
              >
                Read Full Article
              </a>
            </article>
          ))}
      </main>
    </div>
  );
}
