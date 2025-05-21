import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

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
        const res = await axios.get("http://127.0.0.1:8000/api/exercises/");
        const exercise = res.data.find((e) => e.id === parseInt(id));
        if (exercise) {
          const wordList = exercise.text.trim().split(/\s+/);
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
    if (words.length > 0 && index < words.length) {
      const timer = setTimeout(() => setIndex(index + 1), speed);

      if (!isMuted) {
        clickSound.current.play().catch(() => {});
      }

      return () => clearTimeout(timer);
    } else if (words.length > 0 && index >= words.length && !hasEnded) {
      setHasEnded(true);
      const endTime = Date.now();
      const minutes = (endTime - startTime) / 60000;
      const wpm = Math.round(words.length / minutes);

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
  }, [index, words, speed, isMuted]);

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
      <span style={{ whiteSpace: "nowrap", minWidth: "150px" }}>
        {words[index]}
      </span>
    </div>
  );
}
