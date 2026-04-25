import { useState, useEffect, useCallback } from "react";

const ThumbUp = ({ filled }) => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
    <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z" />
    <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
  </svg>
);

const ThumbDown = ({ filled }) => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
    <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z" />
    <path d="M17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17" />
  </svg>
);

const StarIcon = () => (
  <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const MapPin = () => (
  <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);



function CourseCard({ course, userId, onFeedback, api }) {
  const [fb, setFb] = useState(course.feedback ?? null);
  const [busy, setBusy] = useState(false);

  const handleFeedback = async (action) => {
    const next = fb === action ? null : action; // toggle off
    setBusy(true);
    try {
      await api.post("/feedback", {
        user_id: String(userId),
        course_id: String(course.id),
        action:String(next ?? action),
      });
      setFb(next);
      onFeedback?.(course.id, next);
    } finally {
      setBusy(false);
    }
  };

  const stars = Math.round(course.rating);

  return (
    <div className={`card ${fb ? `card--${fb}` : ""}`}>
      <div className="card__header">
        <span className="card__level">{course.level ?? "All levels"}</span>
        <span className="card__rating">
          <StarIcon />
          {course.rating?.toFixed(1)}
        </span>
      </div>

      <h3 className="card__title">{course.title}</h3>

      {course.provider && (
        <p className="card__provider">{course.provider}</p>
      )}

      <div className="card__tags">
        {(course.tags ?? []).slice(0, 5).map((t) => (
          <span key={t} className="tag">{t}</span>
        ))}
      </div>

      <div className="card__footer">
        <div className="card__stars">
          {Array.from({ length: 5 }).map((_, i) => (
            <span key={i} style={{ opacity: i < stars ? 1 : 0.22 }}>
              <StarIcon />
            </span>
          ))}
        </div>

        <div className="card__actions">
          <button
            className={`btn-fb btn-fb--like ${fb === "like" ? "active" : ""}`}
            onClick={() => handleFeedback("like")}
            disabled={busy}
            title="Like"
          >
            <ThumbUp filled={fb === "like"} />
          </button>
          <button
            className={`btn-fb btn-fb--dislike ${fb === "dislike" ? "active" : ""}`}
            onClick={() => handleFeedback("dislike")}
            disabled={busy}
            title="Dislike"
          >
            <ThumbDown filled={fb === "dislike"} />
          </button>
        </div>
      </div>
    </div>
  );
}


export default CourseCard;