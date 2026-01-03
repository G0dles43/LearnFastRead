import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import useAntiCheating from "../../hooks/useAntiCheating.js";
import CheatPopup from "../ui/CheatPopup.jsx";

// Komponent prostego pierścienia postępu (Circular Progress)
const CircularProgress = ({ percentage, colorClass }) => {
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center">
      <svg className="transform -rotate-90 w-40 h-40">
        <circle
          className="text-background-main"
          strokeWidth="10"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx="80"
          cy="80"
        />
        <circle
          className={`${colorClass} transition-all duration-1000 ease-out`}
          strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx="80"
          cy="80"
        />
      </svg>
      <div className="absolute text-center">
        <span className={`text-3xl font-bold ${colorClass}`}>{percentage.toFixed(0)}%</span>
        <div className="text-xs text-text-secondary font-medium uppercase">Trafność</div>
      </div>
    </div>
  );
};

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
  const [resultData, setResultData] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  const [timeRemaining, setTimeRemaining] = useState(questions.length * 20);
  const [timerExpired, setTimerExpired] = useState(false);

  const timerIntervalRef = useRef(null);
  const hasSubmittedRef = useRef(false);
  const answersRef = useRef({});
  const navigate = useNavigate();
  const [cheatReason, setCheatReason] = useState(null);
  const cheatingInProgress = useRef(false);

  // --- LOGIKA ANTI-CHEAT I SUBMIT (Bez zmian logicznych) ---
  const handleCheating = useCallback(async (reason) => {
    if (cheatingInProgress.current || hasSubmittedRef.current) return;
    cheatingInProgress.current = true;
    stopListenersRef.current();
    clearInterval(timerIntervalRef.current);

    if (!api) {
      setCheatReason(reason);
      return;
    }
    try {
      await api.post("submit-progress/", {
        exercise: exerciseId,
        reading_time_ms: readingTimeMs,
        answers: {},
      });
    } catch (err) {
      console.error("Anti-cheat error:", err);
    } finally {
      setCheatReason(reason);
    }
  }, [api, exerciseId, readingTimeMs]);

  const { stopListeners } = useAntiCheating(handleCheating, true, true);
  const stopListenersRef = useRef(() => {});

  useEffect(() => { stopListenersRef.current = stopListeners; }, [stopListeners]);
  useEffect(() => { answersRef.current = answers; }, [answers]);

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
          submitQuiz(answersRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerIntervalRef.current);
  }, [resultData, timerExpired, cheatingInProgress.current]);

  const submitQuiz = async (finalAnswers) => {
    if (isSubmitting || hasSubmittedRef.current || cheatingInProgress.current || isLocked) return;
    setIsLocked(true);
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
      // Nie wymuszamy już auto-wyjścia po 5s, dajemy userowi wybór, ale można zostawić timeout
      // setTimeout(() => onFinish(), 10000); 
    } catch (err) {
      console.error(err);
      alert("Błąd zapisu wyniku.");
      setIsSubmitting(false);
      hasSubmittedRef.current = false;
      setIsLocked(false);
    }
  };

  const handleSubmit = () => submitQuiz(answersRef.current);

  const handleAnswerChange = (questionId, value) => {
    if (isLocked) return;
    setAnswers(prev => ({ ...prev, [String(questionId)]: value }));
  };

  // --- UI HELPERY ---
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimerColorClasses = () => {
    const percentage = (timeRemaining / (questions.length * 20)) * 100;
    if (percentage > 50) return 'text-success bg-success/10 border-success/20';
    if (percentage > 25) return 'text-warning bg-warning/10 border-warning/20';
    return 'text-danger bg-danger/10 border-danger/20 animate-pulse';
  };

  const isDisabled = isSubmitting || timerExpired || isLocked;

  // --- RENDEROWANIE ---
  return (
    <>
      {cheatReason && <CheatPopup reason={cheatReason} onClose={() => navigate('/dashboard')} />}

      <div className={`mx-auto max-w-3xl p-4 md:p-6 w-full ${cheatReason ? 'blur-sm' : ''} animate-fade-in`}>
        
        {/* Kontener Główny */}
        <div className="bg-background-elevated shadow-xl rounded-2xl border border-border overflow-hidden relative">
          
          {/* HEADER: Timer + Przycisk Wyjścia */}
          {resultData === null && (
            <div className="flex items-center justify-between p-4 border-b border-border bg-background-surface/50 backdrop-blur-sm sticky top-0 z-20">
              
              {/* Timer */}
              <div className={`flex items-center gap-3 px-4 py-2 rounded-full border ${getTimerColorClasses()} transition-all`}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" />
                </svg>
                <span className="font-mono font-bold text-lg">{formatTime(timeRemaining)}</span>
              </div>

              {/* Przycisk Wyjścia (X) */}
              <button
                onClick={() => {
                    if(window.confirm("Czy na pewno chcesz przerwać test? Postęp zostanie utracony.")) {
                        navigate('/dashboard');
                    }
                }}
                className="p-2 rounded-full text-text-muted hover:bg-danger/10 hover:text-danger transition-colors"
                title="Przerwij i wyjdź"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          <div className="p-6 md:p-8">
            
            {/* --- EKRAN WYNIKÓW --- */}
            {resultData !== null ? (
              <div className="flex flex-col items-center animate-slide-in">
                
                {/* Nagłówek wyniku */}
                <div className="text-center mb-8">
                  {resultData.ranking_points > 0 ? (
                    <>
                      <div className="text-5xl mb-4 animate-bounce">🏆</div>
                      <h2 className="text-3xl font-bold bg-gradient-to-r from-success to-emerald-400 bg-clip-text text-transparent">
                        Gratulacje!
                      </h2>
                      <p className="text-text-secondary mt-2">{resultData.message}</p>
                    </>
                  ) : (
                    <>
                      <div className="text-5xl mb-4"></div>
                      <h2 className="text-3xl font-bold text-text-primary">
                        Tym razem się nie udało
                      </h2>
                      <p className="text-text-secondary mt-2">
                        {timerExpired ? 'Czas minął.' : 'Wymagane min. 60% poprawnych odpowiedzi.'}
                      </p>
                    </>
                  )}
                </div>

                <div className="flex flex-col md:flex-row items-center gap-8 md:gap-16 mb-10">
                  
                  <CircularProgress 
                    percentage={resultData.accuracy} 
                    colorClass={resultData.accuracy >= 60 ? 'text-success' : 'text-danger'}
                  />

                  <div className="p-4 bg-background-surface rounded-xl border border-border min-w-[140px]">
                    <div className="text-sm text-text-secondary uppercase tracking-wider mb-1">Punkty</div>
                    <div className={`text-4xl font-bold ${resultData.ranking_points > 0 ? 'text-warning' : 'text-text-muted'}`}>
                      {resultData.ranking_points}
                    </div>
                  </div>
                    
                </div>

                <div className="flex gap-4 w-full max-w-md">
                  <button
                    onClick={onFinish} // Wywołanie onFinish z Dashboardu
                    className="flex-1 py-3 px-6 rounded-lg font-bold text-white bg-gradient-to-r from-primary to-primary-light hover:shadow-lg hover:-translate-y-0.5 transition-all"
                  >
                    Wróć do Menu
                  </button>
                </div>
              </div>

            ) : (
              /* --- EKRAN PYTAŃ --- */
              <div className="max-w-2xl mx-auto">
                {questions.map((q, idx) => (
                  <div key={q.id} className="mb-10 last:mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-bold text-text-muted uppercase tracking-wider">
                            Pytanie {idx + 1} z {questions.length}
                        </span>
                        <span className="text-xs px-2 py-1 rounded bg-background-surface border border-border text-text-secondary">
                            {q.question_type === 'choice' ? 'Wybór' : 'Otwarte'}
                        </span>
                    </div>
                    
                    <h3 className="text-xl md:text-2xl font-semibold text-text-primary mb-6 leading-relaxed">
                      {q.text}
                    </h3>

                    {q.question_type === 'choice' ? (
                      <div className="grid grid-cols-1 gap-3">
                        {[q.option_1, q.option_2, q.option_3, q.option_4].map((option, optIdx) => {
                          const isSelected = answers[String(q.id)] === option;
                          return (
                            <button
                              key={optIdx}
                              onClick={() => handleAnswerChange(q.id, option)}
                              disabled={isDisabled}
                              className={`
                                relative w-full text-left p-4 rounded-xl border-2 transition-all duration-200 group
                                ${isSelected 
                                  ? 'border-primary bg-primary/10 shadow-sm' 
                                  : 'border-border bg-background-main hover:border-primary/50 hover:bg-background-surface'
                                }
                                ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
                              `}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`
                                    w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0
                                    ${isSelected ? 'border-primary bg-primary' : 'border-text-muted group-hover:border-primary'}
                                `}>
                                    {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                                </div>
                                <span className={`font-medium ${isSelected ? 'text-primary' : 'text-text-primary'}`}>
                                    {option}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="relative">
                        <input
                          type="text"
                          value={answers[String(q.id)] || ""}
                          onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                          disabled={isDisabled}
                          placeholder="Wpisz swoją odpowiedź..."
                          className="w-full p-4 rounded-xl border-2 border-border bg-background-main text-text-primary focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all placeholder:text-text-muted disabled:opacity-50"
                        />
                      </div>
                    )}
                  </div>
                ))}

                <div className="pt-6 border-t border-border mt-8">
                  <button
                    onClick={handleSubmit}
                    disabled={isDisabled}
                    className={`
                        w-full py-4 rounded-xl font-bold text-lg text-white shadow-lg transition-all
                        flex items-center justify-center gap-2
                        ${isDisabled 
                            ? 'bg-text-muted cursor-not-allowed' 
                            : 'bg-gradient-to-r from-primary to-indigo-600 hover:shadow-primary/25 hover:-translate-y-1'
                        }
                    `}
                  >
                    {isSubmitting ? (
                        <>
                            <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                            Sprawdzanie...
                        </>
                    ) : (
                        <>
                            Zakończ i Sprawdź
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12l5 5L20 7"/></svg>
                        </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}