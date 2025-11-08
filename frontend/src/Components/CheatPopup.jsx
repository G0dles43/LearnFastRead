// src/Components/CheatPopup.jsx
import React from 'react';

export default function CheatPopup({ reason, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-lg flex items-center justify-center z-50 animate-fade-in">
      <div className="card card-elevated max-w-lg w-full animate-slide-in p-8 text-center">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-danger to-red-500/50 border-4 border-danger/50 flex items-center justify-center mx-auto mb-6 animate-pulse">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </div>
        
        <h2 className="text-danger text-3xl font-bold mb-4">
          Sesja Przerwana
        </h2>
        
        <p className="text-lg text-text-secondary mb-6">
          Powód: <strong className="text-white">{reason}</strong>
        </p>
        
        <p className="text-sm text-text-secondary mb-8">
          Ćwiczenia rankingowe muszą być wykonywane w pełnym skupieniu, bez opuszczania karty i używania zewnętrznych narzędzi.
          Ta próba została anulowana i zapisana jako niezaliczona (0% trafności).
        </p>

        <button
          className="btn btn-danger btn-lg w-full"
          onClick={onClose}
        >
          Rozumiem, wróć do panelu
        </button>
      </div>
    </div>
  );
}