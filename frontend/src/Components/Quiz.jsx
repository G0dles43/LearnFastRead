import React, { useState } from "react";
import axios from "axios";
import styles from "./Quiz.module.css"; // <-- 1. Importujemy nowy plik CSS

export default function Quiz({
  questions,
  exerciseId,
  userId,
  wpm,
  token,
  onFinish,
}) {
  const [answers, setAnswers] = useState({});
  const [quizScore, setQuizScore] = useState(null);

  const handleSubmit = () => {
    let correct = 0;
    questions.forEach((q) => {
      if (
        (answers[q.id] || "").trim().toLowerCase() ===
        q.correct_answer.trim().toLowerCase()
      ) {
        correct += 1;
      }
    });
    const acc = Math.round((correct / questions.length) * 100);
    setQuizScore(acc);

    // Zapisz wynik do backendu
    axios
      .post(
        "http://127.0.0.1:8000/api/submit-progress/",
        {
          user: userId,
          exercise: exerciseId,
          wpm,
          accuracy: acc,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then(() => {
        setTimeout(() => onFinish(), 3000); // wróć po 3 sek
      })
      .catch((err) => {
        console.error("Błąd zapisu wyniku quizu", err);
        alert("Błąd zapisu wyniku, ale quiz został sprawdzony.");
        setTimeout(() => onFinish(), 3000);
      });
  };

  // 2. Używamy klas z pliku CSS (className) zamiast style={{...}}
  return (
    <div className={styles.quizContainer}>
      <h2>Quiz - Sprawdź zrozumienie</h2>
      
      {quizScore === null ? (
        <>
          {questions.map((q) => (
            <div key={q.id} className={styles.questionBlock}>
              <p>{q.text}</p>
              <input
                type="text"
                className="input" // Używamy globalnej klasy "input"
                placeholder="Twoja odpowiedź"
                value={answers[q.id] || ""}
                onChange={(e) =>
                  setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                }
              />
            </div>
          ))}
          <button onClick={handleSubmit} className="button-primary">
            Sprawdź odpowiedzi
          </button>
        </>
      ) : (
        <div className={styles.score}>
          <p>Twój wynik: {quizScore}%</p>
          <p>Zanotowano prędkość: {wpm} Sł/min</p>
          <p style={{ color: "var(--text-secondary)", marginTop: "1rem" }}>
            Zaraz wrócisz do panelu...
          </p>
        </div>
      )}
    </div>
  );
}