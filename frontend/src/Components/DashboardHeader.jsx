import React from "react";
import { Link, useNavigate } from "react-router-dom";

export default function DashboardHeader({ userName }) {
  const navigate = useNavigate();

  return (
    <header className="flex items-center justify-between mb-8 animate-fade-in">
      <div>
        <h1 className="text-gradient mb-2">Fast Reader</h1>
        <p className="text-text-secondary text-lg">
          Witaj, <span className="text-primary-light font-semibold">{userName}</span>
        </p>
      </div>
      <div className="flex gap-3">
        <Link to="/calibrate" className="btn btn-ghost">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 1v6m0 6v6" />
          </svg>
          Kalibracja
        </Link>
        <Link to="/settings" className="btn btn-ghost">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 1v6m0 6v6" />
          </svg>
          Ustawienia
        </Link>
        <button
          className="btn btn-secondary"
          onClick={() => { localStorage.clear(); navigate("/"); }}
        >
          Wyloguj
        </button>
      </div>
    </header>
  );
}