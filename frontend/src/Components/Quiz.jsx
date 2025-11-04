import React, { useState, useEffect, useRef } from "react";
import axios from "axios";

export default function Quiz({
  api,
  questions,
  exerciseId,
  readingTimeMs,
  token,
  attemptStatus,
  onFinish,
}) {
  const [answers, setAnswers] = useState({});
  const [quizScore, setQuizScore] = useState(null); // Przechowa 'accuracy' z backendu
  const [rankingResult, setRankingResult] = useState(null); // Przechowa całą odpowiedź z backendu
  const [isSubmitting, setIsSubmitting] = useState(false);

  const listenersActive = useRef(true);

  useEffect(() => {
    const handleCheating = () => {
      if (!listenersActive.current) {
        return;
      }
      listenersActive.current = false; 
      alert("Wykryto opuszczenie karty podczas quizu. Próba rankingowa została anulowana.");
      onFinish(); 
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleCheating();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleCheating);

    return () => {
      listenersActive.current = false; 
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleCheating);
    };
  }, [onFinish]);

  const handleSubmit = () => {
    if (isSubmitting || !api) return; 
       
    listenersActive.current = false;
    setIsSubmitting(true);
    
    api
      .post(
        "http://127.0.0.1:8000/api/submit-progress/",
        {
          exercise: exerciseId,
          reading_time_ms: readingTimeMs,
          answers: answers,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then((res) => {
        console.log("Backend response:", res.data);
        setQuizScore(res.data.accuracy);
        setRankingResult(res.data);
        setTimeout(() => onFinish(), 5000);
      })
      .catch((err) => {
        console.error("Błąd zapisu wyniku quizu", err);
        if (err.response) {
          console.error("Error details:", err.response.data);
          alert(`Błąd: ${err.response.data.error || "Nie udało się zapisać wyniku"}`);
        } else {
          alert("Błąd zapisu wyniku.");
        }
        setIsSubmitting(false); 
        listenersActive.current = true;
      });
  };

  return (
    <div style={{
      maxWidth: '800px',
      margin: '0 auto',
      padding: '2rem',
      width: '100%'
    }}>
      <div className="card card-elevated" style={{ padding: '2rem' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '1.5rem', textAlign: 'center' }}>
          Quiz - Sprawdź zrozumienie
        </h2>
        
        {quizScore === null ? (
          <>
            {questions.map((q, idx) => (
              <div
                key={q.id}
                className="card"
                style={{
                  background: 'var(--bg-surface)',
                  border: '2px solid var(--border)',
                  padding: '2rem',
                  marginBottom: '1.5rem',
                  transition: 'var(--transition)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--primary)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <p style={{
                  color: 'var(--text-secondary)',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '0.75rem'
                }}>
                  Pytanie {idx + 1}/{questions.length}
                </p>
                <p style={{
                  fontSize: '1.25rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginBottom: '1rem'
                }}>
                  {q.text}
                </p>
                <input
                  type="text"
                  className="input"
                  placeholder="Twoja odpowiedź..."
                  value={answers[q.id] || ""}
                  onChange={(e) =>
                    setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                  }
                />
              </div>
            ))}
            <button 
              onClick={handleSubmit} 
              className="btn btn-primary btn-lg"
              disabled={isSubmitting}
              style={{ width: '100%' }}
            >
              {isSubmitting ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', justifyContent: 'center' }}>
                  <div className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }}></div>
                  <span>Zapisywanie...</span>
                </div>
              ) : (
                'Sprawdź odpowiedzi'
              )}
            </button>
          </>
        ) : (
          // --- NOWY EKRAN WYNIKÓW ---
          <div 
            className="animate-fade-in" 
            style={{ 
              textAlign: 'center',
              padding: '2rem 0' 
            }}>
            
            {rankingResult && rankingResult.ranking_points > 0 ? (
              // --- SUKCES ---
              <div className="card" style={{
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(16, 185, 129, 0.05))',
                border: '2px solid var(--success)',
                padding: '2rem'
              }}>
                <div style={{ fontSize: '4rem' }}>🏆</div>
                <h2 className="text-3xl font-bold mb-3" style={{ color: 'var(--success)' }}>
                  Wynik Zapisany!
                </h2>
                <p className="text-lg text-text-secondary mb-6">
                  Gratulacje! Twój wynik został zaliczony do rankingu.
                </p>
                
                <div className="badge badge-success" style={{ fontSize: '1.5rem', padding: '1rem 1.5rem', marginBottom: '1.5rem' }}>
                  Zdobyte punkty: <strong>{rankingResult.ranking_points}</strong>
                </div>
              </div>
            ) : (
              // --- PORAŻKA (PONIŻEJ PROGU) ---
              <div className="card" style={{
                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(239, 68, 68, 0.05))',
                border: '2px solid var(--danger)',
                padding: '2rem'
              }}>
                <div style={{ fontSize: '4rem' }}>❌</div>
                <h2 className="text-3xl font-bold mb-3" style={{ color: 'var(--danger)' }}>
                  Poniżej Progu!
                </h2>
                <p className="text-lg text-text-secondary mb-6">
                  Niestety, Twój wynik był poniżej progu 60% poprawności.
                </p>
                
                <div className="badge badge-danger" style={{ fontSize: '1.5rem', padding: '1rem 1.5rem', marginBottom: '1.5rem' }}>
                  Zdobyte punkty: <strong>0</strong>
                </div>
              </div>
            )}

            {/* Wspólne statystyki WPM i Accuracy */}
            <div className="grid grid-cols-2 gap-4 my-6">
              <div className="card" style={{ background: 'var(--bg-surface)', padding: '1rem' }}>
                <div className="text-text-secondary text-sm mb-1">Twoja Prędkość</div>
                <div className="text-3xl font-bold text-primary">
                  {/* Wyświetlamy WPM zwrócone z backendu */}
                  {rankingResult?.wpm || 0} 
                  <span className="text-lg ml-1">WPM</span>
                </div>
              </div>
              <div className="card" style={{ background: 'var(--bg-surface)', padding: '1rem' }}>
                <div className="text-text-secondary text-sm mb-1">Twoja Trafność</div>
                <div className="text-3xl font-bold text-primary">
                  {quizScore.toFixed(0)}%
                </div>
              </div>
            </div>

            {rankingResult && (
               <p className="text-text-secondary mb-6">
                {rankingResult.message}
               </p>
            )}

            <p className="text-text-muted italic">
              Powrót do panelu za chwilę...
            </p>

          </div>
        )}
      </div>
    </div>
  );
}