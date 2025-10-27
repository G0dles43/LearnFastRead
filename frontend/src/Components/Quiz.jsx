import React, { useState } from "react";
import axios from "axios";
import styles from "./Quiz.module.css";

export default function Quiz({
  questions,
  exerciseId,
  userId,
  wpm,
  token,
  attemptStatus,
  onFinish,
}) {
  const [answers, setAnswers] = useState({});
  const [quizScore, setQuizScore] = useState(null);
  const [rankingResult, setRankingResult] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = () => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    // Oblicz wynik
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
      .then((res) => {
        console.log("Backend response:", res.data);
        setRankingResult(res.data);
        setTimeout(() => onFinish(), 5000);
      })
      .catch((err) => {
        console.error("Błąd zapisu wyniku quizu", err);
        if (err.response) {
          console.error("Error details:", err.response.data);
          alert(`Błąd: ${err.response.data.error || "Nie udało się zapisać wyniku"}`);
        } else {
          alert("Błąd zapisu wyniku, ale quiz został sprawdzony.");
        }
        setTimeout(() => onFinish(), 3000);
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  return (
    <div className={styles.quizContainer}>
      <h2>Quiz - Sprawdź zrozumienie</h2>
      
      {quizScore === null ? (
        <>
          {questions.map((q, idx) => (
            <div key={q.id} className={styles.questionBlock}>
              <p className={styles.questionNumber}>Pytanie {idx + 1}/{questions.length}</p>
              <p className={styles.questionText}>{q.text}</p>
              <input
                type="text"
                className="input"
                placeholder="Twoja odpowiedź"
                value={answers[q.id] || ""}
                onChange={(e) =>
                  setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                }
              />
            </div>
          ))}
          <button 
            onClick={handleSubmit} 
            className="button-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Zapisywanie..." : "Sprawdź odpowiedzi"}
          </button>
        </>
      ) : (
        <div className={styles.score}>
          <h3>Wyniki:</h3>
          <div className={styles.scoreDetails}>
            <p className={styles.scoreItem}>
              <span className={styles.scoreLabel}>Poprawność:</span>
              <span className={styles.scoreValue}>{quizScore}%</span>
            </p>
            <p className={styles.scoreItem}>
              <span className={styles.scoreLabel}>Prędkość:</span>
              <span className={styles.scoreValue}>{wpm} słów/min</span>
            </p>
            
            {rankingResult && (
              <>
                {rankingResult.counted_for_ranking ? (
                  <>
                    {quizScore >= 60 ? (
                      <div className={styles.rankingSuccess}>
                        <p className={styles.rankingTitle}>
                          🏆 Wynik zaliczony do rankingu!
                        </p>
                        <p className={styles.rankingPoints}>
                          Zdobyte punkty: <strong>{rankingResult.ranking_points}</strong>
                        </p>
                        {rankingResult.attempt_number > 1 && (
                          <p className={styles.rankingNote}>
                            (Próba #{rankingResult.attempt_number} - poprawiłeś wynik!)
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className={styles.rankingFailed}>
                        <p className={styles.rankingTitle}>
                          ❌ Wynik poniżej progu (60%)
                        </p>
                        <p className={styles.rankingNote}>
                          Nie zdobyłeś punktów rankingowych. Spróbuj ponownie za miesiąc!
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className={styles.rankingTraining}>
                    <p className={styles.rankingTitle}>
                      📊 Trening - wynik nie liczy się do rankingu
                    </p>
                    <p className={styles.rankingNote}>
                      Próba #{rankingResult.attempt_number}. Możesz poprawić wynik rankingowy za miesiąc!
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
          
          <p className={styles.redirectInfo}>
            Powrót do panelu za chwilę...
          </p>
        </div>
      )}
    </div>
  );
}