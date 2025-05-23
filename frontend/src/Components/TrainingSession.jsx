import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import Quiz from "./Quiz";

export default function TrainingSession() {
  const [words, setWords] = useState([]);
  const [index, setIndex] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [hasEnded, setHasEnded] = useState(false);
  const { id } = useParams();
  const navigate = useNavigate();

  const clickSound = useRef(new Audio("/click.mp3"));
  const token = localStorage.getItem("access");
  const decoded = token ? jwtDecode(token) : null;
  const userId = decoded?.user_id;

  const [speed, setSpeed] = useState(200);
  const [isMuted, setIsMuted] = useState(false);

  const [isPaused, setIsPaused] = useState(false);

  const totalWords = words.length;
  const remainingWords = totalWords - index;
  const estimatedTimeLeftSec = Math.ceil((remainingWords * speed) / 1000);

  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizScore, setQuizScore] = useState(null);
  const [exercise, setExercise] = useState(null);

  useEffect(() => {
    if (!token) return;
    axios
      .get("http://127.0.0.1:8000/api/user/settings/", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setSpeed(res.data.speed);
        setIsMuted(res.data.muted);
      })
      .catch(() => {
        setSpeed(200);
        setIsMuted(false);
      });
  }, [token]);

  useEffect(() => {
    async function fetchText() {
      try {
        const res = await axios.get(
          `http://127.0.0.1:8000/api/exercises/${id}/`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
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
  }, [id]);

  useEffect(() => {
    if (words.length > 0 && index < words.length && !isPaused) {
      const timer = setTimeout(() => setIndex(index + 1), speed);

      if (!isMuted) {
        const sound = new Audio("/click.mp3");
        sound.play().catch(() => {});
      }

      return () => clearTimeout(timer);
    } else if (words.length > 0 && index >= words.length && !hasEnded) {
      setHasEnded(true);
      const endTime = Date.now();
      const minutes = (endTime - startTime) / 60000;
      const wpm = Math.round(words.length / minutes);

      if (exercise?.is_ranked) {
        // POBIERZ PYTANIA
        axios
          .get(`http://127.0.0.1:8000/api/exercises/${id}/questions/`, {
            headers: { Authorization: `Bearer ${token}` },
          })
          .then((res) => {
            setQuestions(res.data);
            setShowQuiz(true); // wyświetl quiz
          });
      } else {
        // Zwykłe ćwiczenie
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
      alert(`Ćwiczenie ukończone! Prędkość: ${wpm} słów/min`);
    }
  }, [index, words, speed, isMuted, isPaused]);

  if (words.length === 0) return <p>Ładowanie...</p>;

  return (
    <div
      style={{
        fontSize: "32px",
        textAlign: "center",
        marginTop: "20%",
        minHeight: "50px",
        width: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          position: "absolute",
          bottom: "20px",
          textAlign: "center",
          width: "100%",
          fontSize: "16px",
          color: "#555",
        }}
      >
        <p>
          Słowo: {index + 1} z {totalWords} • Pozostało: {estimatedTimeLeftSec}s
        </p>
      </div>

      <div
        style={{
          position: "absolute",
          justifyContent: "center",
          top: "20px",
          right: "20px",
        }}
      >
        <button onClick={() => navigate("/dashboard")}>Przerwij</button>
        <button onClick={() => setIsPaused(!isPaused)}>
          {isPaused ? "Wznów" : "Pauza"}
        </button>
        <button onClick={() => setIndex(0)}>Restart</button>
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
      ) : (
        <span style={{ whiteSpace: "nowrap", minWidth: "150px" }}>
          {words[index]}
        </span>
      )}
    </div>
  );
}
