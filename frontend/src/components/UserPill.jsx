import { useState, useEffect, useCallback } from "react";

function UserPill({ user, active, onClick }) {
  const initials = String(user.id+1 ?? "?").slice(0, 2).toUpperCase();
  return (
    <button className={`user-pill ${active ? "user-pill--active" : ""}`} onClick={onClick}>
      <span className="user-pill__avatar">{initials}</span>
      <span className="user-pill__info">
        <span className="user-pill__name">{user.name}</span>
        {user.location && (
          <span className="user-pill__loc">
            <MapPin /> {user.location}
          </span>
        )}
      </span>
    </button>
  );
}

export default UserPill;