import React, { useState } from "react";
import axios from "axios";

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
    <div style={{
      maxWidth: '800px',
      margin: '0 auto',
      padding: '2rem'
    }}>
      <div className="card card-elevated">
        <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '1.5rem', textAlign: 'center' }}>
          Quiz - Sprawdź zrozumienie
        </h2>
        
        {quizScore === null ? (
          <>
            {questions.map((q, idx) => (
              <div
                key={q.id}
                className="card"
                style={{
                  background: 'var(--bg-surface)',
                  border: '2px solid var(--border)',
                  padding: '2rem',
                  marginBottom: '1.5rem',
                  transition: 'var(--transition)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--primary)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <p style={{
                  color: 'var(--text-secondary)',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '0.75rem'
                }}>
                  Pytanie {idx + 1}/{questions.length}
                </p>
                <p style={{
                  fontSize: '1.25rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginBottom: '1rem'
                }}>
                  {q.text}
                </p>
                <input
                  type="text"
                  className="input"
                  placeholder="Twoja odpowiedź..."
                  value={answers[q.id] || ""}
                  onChange={(e) =>
                    setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                  }
                />
              </div>
            ))}
            <button 
              onClick={handleSubmit} 
              className="btn btn-primary btn-lg"
              disabled={isSubmitting}
              style={{ width: '100%' }}
            >
              {isSubmitting ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', justifyContent: 'center' }}>
                  <div className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }}></div>
                  <span>Zapisywanie...</span>
                </div>
              ) : (
                'Sprawdź odpowiedzi'
              )}
            </button>
          </>
        ) : (
          <div style={{
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(139, 92, 246, 0.05))',
            border: '2px solid var(--primary)',
            borderRadius: 'var(--radius-xl)',
            padding: '3rem',
            textAlign: 'center'
          }}>
            <h3 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '2rem' }}>
              Wyniki:
            </h3>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem',
              margin: '2rem 0'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1rem',
                background: 'var(--bg-surface)',
                borderRadius: 'var(--radius-md)'
              }}>
                <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Poprawność:
                </span>
                <span style={{
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  color: 'var(--primary)'
                }}>
                  {quizScore}%
                </span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1rem',
                background: 'var(--bg-surface)',
                borderRadius: 'var(--radius-md)'
              }}>
                <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Prędkość:
                </span>
                <span style={{
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  color: 'var(--primary)'
                }}>
                  {wpm} słów/min
                </span>
              </div>
              
              {rankingResult && (
                <>
                  {rankingResult.counted_for_ranking ? (
                    <>
                      {quizScore >= 60 ? (
                        <div style={{
                          padding: '1.5rem',
                          borderRadius: 'var(--radius-lg)',
                          background: 'rgba(16, 185, 129, 0.1)',
                          border: '2px solid var(--success)',
                          marginTop: '1.5rem'
                        }}>
                          <p style={{
                            fontSize: '1.25rem',
                            fontWeight: 700,
                            marginBottom: '0.5rem'
                          }}>
                            🏆 Wynik zaliczony do rankingu!
                          </p>
                          <p style={{
                            fontSize: '1.5rem',
                            fontWeight: 700,
                            color: 'var(--success)'
                          }}>
                            Zdobyte punkty: <strong>{rankingResult.ranking_points}</strong>
                          </p>
                          {rankingResult.attempt_number > 1 && (
                            <p style={{
                              color: 'var(--text-secondary)',
                              fontSize: '0.95rem',
                              marginTop: '0.5rem'
                            }}>
                              (Próba #{rankingResult.attempt_number} - poprawiłeś wynik!)
                            </p>
                          )}
                        </div>
                      ) : (
                        <div style={{
                          padding: '1.5rem',
                          borderRadius: 'var(--radius-lg)',
                          background: 'rgba(239, 68, 68, 0.1)',
                          border: '2px solid var(--danger)',
                          marginTop: '1.5rem'
                        }}>
                          <p style={{
                            fontSize: '1.25rem',
                            fontWeight: 700,
                            marginBottom: '0.5rem'
                          }}>
                            ❌ Wynik poniżej progu (60%)
                          </p>
                          <p style={{
                            color: 'var(--text-secondary)',
                            fontSize: '0.95rem',
                            marginTop: '0.5rem'
                          }}>
                            Nie zdobyłeś punktów rankingowych. Spróbuj ponownie za miesiąc!
                          </p>
                        </div>
                      )}
                    </>
                  ) : (
                    <div style={{
                      padding: '1.5rem',
                      borderRadius: 'var(--radius-lg)',
                      background: 'rgba(99, 102, 241, 0.1)',
                      border: '2px solid var(--primary)',
                      marginTop: '1.5rem'
                    }}>
                      <p style={{
                        fontSize: '1.25rem',
                        fontWeight: 700,
                        marginBottom: '0.5rem'
                      }}>
                        📊 Trening - wynik nie liczy się do rankingu
                      </p>
                      <p style={{
                        color: 'var(--text-secondary)',
                        fontSize: '0.95rem',
                        marginTop: '0.5rem'
                      }}>
                        Próba #{rankingResult.attempt_number}. Możesz poprawić wynik rankingowy za miesiąc!
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
            
            <p style={{
              marginTop: '2rem',
              color: 'var(--text-secondary)',
              fontStyle: 'italic'
            }}>
              Powrót do panelu za chwilę...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}