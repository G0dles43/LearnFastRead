import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import Quiz from "./Quiz";
import HighlightReader from "./HighlightReader";
import RSVPReader from "./RSVPReader";
import ChunkingReader from "./ChunkingReader";
import { getDynamicDelay } from "../utils/readingUtils.js";

export default function TrainingSession() {
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
  const [attemptStatus, setAttemptStatus] = useState(null); // Przechowuje { can_rank: bool, message: string, ... }

  const [finalReadingTime, setFinalReadingTime] = useState(0);

  useEffect(() => {
    if (!token) return;
    axios
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
  }, [token]);

  useEffect(() => {
    async function fetchExerciseData() {
      try {
        const exerciseRes = await axios.get(
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
          const statusRes = await axios.get(
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
  }, [id, token]);

  useEffect(() => {
    if (words.length === 0 || isPaused || hasEnded) return;

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
  }, [index, words, speed, isMuted, isPaused, mode, hasEnded, chunkSize]);

  const finishExercise = () => {
    setHasEnded(true);
    const endTime = Date.now();
    const readingTimeMs = endTime - startTime; 
    setFinalReadingTime(readingTimeMs); 

    // Sprawdzamy czy to ćwiczenie rankingowe ORAZ czy użytkownik może zdobywać punkty
    if (exercise?.is_ranked && attemptStatus?.can_rank) {
      axios
        .get(`http://127.0.0.1:8000/api/exercises/${id}/questions/`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => {
          setQuestions(res.data);
          setShowQuiz(true); // Pokaż quiz tylko jeśli można zdobywać punkty
        });
    } else {
      // Dla ćwiczeń nierankingowych lub powtórzeń rankingowych (bez quizu)
      const minutes = readingTimeMs / 60000;
      const wpm = Math.round(words.length / minutes);
      alert(`Ćwiczenie treningowe ukończone! Prędkość: ${wpm} słów/min`);
      navigate("/dashboard");
    }
  };
  // --- KONIEC POPRAWKI ---

  const handleRestart = () => {
    setIndex(0);
    setHasEnded(false);
    setStartTime(Date.now());
    setShowQuiz(false);
    setIsPaused(false);
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
    // Dodano sprawdzenie attemptStatus, aby poczekać na załadowanie
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[rgba(15,15,30,0.97)] to-[rgba(26,26,46,0.97)]">
        <div className="spinner"></div>
      </div>
    );
  }

  // Sprawdzamy czy to ćwiczenie rankingowe gdzie użytkownik może zdobywać punkty
  const isRankingWithQuiz = exercise?.is_ranked && attemptStatus?.can_rank;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[rgba(15,15,30,0.97)] to-[rgba(26,26,46,0.97)] p-8 flex flex-col">
      {/* Header with controls */}
      <div className="max-w-[1400px] w-full mx-auto mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">
            {exercise?.title || 'Trening czytania'}
          </h1>
          
          {/* --- POPRAWIONA LOGIKA ODZNAKI --- */}
          {exercise?.is_ranked && (
            <>
              {/* Pokaż "RANKINGOWE" lub "TRENING" na podstawie statusu */}
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
          {/* --- KONIEC POPRAWKI --- */}

        </div>

        {/* Control buttons */}
        <div className="flex gap-3">
          {/* Ukryj pauzę, jeśli to podejście rankingowe z quizem */}
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
            onClick={() => navigate("/dashboard")}
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
        <div className="card card-elevated flex-1 flex items-center justify-center min-h-[400px] relative overflow-hidden">
          {/* Pause overlay */}
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

        {/* Stats panel */}
        {!showQuiz && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Progress card */}
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

            {/* WPM card */}
            <div className="card p-5">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-secondary to-[#a78bfa] flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                  </svg>
                </div>
                <div>
                  <div className="text-sm text-text-secondary">
                    Aktualne tempo
                  </div>
                  <div className="text-xl font-bold">
                    {currentWPM} WPM
                  </div>
                </div>
              </div>
            </div>

            {/* Time remaining card */}
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
  );
}