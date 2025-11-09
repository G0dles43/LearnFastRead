import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function DailyChallenge() {
  const [challenge, setChallenge] = useState(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();
  const token = localStorage.getItem("access");

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    axios
      .get("http://127.0.0.1:8000/api/challenge/today/", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setChallenge(res.data.challenge);
        setIsCompleted(res.data.is_completed);
        setLoading(false);
      })
      .catch((err) => {
        setError("Nie udało się załadować wyzwania na dziś.");
        console.error(err);
        setLoading(false);
      });
  }, [token]);

  if (loading) {
    return (
      <div className="p-8 rounded-lg shadow-md bg-gradient-to-r from-background-surface to-background-elevated animate-pulse">
        <div className="h-8 bg-background-main rounded-md w-2/5 mb-4"></div>
        <div className="h-6 bg-background-main rounded-md w-3/4"></div>
      </div>
    );
  }

  if (!challenge) {
    return null;
  }

  return (
    <div
      className={`relative overflow-hidden rounded-lg shadow-md border-2 bg-[url('/3.png')] bg-cover bg-center ${isCompleted ? 'border-success' : 'border-border-light'
        }`}
    >
      <div
        className={`absolute inset-0 backdrop-blur-sm ${isCompleted
          ? 'bg-gradient-to-r from-success/15 to-success/[.05]'
          : 'bg-gradient-to-r from-primary/15 to-secondary/[.05]'
          }`}
      ></div>
      <div
        className={`absolute top-0 right-0 w-[300px] h-[300px] pointer-events-none ${isCompleted
          ? 'bg-[radial-gradient(circle,rgba(16,185,129,0.15)_0%,transparent_70%)]'
          : 'bg-[radial-gradient(circle,rgba(99,102,241,0.15)_0%,transparent_70%)]'
          }`}
      ></div>

      <div className="relative z-10 p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div
              className={`w-14 h-14 rounded-lg flex items-center justify-center text-3xl text-white
                ${isCompleted
                  ? 'bg-gradient-to-r from-success to-green-600 shadow-lg shadow-success/30'
                  : 'bg-gradient-to-r from-primary to-secondary shadow-lg shadow-primary/30'
                }`}
            >
              {isCompleted ? '✓' : (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
              )}
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-1">
                {isCompleted ? 'Wyzwanie ukończone!' : 'Dzienne wyzwanie'}
              </h3>
              <p className="text-text-secondary text-base">
                {isCompleted ? 'Świetna robota! Wróć jutro' : 'Ukończ i zdobądź punkty'}
              </p>
            </div>
          </div>

          {isCompleted && (
            <div className="inline-flex items-center gap-1 px-4 py-2 font-semibold rounded-full bg-success/15 text-success border border-success/30 text-base">
              +50 pkt
            </div>
          )}
        </div>

        <div
          className="bg-background-surface border border-border p-6 rounded-lg"
        >
          <div className="flex items-start justify-between gap-8">
            <div className="flex-1">
              <h2 className="text-2xl font-semibold mb-4">
                {challenge.title}
              </h2>

              <div className="flex items-center flex-wrap gap-x-6 gap-y-2 text-text-secondary text-sm mb-6">
                <span className="flex items-center gap-2">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
                  </svg>
                  <span className="font-medium">{challenge.word_count} słów</span>
                </span>

                <span className="flex items-center gap-2">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 6v6l4 2" />
                  </svg>
                  <span className="font-medium">~{Math.ceil(challenge.word_count / 250)} min</span>
                </span>

                {challenge.is_ranked && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-warning/15 text-warning border border-warning/30">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                    </svg>
                    Ranking
                  </span>
                )}
              </div>

              {!isCompleted ? (
                <button
                  className="inline-flex items-center justify-center gap-2 w-full px-8 py-4 rounded-md font-semibold transition-all text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 bg-gradient-to-r from-primary to-primary-light text-lg"
                  onClick={() => navigate(`/training/${challenge.id}`)}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  Rozpocznij wyzwanie
                </button>
              ) : (
                <div className="p-4 bg-success/10 border border-success/30 rounded-md text-success font-semibold text-center">
                  Ukończono - nowe wyzwanie pojawi się jutro
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}