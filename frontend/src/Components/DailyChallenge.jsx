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
      <div className="card card-gradient animate-pulse" style={{ padding: '2rem' }}>
        <div style={{ height: '2rem', background: 'var(--bg-main)', borderRadius: 'var(--radius-md)', width: '40%', marginBottom: '1rem' }}></div>
        <div style={{ height: '1.5rem', background: 'var(--bg-main)', borderRadius: 'var(--radius-md)', width: '70%' }}></div>
      </div>
    );
  }
  
  if (!challenge) {
    return null; 
  }

  return (
    <div 
      className="card card-elevated"
      style={{
        position: 'relative',
        overflow: 'hidden',
        border: isCompleted ? '2px solid var(--success)' : '2px solid var(--border-light)',
        background: isCompleted 
          ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(16, 185, 129, 0.05)), url("/3.png")' 
          : 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(139, 92, 246, 0.05)), url("/3.png")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backdropFilter: 'blur(10px)'
      }}
    >
      {/* Gradient overlay */}
      <div style={{
        position: 'absolute',
        top: 0,
        right: 0,
        width: '300px',
        height: '300px',
        background: isCompleted 
          ? 'radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, transparent 70%)'
          : 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: 'var(--radius-lg)',
              background: isCompleted 
                ? 'linear-gradient(135deg, var(--success), #059669)' 
                : 'linear-gradient(135deg, var(--primary), var(--secondary))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.75rem',
              boxShadow: isCompleted ? '0 4px 12px rgba(16, 185, 129, 0.3)' : '0 4px 12px rgba(99, 102, 241, 0.3)'
            }}>
              {isCompleted ? '✓' : (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                </svg>
              )}
            </div>
            <div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                {isCompleted ? 'Wyzwanie ukończone!' : 'Dzienne wyzwanie'}
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                {isCompleted ? 'Świetna robota! Wróć jutro' : 'Ukończ i zdobądź punkty'}
              </p>
            </div>
          </div>
          
          {isCompleted && (
            <div className="badge badge-success" style={{ fontSize: '1rem', padding: '0.5rem 1rem' }}>
              +50 pkt
            </div>
          )}
        </div>

        <div 
          className="card"
          style={{ 
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            padding: '1.5rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '2rem' }}>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem' }}>
                {challenge.title}
              </h2>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/>
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
                  </svg>
                  <span style={{ fontWeight: 500 }}>{challenge.word_count} słów</span>
                </span>
                
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 6v6l4 2"/>
                  </svg>
                  <span style={{ fontWeight: 500 }}>~{Math.ceil(challenge.word_count / 250)} min</span>
                </span>

                {challenge.is_ranked && (
                  <span className="badge badge-warning">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                    </svg>
                    Ranking
                  </span>
                )}
              </div>
              
              {!isCompleted ? (
                <button 
                  className="btn btn-primary btn-lg"
                  onClick={() => navigate(`/training/${challenge.id}`)}
                  style={{ width: '100%' }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                  Rozpocznij wyzwanie
                </button>
              ) : (
                <div style={{ 
                  padding: '1rem',
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--success)',
                  fontWeight: 600,
                  textAlign: 'center'
                }}>
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