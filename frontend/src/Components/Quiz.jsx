import React, { useState } from "react";
import axios from "axios";

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
      });
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Quiz</h2>
      {questions.map((q) => (
        <div key={q.id} style={{ marginBottom: 15 }}>
          <p>{q.text}</p>
          <input
            type="text"
            placeholder="Twoja odpowiedź"
            value={answers[q.id] || ""}
            onChange={(e) =>
              setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
            }
          />
        </div>
      ))}
      <button onClick={handleSubmit}>Sprawdź odpowiedzi</button>
      {quizScore !== null && (
        <p style={{ color: "green", marginTop: 10 }}>
          Twój wynik: {quizScore}% • Zaraz wrócisz do panelu
        </p>
      )}
    </div>
  );
}
