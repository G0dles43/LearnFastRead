import React from "react";
import { Link, useNavigate } from "react-router-dom";

export default function DashboardHeader({ userName, currentStreak, isLoading }) {
  const navigate = useNavigate();

  const getDayWord = (days) => {
    if (days === 1) return 'dzień';
    if ([2, 3, 4].includes(days % 10) && ![12, 13, 14].includes(days % 100)) {
        return 'dni';
    }
    return 'dni';
  };

  return (
    <header className="flex items-center justify-between mb-8 animate-fade-in">
      <div>
        <h1 className="text-gradient mb-2">Fast Reader</h1>
        
        <div className="flex items-baseline gap-4"> 
          <p className="text-text-secondary text-2xl">
            Witaj, <span className="text-primary-light font-bold">{userName}</span>
          </p>
          
          {!isLoading && currentStreak > 0 && (
            <div className="relative group">
              <div 
                className="badge badge-warning flex items-center gap-1 px-3 py-2 cursor-help" 
              >
                <img 
                  src="/fire.gif" 
                  alt="Seria" 
                  className="w-5 h-5 object-contain aspect-auto" 
                />
                <span className="font-bold text-base">{currentStreak}</span>
              </div>

              <span 
                className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 
                           w-max px-3 py-1.5 
                           bg-[var(--bg-elevated)] border border-[var(--border)] rounded-md shadow-lg 
                           text-[var(--text-primary)] text-sm font-medium
                           opacity-0 invisible group-hover:opacity-100 group-hover:visible 
                           transition-opacity duration-200 z-10"
              >
                Twoja codzienna seria: {currentStreak} {getDayWord(currentStreak)}!
              </span>
            </div>
          )}
        </div>
      </div>
      <div className="flex gap-3">
        <Link to="/profile" className="btn btn-ghost">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
          Profil
        </Link>
        
        <Link to="/calibrate" className="btn btn-ghost">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 1v6m0 6v6" />
          </svg>
          Kalibracja
        </Link>
        <Link to="/settings" className="btn btn-ghost">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12.22 2h-.44a2 2 0 00-2 2v.18a2 2 0 01-1 1.73l-.43.25a2 2 0 01-2 0l-.15-.08a2 2 0 00-2.73.73l-.22.38a2 2 0 00.73 2.73l.15.08a2 2 0 010 2l-.15.08a2 2 0 00-.73 2.73l.22.38a2 2 0 002.73.73l.15-.08a2 2 0 012 0l.43.25a2 2 0 011 1.73V20a2 2 0 002 2h.44a2 2 0 002-2v-.18a2 2 0 011-1.73l.43-.25a2 2 0 012 0l.15.08a2 2 0 002.73-.73l.22-.38a2 2 0 00-.73-2.73l-.15-.08a2 2 0 010-2l.15-.08a2 2 0 00.73-2.73l-.22-.38a2 2 0 00-2.73-.73l-.15.08a2 2 0 01-2 0l-.43-.25a2 2 0 01-1-1.73V4a2 2 0 00-2-2z"/>
            <circle cx="12" cy="12" r="3" />
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