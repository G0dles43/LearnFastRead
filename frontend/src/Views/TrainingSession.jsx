import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";

export default function TrainingSession() {
  const [words, setWords] = useState([]);
  const [index, setIndex] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [hasEnded, setHasEnded] = useState(false);
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchText() {
      const res = await axios.get(`http://127.0.0.1:8000/api/exercises/`);
      const exercise = res.data.find((e) => e.id === parseInt(id));
      if (exercise) {
        const wordList = exercise.text.trim().split(/\s+/);
        setWords(wordList);
        setStartTime(Date.now());
      }
    }
    fetchText();
  }, [id]);

  useEffect(() => {
    if (words.length > 0 && index < words.length) {
      const timer = setTimeout(() => setIndex(index + 1), 200);
      return () => clearTimeout(timer);
    } else if (words.length > 0 && index >= words.length && !hasEnded) {
      setHasEnded(true);
      const endTime = Date.now();
      const minutes = (endTime - startTime) / 60000;
      const wpm = Math.round(words.length / minutes);

      axios.post("http://127.0.0.1:8000/api/submit-progress/", {
        user: decoded_user_id_from_JWT,
        exercise: id,
        wpm,
        accuracy: 100,
      });

      alert(`Ćwiczenie ukończone! Prędkość: ${wpm} słów/min`);
      navigate("/dashboard");
    }
  }, [index, words]);

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
