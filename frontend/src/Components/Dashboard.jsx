import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

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
    <div style={{ padding: "20px" }}>
      <button
        onClick={() => {
          localStorage.clear();
          navigate("/");
        }}
      >
        Wyloguj
      </button>
      <button onClick={() => navigate("/settings")}>⚙️ Ustawienia</button>
      <button onClick={() => navigate("/create-exercise")}>
        ➕ Stwórz ćwiczenie
      </button>

      <div style={{ marginTop: "10px" }}>
        <label>
          <input
            type="checkbox"
            checked={showFavoritesOnly}
            onChange={(e) => setShowFavoritesOnly(e.target.checked)}
            style={{ marginRight: "8px" }}
          />
          Pokaż tylko ulubione
        </label>
      </div>

      <h2 style={{ marginTop: "20px" }}>Lista ćwiczeń</h2>
      {filteredExercises.map((ex) => (
        <div
          key={ex.id}
          style={{
            border: "1px solid #ccc",
            padding: "10px",
            margin: "10px 0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <strong>
            {ex.title} ({ex.word_count} słów)
          </strong>

          <div>
            <button
              style={{ marginRight: "10px" }}
              onClick={() => navigate(`/training/${ex.id}`)}
            >
              Rozpocznij
            </button>
            <button onClick={() => toggleFavorite(ex.id)}>
              {ex.is_favorite ? "⭐" : "☆"}
            </button>
            <button
              style={{ marginLeft: "10px", color: "red" }}
              onClick={() => deleteExercise(ex.id)}
            >
              Usuń
            </button>
            <div>
              {ex.is_public ? (
                <span style={{ marginLeft: "10px" }}>🌐</span>
              ) : (
                <span style={{ marginLeft: "10px" }}>🔒</span>
              )}
              {ex.is_ranked && (
                <span style={{ marginLeft: "5px", color: "green" }}>🏆</span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
