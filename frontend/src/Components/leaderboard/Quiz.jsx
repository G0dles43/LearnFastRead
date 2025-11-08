import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import useAntiCheating from "../../hooks/useAntiCheating.js";
import CheatPopup from "../ui/CheatPopup.jsx";

// === NOWY BLOK STYLÓW ===
// Możesz to przenieść do CSS, ale tutaj jest dla prostoty.
const optionStyles = {
  base: {
    display: 'block',
    width: '100%',
    padding: '1rem 1.5rem',
    margin: '0.5rem 0',
    fontSize: '1rem',
    fontWeight: 500,
    textAlign: 'left',
    border: '2px solid var(--border)',
    borderRadius: 'var(--radius-md)',
    background: 'var(--bg-surface)',
    color: 'var(--text-primary)',
    cursor: 'pointer',
    transition: 'var(--transition)',
  },
  selected: {
    background: 'var(--primary-light)',
    borderColor: 'var(--primary)',
    color: 'var(--text-primary)',
    boxShadow: '0 0 10px var(--primary-light)',
  },
  hover: { // Dodaj :hover w CSS jeśli przenosisz
    background: 'var(--bg-elevated)',
    borderColor: 'var(--primary-light)',
  }
};
// === KONIEC BLOKU STYLÓW ===


export default function Quiz({
  api,
  questions, // Pytania teraz zawierają 'question_type'
  exerciseId,
  readingTimeMs,
  token,
  attemptStatus,
  onFinish,
}) {
  const [answers, setAnswers] = useState({});
  const [resultData, setResultData] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
 
  const [timeRemaining, setTimeRemaining] = useState(questions.length * 20);
  const [timerExpired, setTimerExpired] = useState(false);
 
  const timerIntervalRef = useRef(null);
  const hasSubmittedRef = useRef(false);

  const navigate = useNavigate();

  // === Anti-Cheat (bez zmian) ===
  const [cheatReason, setCheatReason] = useState(null);
  const cheatingInProgress = useRef(false);

  const handleCheating = useCallback(async (reason) => {
    if (cheatingInProgress.current || hasSubmittedRef.current) return;
    cheatingInProgress.current = true;
   
    stopListenersRef.current(); 
    clearInterval(timerIntervalRef.current); 
   
    if (!api) {
      console.error("Anti-cheat: Brak API");
      setCheatReason(reason);
      return;
    }

    try {
      await api.post("submit-progress/", {
        exercise: exerciseId,
        reading_time_ms: readingTimeMs,
        answers: {}, // Puste odpowiedzi = 0% accuracy
      });
    } catch (err) {
      console.error("Błąd zapisu nieudanej próby (anti-cheat quiz):", err);
    } finally {
      setCheatReason(reason);
    }
  }, [api, exerciseId, readingTimeMs, hasSubmittedRef.current]);

  const { stopListeners } = useAntiCheating(
    handleCheating, 
    true, 
    true 
  );

  const stopListenersRef = useRef(() => {});
  useEffect(() => {
    stopListenersRef.current = stopListeners;
  }, [stopListeners]);
  // === KONIEC ANTI-CHEAT ===


  useEffect(() => {
    if (resultData !== null || timerExpired || cheatingInProgress.current) {
      clearInterval(timerIntervalRef.current);
      return;
    }

    timerIntervalRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timerIntervalRef.current);
          setTimerExpired(true);
          handleTimeExpired();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerIntervalRef.current);
  }, [resultData, timerExpired, cheatingInProgress.current]);

  const submitQuiz = async (finalAnswers) => {
    if (isSubmitting || hasSubmittedRef.current || cheatingInProgress.current) return;
   
    stopListeners(); 
    hasSubmittedRef.current = true;
    clearInterval(timerIntervalRef.current);
    setIsSubmitting(true);
   
    try {
      const res = await api.post("submit-progress/", {
        exercise: exerciseId,
        reading_time_ms: readingTimeMs,
        answers: finalAnswers,
      });
     
      setResultData(res.data);
      setTimeout(() => onFinish(), 5000);
    } catch (err) {
      console.error("Błąd zapisu wyniku quizu", err);
      alert(`Błąd: ${err.response?.data?.error || "Nie udało się zapisać wyniku"}`);
      setIsSubmitting(false);
      hasSubmittedRef.current = false;
      navigate("/dashboard");
    }
  };

  const handleSubmit = () => {
    submitQuiz(answers);
  };

  const handleTimeExpired = () => {
    submitQuiz(answers);
  };
  
  // === NOWA FUNKCJA ===
  // Do ustawiania odpowiedzi (działa dla inputów i przycisków)
  const handleAnswerChange = (questionId, value) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };
  // === KONIEC NOWEJ FUNKCJI ===

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimerColor = () => {
    const percentage = (timeRemaining / (questions.length * 20)) * 100;
    if (percentage > 50) return 'var(--success)';
    if (percentage > 25) return 'var(--warning)';
    return 'var(--danger)';
  };

  return (
    <>
      {cheatReason && (
        <CheatPopup 
          reason={cheatReason} 
          onClose={() => navigate('/dashboard')} 
        />
      )}

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem', width: '100%', filter: cheatReason ? 'blur(5px)' : 'none' }}>
        <div className="card card-elevated" style={{ padding: '2rem' }}>
         
          {resultData === null && !timerExpired && (
            <div style={{
              position: 'sticky',
              top: 0,
              zIndex: 10,
              marginBottom: '2rem',
              padding: '1rem 1.5rem',
              background: `linear-gradient(135deg, ${getTimerColor()}15, ${getTimerColor()}05)`,
              border: `2px solid ${getTimerColor()}`,
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={getTimerColor()} strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 6v6l4 2"/>
                </svg>
                <span style={{ fontWeight: 600 }}>
                  Pozostały czas: <strong style={{ fontSize: '1.25rem', color: getTimerColor() }}>{formatTime(timeRemaining)}</strong>
                </span>
              </div>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                {questions.length * 20}s łącznie
              </span>
            </div>
          )}

          <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '1.5rem', textAlign: 'center' }}>
            Quiz - Sprawdź zrozumienie
          </h2>
         
          {resultData === null ? (
            <>
              {questions.map((q, idx) => (
                <div key={q.id} className="card" style={{
                  background: 'var(--bg-surface)',
                  border: '2px solid var(--border)',
                  padding: '2rem',
                  marginBottom: '1.5rem'
                }}>
                  <p style={{
                    color: 'var(--text-secondary)',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    marginBottom: '0.75rem'
                  }}>
                    Pytanie {idx + 1}/{questions.length}
                    <span className="badge badge-primary" style={{marginLeft: '10px'}}>
                        {q.question_type === 'choice' ? 'Zamknięte' : 'Otwarte'}
                    </span>
                  </p>
                  <p style={{
                    fontSize: '1.25rem',
                    fontWeight: 600,
                    marginBottom: '1.5rem' // Zwiększony margines
                  }}>
                    {q.text}
                  </p>
                  
                  {/* === POCZĄTEK ZMIAN: RENDEROWANIE WARUNKOWE === */}
                  
                  {q.question_type === 'choice' ? (
                    // Renderuj Pytanie ZAMKNIĘTE (4 opcje)
                    <div>
                      {[q.option_1, q.option_2, q.option_3, q.option_4].map((option, optionIdx) => (
                        <button
                          key={optionIdx}
                          onClick={() => handleAnswerChange(q.id, option)}
                          style={{
                            ...optionStyles.base,
                            ...(answers[q.id] === option ? optionStyles.selected : {})
                          }}
                          // Efekt hover (opcjonalny, lepszy w CSS)
                          onMouseOver={e => e.currentTarget.style.background = answers[q.id] === option ? 'var(--primary-light)' : 'var(--bg-elevated)'}
                          onMouseOut={e => e.currentTarget.style.background = answers[q.id] === option ? 'var(--primary-light)' : 'var(--bg-surface)'}
                          disabled={isSubmitting || timerExpired}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  ) : (
                    // Renderuj Pytanie OTWARTE (input)
                    <input
                      type="text"
                      className="input"
                      placeholder="Twoja odpowiedź..."
                      value={answers[q.id] || ""}
                      onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                      disabled={isSubmitting || timerExpired}
                     />
                  )}
                  
                  {/* === KONIEC ZMIAN === */}
                  
                </div>
              ))}
              <button 
                onClick={handleSubmit} 
                className="btn btn-primary btn-lg"
                disabled={isSubmitting || timerExpired}
                style={{ width: '100%' }}
              >
                {isSubmitting ? 'Zapisywanie...' : 'Sprawdź odpowiedzi'}
              </button>
            </>
          ) : (
            // Wyniki (bez zmian)
            <div className="animate-fade-in" style={{ textAlign: 'center', padding: '2rem 0' }}>
              {resultData.ranking_points > 0 ? (
                <div className="card" style={{
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(16, 185, 129, 0.05))',
                  border: '2px solid var(--success)',
                  padding: '2rem'
                }}>
                  <div style={{ fontSize: '4rem' }}>🏆</div>
                  <h2 style={{ color: 'var(--success)' }}>
                    {resultData.counted_for_ranking ? 'Wynik Rankingowy!' : 'Wynik Zapisany!'}
                  </h2>
                  <p className="text-text-secondary mb-4">{resultData.message}</p>
                  <div className="badge badge-success" style={{ fontSize: '1.5rem', padding: '1rem' }}>
                    Punkty: <strong>{resultData.ranking_points}</strong>
                  </div>
                </div>
              ) : (
                <div className="card" style={{
                  background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(239, 68, 68, 0.05))',
                  border: '2px solid var(--danger)',
                  padding: '2rem'
                }}>
                  <div style={{ fontSize: '4rem' }}>❌</div>
                <h2 style={{ color: 'var(--danger)' }}>
                    {timerExpired ? 'Czas minął!' : 'Poniżej Progu!'}
                  </h2>
                  <p className="text-text-secondary mb-4">
                  Potrzebujesz min. 60% trafności, aby zdobyć punkty rankingowe.
                  </p>
                  <div className="badge badge-danger" style={{ fontSize: '1.5rem', padding: '1rem' }}>
                    Punkty: <strong>0</strong>
                  </div>
                </div>
              )}
             
              <div className="grid grid-cols-2 gap-4 my-6">
                <div className="card">
                  <div className="text-text-secondary mb-2">Twoja Prędkość</div>
                <div className="text-3xl font-bold">{resultData.wpm} WPM</div>
                </div>
                <div className="card">
                  <div className="text-text-secondary mb-2">Trafność</div>
                  <div className="text-3xl font-bold">{resultData.accuracy.toFixed(1)}%</div>
                </div>
              </div>
              <p className="text-text-secondary">Powrót do panelu za chwilę...</p>
        </div>
          )}
        </div>
      </div>
    </>
  ); 
}