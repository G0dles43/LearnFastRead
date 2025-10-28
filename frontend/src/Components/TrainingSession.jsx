import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import Quiz from "./Quiz";
import HighlightReader from "./HighlightReader";
import RSVPReader from "./RSVPReader";
import ChunkingReader from "./ChunkingReader";
import styles from "./Training.module.css";

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

  const [questions, setQuestions] = useState([]);
  const [showQuiz, setShowQuiz] = useState(false);
  const [exercise, setExercise] = useState(null);
  
  // NOWE: Status próby rankingowej
  const [attemptStatus, setAttemptStatus] = useState(null);

  // Pobierz ustawienia użytkownika
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

  // Pobierz tekst ćwiczenia i status próby
  useEffect(() => {
    async function fetchExerciseData() {
      try {
        // Pobierz ćwiczenie
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
        
        // Jeśli to ćwiczenie rankingowe, sprawdź status próby
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

  // Kończenie ćwiczenia
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

  if (words.length === 0) return <p className={styles.loading}>Ładowanie...</p>;

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

  return (
    <div className={styles.sessionContainer}>
      {/* Banner o statusie rankingowym */}
      {exercise?.is_ranked && attemptStatus && !showQuiz && (
        <div className={`${styles.rankingBanner} ${attemptStatus.can_rank ? styles.canRank : styles.cannotRank}`}>
          {attemptStatus.can_rank ? (
            <>
              <span className={styles.bannerIcon}>🏆</span>
              <span>{attemptStatus.message}</span>
            </>
          ) : (
            <>
              <span className={styles.bannerIcon}>📊</span>
              <span>{attemptStatus.message}</span>
              {attemptStatus.ranked_result && (
                <span className={styles.previousScore}>
                  Twój wynik rankingowy: {attemptStatus.ranked_result.wpm} WPM | 
                  {attemptStatus.ranked_result.accuracy.toFixed(1)}% | 
                  {attemptStatus.ranked_result.points} pkt
                </span>
              )}
            </>
          )}
        </div>
      )}
      
      <div className={styles.controls}>
        <button className="button-secondary" onClick={() => navigate("/dashboard")}>
          Przerwij
        </button>
        <button className="button-secondary" onClick={() => setIsPaused(!isPaused)}>
          {isPaused ? "Wznów" : "Pauza"}
        </button>
        <button
          className="button-secondary"
          onClick={() => {
            setIndex(0);
            setHasEnded(false);
            setStartTime(Date.now());
            setShowQuiz(false);
          }}
        >
          Restart
        </button>
      </div>

      {showQuiz ? (
        <Quiz
          questions={questions}
          exerciseId={id}
          userId={userId}
          wpm={Math.round(words.length / ((Date.now() - startTime) / 60000))}
          token={token}
          attemptStatus={attemptStatus}
          onFinish={() => navigate("/dashboard")}
        />
      ) : (
        renderReader()
      )}

      {!showQuiz && (
        <div className={styles.statusBar}>
          <p>
            Słowo: {index + 1} / {totalWords}
          </p>
          <progress
            className={styles.progressBar}
            value={index + 1}
            max={totalWords}
          ></progress>
          <p>Pozostało ok: {estimatedTimeLeftSec}s</p>
        </div>
      )}
    </div>
  );
}