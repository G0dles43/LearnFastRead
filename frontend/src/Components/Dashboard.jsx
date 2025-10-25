import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import styles from "./Dashboard.module.css";

export default function Dashboard() {
  const [exercises, setExercises] = useState([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const navigate = useNavigate();
  const token = localStorage.getItem("access");

  useEffect(() => {
    async function fetchExercises() {
      try {
        const res = await axios.get("http://127.0.0.1:8000/api/exercises/", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setExercises(res.data);
      } catch (err) {
        console.error("Błąd pobierania ćwiczeń", err);
      }
    }

    fetchExercises();
  }, [token]);

  const toggleFavorite = async (id) => {
    try {
      await axios.post(
        `http://127.0.0.1:8000/api/exercises/${id}/favorite/`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const res = await axios.get("http://127.0.0.1:8000/api/exercises/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setExercises(res.data);
    } catch (err) {
      alert("Błąd podczas aktualizacji ulubionych");
    }
  };

  const deleteExercise = async (id) => {
    if (!window.confirm("Czy na pewno chcesz usunąć to ćwiczenie?")) return;
    try {
      await axios.delete(`http://127.0.0.1:8000/api/exercises/${id}/delete/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setExercises((prev) => prev.filter((ex) => ex.id !== id));
    } catch (err) {
      alert("Błąd podczas usuwania ćwiczenia");
    }
  };

  const filteredExercises = showFavoritesOnly
    ? exercises.filter((ex) => ex.is_favorite)
    : exercises;

  return (
    <div className={styles.dashboardContainer}>
      <header className={styles.header}>
        <h2>Twój Panel</h2>
        <div className={styles.headerActions}>
          <button className="button-secondary" onClick={() => navigate("/ranking")}>
            Ranking
          </button>
          <button className="button-secondary" onClick={() => navigate("/create-exercise")}>
            ➕ Stwórz ćwiczenie
          </button>
          <button className="button-secondary" onClick={() => navigate("/settings")}>
            ⚙️ Ustawienia
          </button>
          <button
            className="button-danger"
            onClick={() => {
              localStorage.clear();
              navigate("/");
            }}
          >
            Wyloguj
          </button>
        </div>
      </header>

      <div className={styles.filterBar}>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={showFavoritesOnly}
            onChange={(e) => setShowFavoritesOnly(e.target.checked)}
          />
          Pokaż tylko ulubione
        </label>
      </div>

      <div className={styles.exerciseList}>
        {filteredExercises.length > 0 ? (
          filteredExercises.map((ex) => (
            <div key={ex.id} className={styles.exerciseCard}>
              <div className={styles.exerciseInfo}>
                <strong>{ex.title}</strong>
                <span>({ex.word_count} słów)</span>
                <div className={styles.exerciseTags}>
                  {ex.is_public ? (
                    <span className={styles.tag}>🌐 Publiczne</span>
                  ) : (
                    <span className={styles.tag}>🔒 Prywatne</span>
                  )}
                  {ex.is_ranked && (
                    <span className={`${styles.tag} ${styles.ranked}`}>🏆 Rankingowe</span>
                  )}
                </div>
              </div>
      
              <div className={styles.exerciseActions}>
                <button
                  className="button-primary"
                  onClick={() => navigate(`/training/${ex.id}`)}
                >
                  Start
                </button>
                <button
                  className={`button-icon ${ex.is_favorite ? styles.favoriteActive : ''}`}
                  onClick={() => toggleFavorite(ex.id)}
                  title={ex.is_favorite ? "Usuń z ulubionych" : "Dodaj do ulubionych"}
                >
                  {ex.is_favorite ? "⭐" : "☆"}
                </button>
                <button
                  className="button-icon button-danger" // Dodajemy button-danger dla koloru
                  onClick={() => deleteExercise(ex.id)}
                  title="Usuń ćwiczenie"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))
        ) : (
          <p>Nie znaleziono ćwiczeń. Może czas jakieś dodać?</p>
        )}
      </div>
    </div>
  );
}