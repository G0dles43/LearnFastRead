import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import Quiz from "./Quiz";
import HighlightReader from "./HighlightReader";
import RSVPReader from "./RSVPReader";
import ChunkingReader from "./ChunkingReader";

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
  const [attemptStatus, setAttemptStatus] = useState(null);

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
      const delay = (mode === "chunking") ? (speed * chunkSize) : speed;
           
      const timer = setTimeout(() => {
        setIndex((prev) => Math.min(prev + increment, words.length));
      }, delay); 

      if (!isMuted) {
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
    const minutes = (endTime - startTime) / 60000;
    const wpm = Math.round(words.length / minutes);

    if (exercise?.is_ranked) {
      axios
        .get(`http://127.0.0.1:8000/api/exercises/${id}/questions/`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => {
          setQuestions(res.data);
          setShowQuiz(true);
        });
    } else {
      alert(`Ćwiczenie ukończone! Prędkość: ${wpm} słów/min`);
      navigate("/dashboard");
    }
  };

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

  if (words.length === 0) return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'linear-gradient(135deg, rgba(15, 15, 30, 0.97) 0%, rgba(26, 26, 46, 0.97) 100%), url("/3.png")',
      backgroundSize: 'cover'
    }}>
      <div className="spinner"></div>
    </div>
  );

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, rgba(15, 15, 30, 0.97) 0%, rgba(26, 26, 46, 0.97) 100%), url("/3.png")',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
      padding: '2rem',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header with controls */}
      <div style={{ 
        maxWidth: '1400px', 
        width: '100%', 
        margin: '0 auto 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            {exercise?.title || 'Trening czytania'}
          </h1>
          {exercise?.is_ranked && (
            <div className="badge badge-warning">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
              </svg>
              Ćwiczenie rankingowe
            </div>
          )}
        </div>

        {/* Control buttons */}
        <div style={{ display: 'flex', gap: '0.75rem' }}>
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
        <div style={{
          maxWidth: '1400px',
          width: '100%',
          margin: '0 auto 2rem',
          padding: '1.25rem 1.5rem',
          borderRadius: 'var(--radius-lg)',
          background: attemptStatus.can_rank 
            ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(251, 191, 36, 0.05))'
            : 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(139, 92, 246, 0.05))',
          border: attemptStatus.can_rank 
            ? '2px solid rgba(245, 158, 11, 0.3)'
            : '2px solid rgba(99, 102, 241, 0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <div style={{
            fontSize: '2rem',
            flexShrink: 0
          }}>
            {attemptStatus.can_rank ? '🏆' : '📊'}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
              {attemptStatus.message}
            </div>
            {!attemptStatus.can_rank && attemptStatus.ranked_result && (
              <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Twój wynik rankingowy: {attemptStatus.ranked_result.wpm} WPM | 
                {attemptStatus.ranked_result.accuracy.toFixed(1)}% | 
                {attemptStatus.ranked_result.points} pkt
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main content area */}
      <div style={{
        flex: 1,
        maxWidth: '1400px',
        width: '100%',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '2rem'
      }}>
        {/* Reader area */}
        <div className="card card-elevated" style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '400px',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Pause overlay */}
          {isPaused && !showQuiz && (
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.8)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1.5rem',
              zIndex: 10
            }}>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="white" opacity="0.9">
                <path d="M6 4h4v16H6zM14 4h4v16h-4z"/>
              </svg>
              <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>
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
              userId={userId}
              wpm={currentWPM}
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
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem'
          }}>
            {/* Progress card */}
            <div className="card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: 'var(--radius-md)',
                  background: 'linear-gradient(135deg, var(--primary), var(--primary-light))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                    <path d="M22 4L12 14.01l-3-3"/>
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Postęp
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>
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
              <div style={{ 
                fontSize: '0.85rem', 
                color: 'var(--text-secondary)',
                marginTop: '0.5rem',
                textAlign: 'center'
              }}>
                {index} / {totalWords} słów
              </div>
            </div>

            {/* WPM card */}
            <div className="card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: 'var(--radius-md)',
                  background: 'linear-gradient(135deg, var(--secondary), #a78bfa)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Aktualne tempo
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                    {currentWPM} WPM
                  </div>
                </div>
              </div>
            </div>

            {/* Time remaining card */}
            <div className="card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: 'var(--radius-md)',
                  background: 'linear-gradient(135deg, var(--warning), #fbbf24)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 6v6l4 2"/>
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Pozostało
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                    {Math.floor(estimatedTimeLeftSec / 60)}:{(estimatedTimeLeftSec % 60).toString().padStart(2, '0')}
                  </div>
                </div>
              </div>
            </div>

            {/* Words remaining card */}
            <div className="card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: 'var(--radius-md)',
                  background: 'linear-gradient(135deg, var(--success), #059669)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/>
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Do przeczytania
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>
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