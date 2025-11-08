// src/Components/TrainingSession.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import Quiz from "./Quiz";
import HighlightReader from "./HighlightReader";
import RSVPReader from "./RSVPReader";
import ChunkingReader from "./ChunkingReader";
import { getDynamicDelay } from "../utils/readingUtils.js";
import useAntiCheating from "../hooks/useAntiCheating.js";
import CheatPopup from "./CheatPopup.jsx";

export default function TrainingSession({ api }) {
  const [words, setWords] = useState([]);
  const [index, setIndex] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [hasEnded, setHasEnded] = useState(false);
  const [mode, setMode] = useState("rsvp");
  const { id } = useParams();
  const navigate = useNavigate();

  const token = localStorage.getItem("access");
  const decoded = token ? jwtDecode(token) : null;
  const userId = decoded?.user_id;

  const [speed, setSpeed] = useState(200);
  const [isMuted, setIsMuted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [chunkSize, setChunkSize] = useState(3);
  const [highlightDimensions, setHighlightDimensions] = useState({
    width: 600,
    height: 300,
  });

  const totalWords = words.length;
  const remainingWords = totalWords - index;
  const estimatedTimeLeftSec = Math.ceil((remainingWords * speed) / 1000);
  const progress = totalWords > 0 ? (index / totalWords) * 100 : 0;
  const currentWPM = startTime ? Math.round(index / ((Date.now() - startTime) / 60000)) : 0;

  const [questions, setQuestions] = useState([]);
  const [showQuiz, setShowQuiz] = useState(false);
  const [exercise, setExercise] = useState(null);
  const [attemptStatus, setAttemptStatus] = useState(null); 

  const [finalReadingTime, setFinalReadingTime] = useState(0);

  const [cheatReason, setCheatReason] = useState(null);
  const cheatingInProgress = useRef(false);

  const handleCheating = useCallback(async (reason) => {
    if (cheatingInProgress.current || hasEnded) return; 
    cheatingInProgress.current = true;
    
    stopListenersRef.current(); 
    
    const readingTimeMs = Date.now() - startTime; 
    setHasEnded(true); 

    if (!api) {
      console.error("Anti-cheat: Brak API");
      setCheatReason(reason); 
      return;
    }

    try {
      await api.post("submit-progress/", {
        exercise: id,
        reading_time_ms: readingTimeMs,
        answers: {}, 
      });
    } catch (err) {
      console.error("Błąd zapisu nieudanej próby (anti-cheat):", err);
    } finally {
      setCheatReason(reason);
    }
  }, [api, id, startTime, hasEnded, navigate]);

  const { stopListeners } = useAntiCheating(
    handleCheating, 
    false, 
    exercise?.is_ranked && attemptStatus?.can_rank
  );

  const stopListenersRef = useRef(() => {});
  useEffect(() => {
    stopListenersRef.current = stopListeners;
  }, [stopListeners]);
  // === KONIEC KODU ANTI-CHEAT ===

  useEffect(() => {
      if (!token || !api) return;    
      api
      .get("http://127.0.0.1:8000/api/user/settings/", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setSpeed(res.data.speed);
        setIsMuted(res.data.muted);
        setMode(res.data.mode || "rsvp");
        setChunkSize(res.data.chunk_size || 3);
        setHighlightDimensions({
          width: res.data.highlight_width || 600,
          height: res.data.highlight_height || 300,
        });
      })
      .catch(() => {
        setSpeed(200);
        setIsMuted(false);
        setMode("rsvp");
        setChunkSize(3);
      });
  }, [token, api]);

  useEffect(() => {
    if (!api) return;
    async function fetchExerciseData() {
      try {
        const exerciseRes = await api.get(
          `http://127.0.0.1:8000/api/exercises/${id}/`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const exerciseData = exerciseRes.data;
        setExercise(exerciseData);
        
        if (exerciseData) {
          const cleanText = exerciseData.text
            .replace(/<[^>]+>|\([^)]*\)|[\[\]{};:,<>/\\|_\-+=]/g, "")
            .replace(/\s+/g, " ")
            .trim();

          const wordList = cleanText.split(/\s+/);
          setWords(wordList);
          setStartTime(Date.now());
          setIndex(0);
          setHasEnded(false);
        }
        
        if (exerciseData.is_ranked) {
          const statusRes = await api.get(
            `http://127.0.0.1:8000/api/exercises/${id}/attempt-status/`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          setAttemptStatus(statusRes.data);
        }
      } catch (error) {
        console.error("Błąd ładowania ćwiczenia:", error);
      }
    }
    fetchExerciseData();
  }, [id, token, api]);

  useEffect(() => {
    // Zatrzymaj, jeśli trwa oszustwo LUB pauza LUB koniec
    if (cheatingInProgress.current || words.length === 0 || isPaused || hasEnded) return;

    if (index < words.length) {
      const increment = mode === "chunking" ? chunkSize : 1;
      
      let delay;

      if (mode === "chunking") {
        delay = speed * chunkSize;
      } else {
        const currentWord = words[index];
        delay = getDynamicDelay(currentWord, speed); 
      }

      const timer = setTimeout(() => {
        setIndex((prev) => Math.min(prev + increment, words.length));
      }, delay);

      if (!isMuted && (mode === 'rsvp' || mode === 'highlight')) {
        const sound = new Audio("/click.mp3");
        sound.play().catch(() => {});
      }

      return () => clearTimeout(timer);
    } else if (index >= words.length && !hasEnded) {
      finishExercise();
    }
  }, [index, words, speed, isMuted, isPaused, mode, hasEnded, chunkSize, cheatingInProgress.current]);

  const finishExercise = () => {
    if (hasEnded || cheatingInProgress.current) return; // Nie kończ, jeśli już skończone lub wykryto oszustwo
    stopListeners(); // ZATRZYMAJ ANTI-CHEAT
    setHasEnded(true);
    const endTime = Date.now();
    const readingTimeMs = endTime - startTime; 
    setFinalReadingTime(readingTimeMs); 

    if (exercise?.is_ranked && attemptStatus?.can_rank) {
      api.get(`exercises/${id}/questions/`, { 
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => {
          setQuestions(res.data);
          setShowQuiz(true); 
        })
        .catch(err => {
            console.error("Nie udało się pobrać pytań do quizu", err);
            alert("Błąd: Nie udało się wczytać pytań quizu. Spróbuj ponownie.");
            navigate("/dashboard");
        });
    } else {
      if (!api) {
          alert("Błąd API. Nie udało się zapisać postępu.");
          navigate("/dashboard");
          return;
      }
      api.post("submit-progress/", { 
          exercise: id,
          reading_time_ms: readingTimeMs,
          answers: {}, 
      })
      .then(res => {
          alert(res.data.message);
          navigate("/dashboard");
      })
      .catch(err => {
          console.error("Błąd zapisu wyniku treningu:", err);
          alert(`Trening ukończony! (Nie udało się zapisać postępu: ${err.response?.data?.error || 'Błąd'})`);
          navigate("/dashboard");
      });
    }
  };

  const handleRestart = () => {
    stopListeners(); // Zatrzymaj stary anti-cheat
    setIndex(0);
    setHasEnded(false);
    setStartTime(Date.now());
    setShowQuiz(false);
    setIsPaused(false);
    cheatingInProgress.current = false; // Zresetuj flagę oszustwa
    setCheatReason(null); // Ukryj popup
    // Hook useAntiCheating sam się reaktywuje dzięki zmianie stanu `exercise` i `attemptStatus`
  };

  const renderReader = () => {
    switch(mode) {
      case "rsvp":
        return <RSVPReader currentWord={words[index]} />;
      case "highlight":
        return (
          <HighlightReader
            text={words.join(" ")}
            currentIndex={index}
            width={highlightDimensions.width}
            height={highlightDimensions.height}
          />
        );
      case "chunking":
        return (
          <ChunkingReader
            words={words}
            currentIndex={index}
            chunkSize={chunkSize}
          />
        );
      default:
        return <RSVPReader currentWord={words[index]} />;
    }
  };

  if (words.length === 0 || (exercise?.is_ranked && !attemptStatus)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[rgba(15,15,30,0.97)] to-[rgba(26,26,46,0.97)]">
        <div className="spinner"></div>
      </div>
    );
  }

  const isRankingWithQuiz = exercise?.is_ranked && attemptStatus?.can_rank;

  const readerContainerClasses = `
    flex-1 flex items-center justify-center min-h-[400px] relative overflow-hidden
    ${mode !== 'highlight' ? 'card card-elevated' : ''}
  `;

  return (
    <>
      {/* POPUP ANTI-CHEAT renderowany na górze drzewa DOM */}
      {cheatReason && (
        <CheatPopup 
          reason={cheatReason} 
          onClose={() => navigate('/dashboard')} 
        />
      )}

      <div 
        className="min-h-screen bg-gradient-to-br from-[rgba(15,15,30,0.97)] to-[rgba(26,26,46,0.97)] p-8 flex flex-col"
        style={{ filter: cheatReason ? 'blur(5px)' : 'none' }} // Rozmyj tło, gdy popup jest aktywny
      >
        <div className="max-w-[1400px] w-full mx-auto mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              {exercise?.title || 'Trening czytania'}
            </h1>
            
            {exercise?.is_ranked && (
              <>
                {attemptStatus && !attemptStatus.can_rank ? (
                  <div className="badge badge-primary">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-1">
                      <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0118.8-4.3M22 12.5a10 10 0 01-18.8 4.2"/>
                    </svg>
                    TRENING (Cooldown)
                  </div>
                ) : (
                  <div className="badge badge-warning">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="mr-1">
                      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                    </svg>
                    RANKINGOWE
                  </div>
                )}
              </>
            )}

          </div>

          <div className="flex gap-3">
            {!isRankingWithQuiz && (
              <button 
                className="btn btn-ghost"
                onClick={() => setIsPaused(!isPaused)}
                disabled={showQuiz || hasEnded}
              >
                {isPaused ? (
                  <>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                    Wznów
                  </>
                ) : (
                  <>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M6 4h4v16H6zM14 4h4v16h-4z"/>
                    </svg>
                    Pauza
                  </>
                )}
              </button>
            )}

            <button 
              className="btn btn-ghost"
              onClick={handleRestart}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0118.8-4.3M22 12.5a10 10 0 01-18.8 4.2"/>
              </svg>
              Restart
            </button>

            <button 
              className="btn btn-secondary"
              onClick={() => {
                stopListeners(); // ZATRZYMAJ ANTI-CHEAT
                navigate("/dashboard");
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
              Zakończ
            </button>
          </div>
        </div>

        {/* Ranking status banner */}
        {exercise?.is_ranked && attemptStatus && !showQuiz && (
          <div className={`max-w-[1400px] w-full mx-auto mb-8 p-6 rounded-xl flex items-center gap-4 ${
            attemptStatus.can_rank 
              ? 'bg-gradient-to-r from-[rgba(245,158,11,0.15)] to-[rgba(251,191,36,0.05)] border-2 border-[rgba(245,158,11,0.3)]'
              : 'bg-gradient-to-r from-[rgba(99,102,241,0.15)] to-[rgba(139,92,246,0.05)] border-2 border-[rgba(99,102,241,0.3)]'
          }`}>
            <div className="text-5xl flex-shrink-0">
              {attemptStatus.can_rank ? '🏆' : '📊'}
            </div>
            <div className="flex-1">
              <div className="font-semibold mb-1">
                {attemptStatus.message}
              </div>
              {!attemptStatus.can_rank && attemptStatus.ranked_result && (
                <div className="text-sm text-text-secondary">
                  Twój wynik rankingowy: {attemptStatus.ranked_result.wpm} WPM | 
                  {attemptStatus.ranked_result.accuracy.toFixed(1)}% | 
                  {attemptStatus.ranked_result.points} pkt
                </div>
              )}
            </div>
          </div>
        )}

        {/* Main content area */}
        <div className="flex-1 max-w-[1400px] w-full mx-auto flex flex-col gap-8">
          {/* Reader area */}
          <div className={readerContainerClasses}>         
            {isPaused && !showQuiz && (
              <div className="absolute inset-0 bg-black/80 backdrop-blur-lg flex flex-col items-center justify-center gap-6 z-10">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="white" opacity="0.9">
                  <path d="M6 4h4v16H6zM14 4h4v16h-4z"/>
                </svg>
                <div className="text-2xl font-semibold">
                  Wstrzymano
                </div>
                <button 
                  className="btn btn-primary btn-lg"
                  onClick={() => setIsPaused(false)}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                  Kontynuuj czytanie
                </button>
              </div>
            )}

            {showQuiz ? (
              <Quiz
                api={api}
                questions={questions}
                exerciseId={id}
                readingTimeMs={finalReadingTime}
                token={token}
                attemptStatus={attemptStatus}
                onFinish={() => navigate("/dashboard")}
              />
            ) : (
              renderReader()
            )}
          </div>

          {!showQuiz && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="card p-5">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary-light flex items-center justify-center">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                      <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                      <path d="M22 4L12 14.01l-3-3"/>
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm text-text-secondary">
                      Postęp
                    </div>
                    <div className="text-xl font-bold">
                      {Math.round(progress)}%
                    </div>
                  </div>
                </div>
                <div className="progress">
                  <div 
                    className="progress-bar" 
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="text-sm text-text-secondary mt-2 text-center">
                  {index} / {totalWords} słów
                </div>
              </div>

              <div className="card p-5">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-secondary to-[#a78bfa] flex items-center justify-center">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                    </svg>
                  </div>
                  <div>
                    <div>
                      <div className="text-sm text-text-secondary">Tempo</div>
                      <div className="text-xl font-bold">
                        ~{Math.round(60000 / speed)} WPM 
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card p-5">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-warning to-[#fbbf24] flex items-center justify-center">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <path d="M12 6v6l4 2"/>
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm text-text-secondary">
                      Pozostało
                    </div>
                    <div className="text-xl font-bold">
                      {Math.floor(estimatedTimeLeftSec / 60)}:{(estimatedTimeLeftSec % 60).toString().padStart(2, '0')}
                    </div>
                  </div>
                </div>
              </div>

              <div className="card p-5">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-success to-[#059669] flex items-center justify-center">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                      <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/>
                      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm text-text-secondary">
                      Do przeczytania
                    </div>
                    <div className="text-xl font-bold">
                      {remainingWords}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  ); 
}