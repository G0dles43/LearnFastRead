import React from "react";
import { useNavigate } from "react-router-dom";

export default function QuickActions() {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 animate-fade-in" style={{ animationDelay: '0.1s' }}>
      <button
        className="card card-gradient flex items-center gap-4 p-6 cursor-pointer border-2 border-transparent transition-all hover:border-primary"
        onClick={() => navigate("/create-exercise")}
      >
        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-primary-light flex items-center justify-center">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </div>
        <div className="text-left">
          <h3 className="text-lg mb-1">Nowe ćwiczenie</h3>
          <p className="text-text-secondary text-sm">Stwórz własny tekst</p>
        </div>
      </button>

      <button
        className="card card-gradient flex items-center gap-4 p-6 cursor-pointer border-2 border-transparent transition-all hover:border-warning"
        onClick={() => navigate("/ranking")}
      >
        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-warning to-[#fbbf24] flex items-center justify-center">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
          </svg>
        </div>
        <div className="text-left">
          <h3 className="text-lg mb-1">Ranking</h3>
          <p className="text-text-secondary text-sm">Sprawdź pozycję</p>
        </div>
      </button>

      <button
        className="card card-gradient flex items-center gap-4 p-6 cursor-pointer border-2 border-transparent transition-all hover:border-secondary"
        onClick={() => navigate("/how-it-works")}
      >
        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-secondary to-[#a78bfa] flex items-center justify-center">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>
        <div className="text-left">
          <h3 className="text-lg mb-1">Jak to działa?</h3>
          <p className="text-text-secondary text-sm">Zobacz zasady</p>
        </div>
      </button>
    </div>
  );
}