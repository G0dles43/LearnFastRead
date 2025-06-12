import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import Quiz from "./Quiz";
import HighlightReader from "./HighlightReader";

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

  // Pobierz ustawienia użytkownika (speed, muted, mode)
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
        setHighlightDimensions({
          width: res.data.highlight_width || 600,
          height: res.data.highlight_height || 300,
        });
      })
      .catch(() => {
        setSpeed(200);
        setIsMuted(false);
        setMode("rsvp");
      });
  }, [token]);

  // Pobierz tekst ćwiczenia i podziel na słowa
  useEffect(() => {
    async function fetchText() {
      try {
        const res = await axios.get(
          `http://127.0.0.1:8000/api/exercises/${id}/`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const exercise = res.data;
        setExercise(exercise);
        if (exercise) {
          const cleanText = exercise.text
            .replace(/<[^>]+>|\([^)]*\)|[\[\]{};:,<>/\\|_\-+=]/g, "")
            .replace(/\s+/g, " ")
            .trim();

          const wordList = cleanText.split(/\s+/);
          setWords(wordList);
          setStartTime(Date.now());
          setIndex(0);
          setHasEnded(false);
        }
      } catch (error) {
        console.error("Błąd ładowania ćwiczenia:", error);
      }
    }
    fetchText();
  }, [id, token]);

  useEffect(() => {
    if (words.length === 0 || isPaused || hasEnded) return;

    if ((mode === "rsvp" || mode === "highlight") && index < words.length) {
      const timer = setTimeout(() => {
        setIndex((prev) => prev + 1);
      }, speed);

      if (!isMuted) {
        const sound = new Audio("/click.mp3");
        sound.play().catch(() => {});
      }

      return () => clearTimeout(timer);
    } else if (index >= words.length && !hasEnded) {
      finishExercise();
    }
  }, [index, words, speed, isMuted, isPaused, mode, hasEnded]);

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
      axios.post(
        "http://127.0.0.1:8000/api/submit-progress/",
        {
          user: userId,
          exercise: id,
          wpm,
          accuracy: 100,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(`Ćwiczenie ukończone! Prędkość: ${wpm} słów/min`);
      navigate("/dashboard");
    }
  };

  if (words.length === 0) return <p>Ładowanie...</p>;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        padding: "20px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          position: "fixed",
          top: "20px",
          right: "20px",
          display: "flex",
          gap: "10px",
          zIndex: 1000,
        }}
      >
        <button onClick={() => navigate("/dashboard")}>Przerwij</button>
        <button onClick={() => setIsPaused(!isPaused)}>
          {isPaused ? "Wznów" : "Pauza"}
        </button>
        <button
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
          onFinish={() => navigate("/dashboard")}
        />
      ) : mode === "rsvp" ? (
        <div
          style={{
            fontSize: "32px",
            textAlign: "center",
            margin: "20px 0",
            minHeight: "50px",
            width: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            position: "relative",
          }}
        >
          <span style={{ whiteSpace: "nowrap", minWidth: "150px" }}>
            {words[index]}
          </span>
        </div>
      ) : (
        <HighlightReader
          text={words.join(" ")}
          currentIndex={index}
          width={highlightDimensions.width}
          height={highlightDimensions.height}
        />
      )}

      <div
        style={{
          marginTop: "20px",
          textAlign: "center",
          fontSize: "16px",
          color: "#555",
        }}
      >
        <p>
          Słowo: {index + 1} z {totalWords} • Pozostało: {estimatedTimeLeftSec}s
        </p>
      </div>
    </div>
  );
}
