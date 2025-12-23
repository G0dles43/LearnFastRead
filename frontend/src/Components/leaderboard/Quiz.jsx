import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import useAntiCheating from "../../hooks/useAntiCheating.js";
import CheatPopup from "../ui/CheatPopup.jsx";

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

  const [timeRemaining, setTimeRemaining] = useState(questions.length * 20);
  const [timerExpired, setTimerExpired] = useState(false);

  const timerIntervalRef = useRef(null);
  const hasSubmittedRef = useRef(false);
  
  // ⭐ NOWY REF - zawsze aktualny stan answers
  const answersRef = useRef({});

  const navigate = useNavigate();

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
        answers: {},
      });
    } catch (err) {
      console.error("Błąd zapisu nieudanej próby (anti-cheat quiz):", err);
    } finally {
      setCheatReason(reason);
    }
  }, [api, exerciseId, readingTimeMs]);

  const { stopListeners } = useAntiCheating(
    handleCheating,
    true,
    true
  );

  const stopListenersRef = useRef(() => { });
  useEffect(() => {
    stopListenersRef.current = stopListeners;
  }, [stopListeners]);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

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
    if (isSubmitting || hasSubmittedRef.current || cheatingInProgress.current) return;

    console.log("=== 🔍 DEBUG QUIZ (FRONTEND) ===");
    console.log("1️⃣ Liczba pytań:", questions.length);
    console.log("2️⃣ Obiekt finalAnswers:", finalAnswers);
    console.log("3️⃣ Liczba odpowiedzi:", Object.keys(finalAnswers).length);
    console.log("4️⃣ JSON do wysłania:", JSON.stringify({
      exercise: exerciseId,
      reading_time_ms: readingTimeMs,
      answers: finalAnswers,
    }, null, 2));

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

      console.log("5️⃣ Odpowiedź z backendu:", res.data);
      setResultData(res.data);
      setTimeout(() => onFinish(), 5000);
    } catch (err) {
      console.error("❌ Błąd zapisu wyniku quizu:", err);
      console.error("Szczegóły błędu:", err.response?.data);
      alert(`Błąd: ${err.response?.data?.error || "Nie udało się zapisać wyniku"}`);
      setIsSubmitting(false);
      hasSubmittedRef.current = false;
      navigate("/dashboard");
    }
  };

  const handleSubmit = () => {
    submitQuiz(answersRef.current);
  };

  const handleAnswerChange = (questionId, value) => {
    console.log(`📝 Zmiana odpowiedzi: Pytanie ${questionId} = "${value}"`);
    setAnswers(prev => {
      const updated = { ...prev, [String(questionId)]: value };
      console.log("📦 Aktualny stan answers:", updated);
      return updated;
    });
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimerColorClasses = () => {
    const percentage = (timeRemaining / (questions.length * 20)) * 100;
    if (percentage > 50) return 'border-success text-success bg-success/10';
    if (percentage > 25) return 'border-warning text-warning bg-warning/10';
    return 'border-danger text-danger bg-danger/10';
  };

  const timerColor = getTimerColorClasses();

  return (
    <>
      {cheatReason && (
        <CheatPopup
          reason={cheatReason}
          onClose={() => navigate('/dashboard')}
        />
      )}

      <div className={`mx-auto max-w-3xl p-4 md:p-8 w-full ${cheatReason ? 'blur-sm' : ''}`}>
        <div className="bg-background-elevated shadow-md rounded-lg border border-border p-8">

          {resultData === null && !timerExpired && (
            <div
              className={`sticky top-4 z-10 mb-8 p-4 rounded-md border-2 flex items-center justify-between ${timerColor}`}
            >
              <div className="flex items-center gap-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" />
                </svg>
                <span className="font-semibold">
                  Pozostały czas: <strong className="text-xl">{formatTime(timeRemaining)}</strong>
                </span>
              </div>
              <span className="text-sm text-text-secondary">
                {questions.length * 20}s łącznie
              </span>
            </div>
          )}

          <h2 className="text-3xl font-bold mb-6 text-center text-text-primary">
            Quiz - Sprawdź zrozumienie
          </h2>

          {resultData === null ? (
            <>
              {questions.map((q, idx) => (
                <div key={q.id} className="bg-background-surface border-2 border-border rounded-lg p-8 mb-6">
                  <p className="text-text-secondary text-sm font-semibold mb-3">
                    Pytanie {idx + 1}/{questions.length}
                    <span className="ml-2.5 inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-primary/15 text-primary-light border border-primary/30">
                      {q.question_type === 'choice' ? 'Zamknięte' : 'Otwarte'}
                    </span>
                  </p>
                  <p className="text-xl font-semibold mb-6 text-text-primary">
                    {q.text}
                  </p>

                  {q.question_type === 'choice' ? (
                    <div className="flex flex-col gap-2">
                      {[q.option_1, q.option_2, q.option_3, q.option_4].map((option, optionIdx) => (
                        <button
                          key={optionIdx}
                          onClick={() => handleAnswerChange(q.id, option)}
                          className={`block w-full p-4 text-left rounded-md border-2 transition-all font-medium ${
                            answers[String(q.id)] === option 
                            ? 'bg-primary/20 border-primary text-text-primary'
                            : 'bg-background-main border-border text-text-primary hover:bg-background-surface-hover hover:border-primary-light'
                            }`}
                          disabled={isSubmitting || timerExpired}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <input
                      type="text"
                      className="block w-full rounded-md border-2 border-border bg-background-main px-4 py-3.5 text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                      placeholder="Twoja odpowiedź..."
                      value={answers[String(q.id)] || ""} 
                      onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                      disabled={isSubmitting || timerExpired}
                    />
                  )}

                </div>
              ))}
              <button
                onClick={handleSubmit}
                className="inline-flex items-center justify-center gap-2 w-full px-8 py-4 rounded-md font-semibold transition-all text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 bg-gradient-to-r from-primary to-primary-light text-lg disabled:opacity-60"
                disabled={isSubmitting || timerExpired}
              >
                {isSubmitting ? 'Zapisywanie...' : 'Sprawdź odpowiedzi'}
              </button>
            </>
          ) : (
            <div className="animate-fade-in text-center py-8">
              {resultData.ranking_points > 0 ? (
                <div className="bg-success/10 border-2 border-success rounded-lg p-8">
                  <div className="text-6xl">🏆</div>
                  <h2 className="text-3xl font-bold text-success mt-4 mb-2">
                    {resultData.counted_for_ranking ? 'Wynik Rankingowy!' : 'Wynik Zapisany!'}
                  </h2>
                  <p className="text-text-secondary mb-4">{resultData.message}</p>
                  <div className="inline-flex items-center gap-1.5 px-6 py-3 text-xl font-semibold rounded-full bg-success/15 text-success border border-success/30">
                    Punkty: <strong>{resultData.ranking_points}</strong>
                  </div>
                </div>
              ) : (
                <div className="bg-danger/10 border-2 border-danger rounded-lg p-8">
                  <div className="text-6xl">❌</div>
                  <h2 className="text-3xl font-bold text-danger mt-4 mb-2">
                    {timerExpired ? 'Czas minął!' : 'Poniżej Progu!'}
                  </h2>
                  <p className="text-text-secondary mb-4">
                    Potrzebujesz min. 60% trafności, aby zdobyć punkty rankingowe.
                  </p>
                  <div className="inline-flex items-center gap-1.5 px-6 py-3 text-xl font-semibold rounded-full bg-danger/15 text-danger border border-danger/30">
                    Punkty: <strong>0</strong>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 my-6">
                <div className="bg-background-surface border border-border p-4 rounded-lg">
                  <div className="text-text-secondary mb-2">Twoja Prędkość</div>
                  <div className="text-3xl font-bold text-text-primary">{resultData.wpm} WPM</div>
                </div>
                <div className="bg-background-surface border border-border p-4 rounded-lg">
                  <div className="text-text-secondary mb-2">Trafność</div>
                  <div className="text-3xl font-bold text-text-primary">{resultData.accuracy.toFixed(1)}%</div>
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