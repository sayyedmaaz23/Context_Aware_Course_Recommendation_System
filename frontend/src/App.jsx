import { useState, useEffect, useCallback, useRef } from "react";
import CourseCard from "./components/CourseCard";

const API = "http://localhost:8000";

const api = {
  get: (path) => fetch(`${API}${path}`).then((r) => r.json()),
  post: (path, body) =>
    fetch(`${API}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then((r) => r.json()),
  patch: (path, body) =>
    fetch(`${API}${path}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then((r) => r.json()),
};

const Loader = () => (
  <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}>
    <div className="spinner" />
  </div>
);

const RefreshIcon = () => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5">
    <polyline points="23 4 23 10 17 10" />
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
  </svg>
);

const HeartIcon = ({ n }) => (
  <span className="like-badge">
    <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
    {n}
  </span>
);

function UserSwitcher({ users, activeUser, onSelect }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (!activeUser) return null;
  const initials = String(activeUser.id ?? "?").slice(0, 2).toUpperCase();

  return (
    <div className="switcher" ref={ref}>
      <button className="switcher__trigger" onClick={() => setOpen((o) => !o)}>
        <span className="switcher__avatar">{initials}</span>
        <span className="switcher__info">
          <span className="switcher__id">User {activeUser.id}</span>
          {activeUser.location && (
            <span className="switcher__loc">{activeUser.location}</span>
          )}
        </span>
        <span className={`switcher__caret ${open ? "switcher__caret--open" : ""}`}>▾</span>
      </button>

      {open && (
        <div className="switcher__dropdown">
          <p className="switcher__dropdown-label">Switch learner</p>
          {users.map((u) => {
            const ini = String(u.id ?? "?").slice(0, 2).toUpperCase();
            const active = u.id === activeUser.id;
            return (
              <button
                key={u.id}
                className={`switcher__option ${active ? "switcher__option--active" : ""}`}
                onClick={() => { onSelect(u); setOpen(false); }}
              >
                <span className="switcher__avatar switcher__avatar--sm">{ini}</span>
                <span className="switcher__option-info">
                  <span>User {u.id}</span>
                  {u.location && <span className="switcher__loc">{u.location}</span>}
                </span>
                {active && <span className="switcher__check">✓</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Wrapper that handles the disappear-on-dislike animation
function AnimatedCard({ course, userId, onFeedback, api, onDisliked }) {
  const [hiding, setHiding] = useState(false);

  const handleFeedback = (courseId, action) => {
    if (action === "dislike") {
      setHiding(true);
      setTimeout(() => onDisliked(courseId), 380);
    }
    onFeedback(courseId, action);
  };

  return (
    <div className={`card-wrap ${hiding ? "card-wrap--hide" : ""}`}>
      <CourseCard
        course={course}
        userId={userId}
        onFeedback={handleFeedback}
        api={api}
      />
    </div>
  );
}

export default function App() {
  const [users, setUsers] = useState([]);
  const [activeUser, setActiveUser] = useState(null);
  const [courses, setCourses] = useState([]);
  const [likeCount, setLikeCount] = useState(0);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [locating, setLocating] = useState(false);
  const [detectedCountry, setDetectedCountry] = useState(null);
  const [error, setError] = useState(null);
  const [isLikedBased, setIsLikedBased] = useState(false);

  // IP geolocation via backend proxy
  useEffect(() => {
    api.get("/me/location")
      .then((data) => { if (data?.country && data.country !== "Unknown") setDetectedCountry(data.country); })
      .catch(() => {});
  }, []);

  // Load users
  useEffect(() => {
    api.get("/users")
      .then((data) => { setUsers(data); if (data.length) setActiveUser(data[0]); })
      .catch(() => setError("Could not reach the API. Is it running?"))
      .finally(() => setLoadingUsers(false));
  }, []);

  // Push detected location to backend
  useEffect(() => {
    if (!activeUser || !detectedCountry) return;
    if (activeUser.location === detectedCountry) return;
    setLocating(true);
    api.patch(`/users/${activeUser.id}/location`, { location: detectedCountry })
      .then(() => {
        setActiveUser((u) => ({ ...u, location: detectedCountry }));
        setUsers((all) => all.map((u) => u.id === activeUser.id ? { ...u, location: detectedCountry } : u));
      })
      .catch(() => {})
      .finally(() => setLocating(false));
  }, [activeUser?.id, detectedCountry]);

  // Fetch base recommendations when user changes
  useEffect(() => {
    if (!activeUser) return;
    setIsLikedBased(false);
    setLikeCount(0);
    loadBaseRecs();
  }, [activeUser?.id]);

  // Re-fetch after location patch resolves
  const prevLocating = useRef(false);
  useEffect(() => {
    if (prevLocating.current === true && locating === false && activeUser) {
      loadBaseRecs();
    }
    prevLocating.current = locating;
  }, [locating]);

  const loadBaseRecs = () => {
    if (!activeUser) return;
    setLoadingCourses(true);
    setCourses([]);
    api.get(`/recommendations/${activeUser.id}?top_n=6`)
      .then(setCourses)
      .catch(() => setError("Failed to load recommendations."))
      .finally(() => setLoadingCourses(false));
  };

  // Refresh: fetch liked-based recommendations
  const handleRefresh = () => {
    if (!activeUser) return;
    setRefreshing(true);
    api.get(`/recommendations/${activeUser.id}/liked-based?top_n=6`)
      .then((data) => {
        setCourses(data);
        setIsLikedBased(true);
      })
      .catch(() => setError("Not enough likes yet to personalise."))
      .finally(() => setRefreshing(false));
  };

  const handleFeedback = useCallback((courseId, action) => {
    if (action === "like") setLikeCount((n) => n + 1);
    if (action === null) setLikeCount((n) => Math.max(0, n - 1)); // toggled off
  }, []);

  const handleDisliked = useCallback((courseId) => {
    setCourses((prev) => prev.filter((c) => String(c.id) !== String(courseId)));
  }, []);

  const isLoading = loadingCourses || locating;

  return (
    <>
      <style>{css}</style>
      <div className="app">
        <header className="navbar">
          <div className="navbar__brand">
            <span className="navbar__logo">◈</span>
            <span className="navbar__name">CourseMatch</span>
          </div>

          <div className="navbar__center">
            {activeUser && (
              <span className="navbar__subtitle">
                Recommendations for <strong>User {activeUser.id}</strong>
                {locating && <span className="navbar__locating"> · Detecting location…</span>}
                {!locating && detectedCountry && (
                  <span className="navbar__country"> · {detectedCountry}</span>
                )}
              </span>
            )}
          </div>

          <div className="navbar__right">
            {loadingUsers ? (
              <span className="switcher__loading">Loading users…</span>
            ) : (
              <UserSwitcher users={users} activeUser={activeUser} onSelect={setActiveUser} />
            )}
          </div>
        </header>

        <main className="main">
          {error && <div className="error-banner" onClick={() => setError(null)}>{error} ✕</div>}

          {activeUser && (
            <div className="main__header">
              <div>
                <h2 className="main__title">
                  {isLikedBased ? "Because You Liked" : "Your Courses"}
                </h2>
                <p className="main__sub">
                  {locating
                    ? "Personalising to your location…"
                    : isLikedBased
                    ? "Courses similar to your liked picks"
                    : "Matched to your skills & local job market"}
                </p>
              </div>

              <div className="header-actions">
                {likeCount > 0 && <HeartIcon n={likeCount} />}
                <button
                  className={`btn-refresh ${likeCount === 0 ? "btn-refresh--disabled" : ""}`}
                  onClick={handleRefresh}
                  disabled={likeCount === 0 || refreshing}
                  title={likeCount === 0 ? "Like some courses first" : "Recommend similar to liked"}
                >
                  <RefreshIcon />
                  {refreshing ? "Loading…" : "Refresh"}
                </button>
                {isLikedBased && (
                  <button className="btn-reset" onClick={() => { setIsLikedBased(false); loadBaseRecs(); }}>
                    Reset
                  </button>
                )}
              </div>
            </div>
          )}

          {isLoading ? (
            <Loader />
          ) : (
            <div className="grid">
              {courses.map((c) => (
                <AnimatedCard
                  key={c.id}
                  course={c}
                  userId={activeUser?.id}
                  onFeedback={handleFeedback}
                  api={api}
                  onDisliked={handleDisliked}
                />
              ))}
              {courses.length === 0 && !loadingCourses && (
                <p className="empty-state">No courses to show. Try refreshing!</p>
              )}
            </div>
          )}
        </main>
      </div>
    </>
  );
}

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg: #0d0f14; --surface: #13161d; --surface2: #1a1e28;
    --border: #252934; --accent: #7c6aff; --accent2: #ff6a7c;
    --text: #e8eaf0; --muted: #636880; --like: #4ade80; --dislike: #f87171; --radius: 14px;
  }
  html, body, #root { height: 100%; }
  body { background: var(--bg); color: var(--text); font-family: 'DM Sans', sans-serif; font-size: 14px; line-height: 1.5; }
  .app { display: flex; flex-direction: column; height: 100vh; overflow: hidden; }

  .navbar {
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 28px; height: 60px; min-height: 60px;
    background: var(--surface); border-bottom: 1px solid var(--border);
    position: relative; z-index: 100;
  }
  .navbar__brand { display: flex; align-items: center; gap: 10px; }
  .navbar__logo { font-size: 22px; color: var(--accent); }
  .navbar__name { font-family: 'Syne', sans-serif; font-weight: 800; font-size: 17px; letter-spacing: -.3px; }
  .navbar__center { position: absolute; left: 50%; transform: translateX(-50%); white-space: nowrap; }
  .navbar__subtitle { font-size: 13px; color: var(--muted); }
  .navbar__subtitle strong { color: var(--text); font-weight: 600; }
  .navbar__locating { color: var(--accent); font-style: italic; }
  .navbar__country { color: var(--like); }
  .navbar__right { display: flex; align-items: center; }
  .switcher__loading { font-size: 12px; color: var(--muted); }

  .switcher { position: relative; }
  .switcher__trigger {
    display: flex; align-items: center; gap: 10px; padding: 7px 12px;
    border-radius: 10px; border: 1px solid var(--border); background: var(--surface2);
    color: var(--text); cursor: pointer; transition: border-color .15s;
  }
  .switcher__trigger:hover { border-color: var(--accent); }
  .switcher__avatar {
    width: 32px; height: 32px; border-radius: 50%; flex-shrink: 0;
    background: linear-gradient(135deg, var(--accent), var(--accent2));
    display: flex; align-items: center; justify-content: center;
    font-family: 'Syne', sans-serif; font-weight: 700; font-size: 12px;
  }
  .switcher__avatar--sm { width: 26px; height: 26px; font-size: 10px; }
  .switcher__info { display: flex; flex-direction: column; align-items: flex-start; gap: 1px; }
  .switcher__id { font-size: 13px; font-weight: 500; }
  .switcher__loc { font-size: 11px; color: var(--muted); }
  .switcher__caret { font-size: 12px; color: var(--muted); transition: transform .15s; line-height: 1; }
  .switcher__caret--open { transform: rotate(180deg); }
  .switcher__dropdown {
    position: absolute; top: calc(100% + 8px); right: 0; width: 220px;
    background: var(--surface2); border: 1px solid var(--border);
    border-radius: var(--radius); box-shadow: 0 12px 40px rgba(0,0,0,.4);
    overflow: hidden; z-index: 200;
  }
  .switcher__dropdown-label {
    font-size: 10px; font-weight: 600; letter-spacing: 1.2px;
    text-transform: uppercase; color: var(--muted); padding: 10px 14px 6px;
  }
  .switcher__option {
    display: flex; align-items: center; gap: 10px; width: 100%; padding: 9px 14px;
    background: transparent; border: none; color: var(--text); cursor: pointer;
    text-align: left; font-size: 13px; font-family: inherit; transition: background .12s;
  }
  .switcher__option:hover { background: rgba(124,106,255,.08); }
  .switcher__option--active { background: rgba(124,106,255,.1); }
  .switcher__option-info { display: flex; flex-direction: column; gap: 1px; flex: 1; }
  .switcher__check { color: var(--accent); font-size: 13px; }

  .main { flex: 1; overflow-y: auto; padding: 32px 40px; display: flex; flex-direction: column; gap: 24px; }
  .main__header { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 16px; }
  .main__title { font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 700; }
  .main__sub { color: var(--muted); font-size: 13px; margin-top: 4px; }

  .header-actions { display: flex; align-items: center; gap: 10px; }

  .like-badge {
    display: flex; align-items: center; gap: 5px;
    padding: 6px 12px; border-radius: 20px;
    background: rgba(74,222,128,.1); border: 1px solid var(--like);
    color: var(--like); font-size: 12px; font-weight: 600;
  }

  .btn-refresh {
    display: flex; align-items: center; gap: 7px;
    padding: 8px 16px; border-radius: 10px;
    background: var(--accent); border: none; color: #fff;
    font-family: inherit; font-size: 13px; font-weight: 600;
    cursor: pointer; transition: opacity .15s, transform .15s;
  }
  .btn-refresh:hover:not(:disabled) { opacity: .85; transform: translateY(-1px); }
  .btn-refresh--disabled { background: var(--surface2); border: 1px solid var(--border); color: var(--muted); cursor: not-allowed; }

  .btn-reset {
    padding: 8px 14px; border-radius: 10px;
    background: transparent; border: 1px solid var(--border);
    color: var(--muted); font-family: inherit; font-size: 13px;
    cursor: pointer; transition: border-color .15s, color .15s;
  }
  .btn-reset:hover { border-color: var(--text); color: var(--text); }

  /* card disappear animation */
  .card-wrap { transition: opacity .35s ease, transform .35s ease, max-height .35s ease; max-height: 600px; overflow: hidden; }
  .card-wrap--hide { opacity: 0; transform: scale(.93) translateY(8px); max-height: 0; pointer-events: none; }

  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 18px; align-items: start; }

  .empty-state { color: var(--muted); font-size: 14px; padding: 40px 0; grid-column: 1/-1; text-align: center; }

  .spinner { width: 32px; height: 32px; border: 3px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: spin .7s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .error-banner { background: rgba(248,113,113,.1); border: 1px solid #f87171; color: #f87171; border-radius: 10px; padding: 12px 16px; font-size: 13px; cursor: pointer; }
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
`;