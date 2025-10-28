import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import styles from "./DailyChallenge.module.css";

export default function DailyChallenge() {
  const [challenge, setChallenge] = useState(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const navigate = useNavigate();
  const token = localStorage.getItem("access");

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    axios
      .get("http://127.0.0.1:8000/api/challenge/today/", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setChallenge(res.data.challenge);
        setIsCompleted(res.data.is_completed);
        setLoading(false);
      })
      .catch((err) => {
        setError("Nie udało się załadować wyzwania na dziś.");
        console.error(err);
        setLoading(false);
      });
  }, [token]);

  if (loading) {
    return <div className={styles.loading}>Ładowanie wyzwania...</div>;
  }
  
  // Jeśli nie ma wyzwania (np. błąd 404), nie renderuj nic
  if (!challenge) {
    return null; 
  }

  return (
    <div className={`${styles.challengeCard} ${isCompleted ? styles.completed : ''}`}>
      <div className={styles.header}>
        <span className={styles.icon}>🔥</span>
        <h4>Wyzwanie Dnia</h4>
        {isCompleted && (
          <span className={styles.completedBadge}>✅ Ukończono</span>
        )}
      </div>
      <h2 className={styles.title}>{challenge.title}</h2>
      <p className={styles.details}>
        {challenge.word_count} słów • 
        {challenge.is_ranked ? " 🏆 Rankingowy" : ""}
      </p>
      
      {!isCompleted && (
        <button 
          className="button-primary"
          onClick={() => navigate(`/training/${challenge.id}`)}
        >
          Podejmij wyzwanie (+50 pkt)
        </button>
      )}
    </div>
  );
}