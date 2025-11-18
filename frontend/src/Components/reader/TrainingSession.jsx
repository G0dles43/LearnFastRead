import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import Quiz from "../leaderboard/Quiz.jsx";
import HighlightReader from "./HighlightReader.jsx";
import RSVPReader from "./RSVPReader.jsx";
import ChunkingReader from "./ChunkingReader.jsx";
import { getDynamicDelay } from "../../utils/readingUtils.js";
import useAntiCheating from "../../hooks/useAntiCheating.js";
import CheatPopup from "../ui/CheatPopup.jsx";

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

  // --- POCZĄTEK POPRAWKI (FIX #1 - WPM) ---
  const [speed, setSpeed] = useState(200); // Domyślne 200ms
  const [isLoadingSettings, setIsLoadingSettings] = useState(true); // Nowy stan do blokowania
  // --- KONIEC POPRAWKI ---

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

    // --- POCZĄTEK POPRAWKI (FIX #1 - WPM) ---
    // Nie mamy `startTime` jeśli oszustwo nastąpiło przed startem,
    // więc wysyłamy 0 lub bardzo duży czas.
    // Ale teraz wysyłamy 'speedMs' (zgodnie z Twoją logiką), więc użyjmy 'speed' ze stanu.
    const speedMsToSend = speed || 200; // Użyj wczytanego 'speed'
    // --- KONIEC POPRAWKI ---

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
  }, [api, id, speed, hasEnded, navigate]); // Zależność od 'speed'

  const { stopListeners } = useAntiCheating(
    handleCheating,
    false,
    exercise?.is_ranked && attemptStatus?.can_rank
  );

  const stopListenersRef = useRef(() => { });
  useEffect(() => {
    stopListenersRef.current = stopListeners;
  }, [stopListeners]);

  // --- POCZĄTEK POPRAWKI (FIX #1 - WPM) ---
  // Dzielimy logikę na dwa etapy:
  // 1. Wczytaj USTAWIENIA
  useEffect(() => {
    if (!token || !api) {
        setIsLoadingSettings(false);
        return;
    }
    
    setIsLoadingSettings(true); // Rozpocznij ładowanie ustawień
    api
      .get("http://127.0.0.1:8000/api/user/settings/", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        // Ustaw WSZYSTKIE dane
        setSpeed(res.data.speed); // np. 154ms (390 WPM)
        setIsMuted(res.data.muted);
        setMode(res.data.mode || "rsvp");
        setChunkSize(res.data.chunk_size || 3);
        setHighlightDimensions({
          width: res.data.highlight_width || 600,
          height: res.data.highlight_height || 300,
        });
      })
      .catch(() => {
        // Ustawienia domyślne w razie błędu
        setSpeed(200);
        setIsMuted(false);
        setMode("rsvp");
        setChunkSize(3);
      })
      .finally(() => {
        setIsLoadingSettings(false); // Zakończ ładowanie ustawień
      });
  }, [token, api]);

  // 2. Wczytaj TEKST (dopiero gdy ustawienia są gotowe)
  useEffect(() => {
    // Nie rób nic, jeśli ustawienia się jeszcze wczytują
    if (!api || isLoadingSettings) return; 
    
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
          setIndex(0);
          setHasEnded(false);
          setStartTime(Date.now()); // Uruchom stoper DOPIERO TERAZ
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
  }, [id, token, api, isLoadingSettings]); // Zależność od isLoadingSettings
  // --- KONIEC POPRAWKI (FIX #1 - WPM) ---

  useEffect(() => {
    // --- POCZĄTEK POPRAWKI (FIX #1 - WPM) ---
    // Nie uruchamiaj timera, jeśli ustawienia lub tekst się ładują LUB nie ma stopera
    if (isLoadingSettings || !startTime || cheatingInProgress.current || words.length === 0 || isPaused || hasEnded) return;
    // --- KONIEC POPRAWKI ---

    if (index < words.length) {
      const increment = mode === "chunking" ? chunkSize : 1;

      let delay;

      if (mode === "chunking") {
        delay = speed * chunkSize;
      } else {
        const currentWord = words[index];
        delay = getDynamicDelay(currentWord, speed); // 'speed' jest teraz poprawnie wczytany
      }

      const timer = setTimeout(() => {
        setIndex((prev) => Math.min(prev + increment, words.length));
      }, delay);

      if (!isMuted && (mode === 'rsvp' || mode === 'highlight')) {
        const sound = new Audio("/click.mp3");
        sound.play().catch(() => { });
      }

      return () => clearTimeout(timer);
    } else if (index >= words.length && !hasEnded) {
      finishExercise();
    }
  }, [index, words, speed, isMuted, isPaused, mode, hasEnded, chunkSize, cheatingInProgress.current, isLoadingSettings, startTime]); // Dodane zależności

  const finishExercise = () => {
    // Zabezpieczenie przed podwójnym wywołaniem
    if (hasEnded || cheatingInProgress.current) return;
    
    stopListeners();
    setHasEnded(true);

    // --- FIX START: Wymuszenie zaokrąglania w dół (351 -> 350) ---
    
    // 1. Najpierw obliczamy docelowe WPM na podstawie ustawienia 'speed'.
    // Używamy Math.floor, aby 350.87 (z 171ms) stało się 350.
    const targetWpm = Math.floor(60000 / speed);

    // 2. Teraz obliczamy czas (w ms), jaki musimy wysłać do backendu,
    // aby backend po swoim przeliczeniu otrzymał dokładnie ten WPM.
    // Wzór: Czas = (Liczba Słów / WPM) * 60000
    let calculatedReadingTimeMs = (words.length / targetWpm) * 60000;
    
    // Zabezpieczenie: Jeśli wynik to np. 350.0, backendowy round() jest bezpieczny.
    // Ale dla pewności, że nie wyjdzie 350.999 przez floaty JS, możemy minimalnie 
    // zwiększyć czas (o 1ms), co minimalnie zaniży WPM, gwarantując "podłogę".
    calculatedReadingTimeMs += 1; 

    // --- FIX END ---

    console.log(`Speed: ${speed}ms | Target WPM: ${targetWpm}`);
    console.log(`Wysyłam czas: ${calculatedReadingTimeMs} ms (aby backend wyliczył ${targetWpm} WPM)`);

    setFinalReadingTime(calculatedReadingTimeMs);

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
        reading_time_ms: calculatedReadingTimeMs, // <--- WYSYŁAMY SKORYGOWANY CZAS
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
    stopListeners();
    setIndex(0);
    setHasEnded(false);
    setStartTime(Date.now()); // Restartuj stoper
    setShowQuiz(false);
    setIsPaused(false);
    cheatingInProgress.current = false;
    setCheatReason(null);
  };

  const renderReader = () => {
    switch (mode) {
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

  // --- POCZĄTEK POPRAWKI (FIX #1 - WPM) ---
  // Pokaż ładowanie, jeśli wczytujemy ustawienia LUB tekst
  if (isLoadingSettings || words.length === 0 || (exercise?.is_ranked && !attemptStatus)) {
  // --- KONIEC POPRAWKI ---
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-main">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const isRankingWithQuiz = exercise?.is_ranked && attemptStatus?.can_rank;

  const readerContainerClasses = `
    flex-1 flex items-center justify-center min-h-[400px] relative overflow-hidden
    ${mode !== 'highlight' ? 'bg-background-elevated shadow-lg rounded-lg border border-border' : ''}
  `;

  return (
    <>
      {cheatReason && (
        <CheatPopup
          reason={cheatReason}
          onClose={() => navigate('/dashboard')}
        />
      )}

      <div
        className={`min-h-screen bg-gradient-to-br from-background-main/95 to-background-surface/95 bg-[url('/3.png')] bg-cover bg-center bg-fixed p-4 md:p-8 flex flex-col text-text-primary ${cheatReason ? 'blur-sm' : 'none'
          }`}
      >
        <div className="max-w-[1400px] w-full mx-auto mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2 text-text-primary">
              {exercise?.title || 'Trening czytania'}
            </h1>

            {exercise?.is_ranked && (
              <>
                {attemptStatus && !attemptStatus.can_rank ? (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-primary/15 text-primary-light border border-primary/30">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-1">
                      <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0118.8-4.3M22 12.5a10 10 0 01-18.8 4.2" />
                    </svg>
                    TRENING (Cooldown)
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-warning/15 text-warning border border-warning/30">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="mr-1">
                      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
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
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md font-semibold transition-all bg-transparent text-text-secondary hover:bg-background-surface hover:text-text-primary disabled:opacity-50"
                onClick={() => setIsPaused(!isPaused)}
                disabled={showQuiz || hasEnded}
              >
                {isPaused ? (
                  <>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                    Wznów
                  </>
                ) : (
                  <>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M6 4h4v16H6zM14 4h4v16h-4z" />
                    </svg>
                    Pauza
                  </>
                )}
              </button>
            )}

            <button
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md font-semibold transition-all bg-transparent text-text-secondary hover:bg-background-surface hover:text-text-primary"
              onClick={handleRestart}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0118.8-4.3M22 12.5a10 10 0 01-18.8 4.2" />
              </svg>
              Restart
            </button>

            <button
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md font-semibold transition-all bg-background-surface text-text-primary border border-border-light hover:bg-background-surface-hover hover:border-primary"
              onClick={() => {
                stopListeners();
                navigate("/dashboard");
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
              Zakończ
            </button>
          </div>
        </div>

        {exercise?.is_ranked && attemptStatus && !showQuiz && (
          <div className={`max-w-[1400px] w-full mx-auto mb-8 p-6 rounded-xl flex items-center gap-4 border-2 ${attemptStatus.can_rank
            ? 'bg-warning/15 border-warning/30'
            : 'bg-primary/15 border-primary/30'
            }`}>
            <div className="text-5xl flex-shrink-0">
              {attemptStatus.can_rank ? '🏆' : '📊'}
            </div>
            <div className="flex-1">
              <div className="font-semibold text-text-primary mb-1">
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

        <div className="flex-1 max-w-[1400px] w-full mx-auto flex flex-col gap-8">
          <div className={readerContainerClasses}>
            {isPaused && !showQuiz && (
              <div className="absolute inset-0 bg-background-elevated/90 backdrop-blur-lg flex flex-col items-center justify-center gap-6 z-10">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor" className="text-text-primary opacity-90">
                  <path d="M6 4h4v16H6zM14 4h4v16h-4z" />
                </svg>
                <div className="text-2xl font-semibold text-text-primary">
                  Wstrzymano
                </div>
                <button
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-md font-semibold transition-all text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 bg-gradient-to-r from-primary to-primary-light text-lg"
                  onClick={() => setIsPaused(false)}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
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
              // --- POCZĄTEK POPRAWKI (FIX #1 - WPM) ---
                readingTimeMs={finalReadingTime} // Przekazujemy FAKTYCZNY czas
              // --- KONIEC POPRAWKI ---
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
              <div className="bg-background-elevated shadow-md rounded-lg border border-border p-5">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary-light flex items-center justify-center flex-shrink-0">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                      <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                      <path d="M22 4L12 14.01l-3-3" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm text-text-secondary">
                      Postęp
                    </div>
                    <div className="text-xl font-bold text-text-primary">
                      {Math.round(progress)}%
                    </div>
                  </div>
                </div>
                <div className="w-full h-2 bg-background-main rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-primary-light rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="text-sm text-text-secondary mt-2 text-center">
                  {index} / {totalWords} słów
                </div>
              </div>

              <div className="bg-background-elevated shadow-md rounded-lg border border-border p-5">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-secondary to-primary-light flex items-center justify-center flex-shrink-0">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm text-text-secondary">Ustawione WPM</div>
                    <div className="text-xl font-bold text-text-primary">
                      {Math.round(60000 / speed)} WPM
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-background-elevated shadow-md rounded-lg border border-border p-5">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-warning to-yellow-500 flex items-center justify-center flex-shrink-0">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 6v6l4 2" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm text-text-secondary">
                      Pozostało
                    </div>
                    <div className="text-xl font-bold text-text-primary">
                      {Math.floor(estimatedTimeLeftSec / 60)}:{(estimatedTimeLeftSec % 60).toString().padStart(2, '0')}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-background-elevated shadow-md rounded-lg border border-border p-5">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-success to-green-600 flex items-center justify-center flex-shrink-0">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                      <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
                      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm text-text-secondary">
                      Do przeczytania
                    </div>
                    <div className="text-xl font-bold text-text-primary">
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