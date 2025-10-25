import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function ExerciseCreator() {
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [limit, setLimit] = useState(500);

  const [isPublic, setIsPublic] = useState(false);
  const [isRanked, setIsRanked] = useState(false);
  const [questions, setQuestions] = useState([]);
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("access");
  const navigate = useNavigate();

  // Pobierz status użytkownika z backendu
  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    axios
      .get("http://127.0.0.1:8000/api/user/status/", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setIsAdmin(res.data.is_admin);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Błąd pobierania statusu użytkownika", err);
        setLoading(false);
      });
  }, [token, navigate]);

  const addQuestion = () => {
    setQuestions([
      ...questions,
      { text: "", correct_answer: "", question_type: "open" },
    ]);
  };

  const updateQuestion = (index, field, value) => {
    const updated = [...questions];
    updated[index][field] = value;
    setQuestions(updated);
  };

  const removeQuestion = (index) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const createExercise = async () => {
    if (!title || !text) {
      alert("Podaj tytuł i tekst ćwiczenia!");
      return;
    }

    // Walidacja pytań dla ćwiczeń rankingowych
    if (isRanked && questions.length === 0) {
      alert("Ćwiczenia rankingowe muszą mieć przynajmniej jedno pytanie!");
      return;
    }

    try {
      const cleanedText = text
        .replace(/<[^>]+>|\([^)]*\)|[\[\]{};:,<>/\\|_\-+=]/g, "")
        .replace(/\s+/g, " ")
        .trim();

      const payload = {
        title,
        text: cleanedText,
      };

      if (isAdmin) {
        payload.is_public = isPublic;
        payload.is_ranked = isRanked;
        if (isRanked && questions.length > 0) {
          payload.questions = questions;
        }
      }

      await axios.post("http://127.0.0.1:8000/api/exercises/create/", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      alert("Ćwiczenie dodane!");
      navigate("/dashboard");
    } catch (error) {
      console.error(error);
      alert("Błąd podczas dodawania ćwiczenia");
    }
  };

  const searchExercises = async () => {
    if (!query.trim()) {
      alert("Wpisz zainteresowania");
      return;
    }

    try {
      setResults([]);

      const res = await axios.get(
        `http://127.0.0.1:8000/api/exercises/search/`,
        {
          params: { query, limit },
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.data.results && res.data.results.length > 0) {
        setResults(res.data.results);
      } else {
        alert("Nie znaleziono wyników dla tego zapytania");
      }
    } catch (error) {
      console.error("Błąd:", error);
      if (error.response) {
        alert(`Błąd: ${error.response.data.error || "Błąd podczas wyszukiwania"}`);
      } else if (error.request) {
        alert("Brak połączenia z serwerem. Sprawdź czy backend działa.");
      } else {
        alert("Błąd podczas wyszukiwania");
      }
    }
  };

  const addExerciseFromResult = async (title, snippet) => {
    try {
      await axios.post(
        "http://127.0.0.1:8000/api/exercises/create/",
        { title, text: snippet },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Ćwiczenie dodane!");
      navigate("/dashboard");
    } catch (error) {
      alert("Błąd podczas dodawania ćwiczenia");
    }
  };

  if (loading) {
    return <div style={{ textAlign: "center", padding: 20 }}>Ładowanie...</div>;
  }

  return (
    <div style={{ maxWidth: 800, margin: "auto", padding: 20 }}>
      <button onClick={() => navigate("/dashboard")}>← Powrót do panelu</button>

      <h2>Stwórz własne ćwiczenie</h2>
      
      <input
        type="text"
        placeholder="Tytuł"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        style={{ width: "100%", marginBottom: 10, padding: 8 }}
      />
      
      <textarea
        placeholder="Tekst ćwiczenia"
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={8}
        style={{ width: "100%", marginBottom: 10, padding: 8 }}
      />

      {/* OPCJE ADMINA */}
      {isAdmin && (
        <div style={{ 
          background: "#f0f8ff", 
          padding: 15, 
          borderRadius: 8, 
          marginBottom: 15,
          border: "2px solid #4a90e2"
        }}>
          <h3 style={{ margin: "0 0 10px 0", color: "#2c5aa0" }}>
            🔐 Opcje Administratora
          </h3>
          
          <label style={{ display: "block", marginBottom: 10 }}>
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
            />
            {" "}Ćwiczenie publiczne (widoczne dla wszystkich)
          </label>

          <label style={{ display: "block", marginBottom: 10 }}>
            <input
              type="checkbox"
              checked={isRanked}
              onChange={(e) => setIsRanked(e.target.checked)}
            />
            {" "}Ćwiczenie rankingowe (z pytaniami)
          </label>

          {/* PYTANIA DLA ĆWICZEŃ RANKINGOWYCH */}
          {isRanked && (
            <div style={{ marginTop: 15 }}>
              <h4>Pytania do quizu:</h4>
              {questions.map((q, index) => (
                <div
                  key={index}
                  style={{
                    background: "white",
                    padding: 10,
                    marginBottom: 10,
                    borderRadius: 5,
                    border: "1px solid #ddd",
                  }}
                >
                  <input
                    type="text"
                    placeholder="Treść pytania"
                    value={q.text}
                    onChange={(e) => updateQuestion(index, "text", e.target.value)}
                    style={{ width: "100%", marginBottom: 5, padding: 5 }}
                  />
                  <input
                    type="text"
                    placeholder="Poprawna odpowiedź"
                    value={q.correct_answer}
                    onChange={(e) =>
                      updateQuestion(index, "correct_answer", e.target.value)
                    }
                    style={{ width: "100%", marginBottom: 5, padding: 5 }}
                  />
                  <button
                    onClick={() => removeQuestion(index)}
                    style={{
                      background: "#e74c3c",
                      color: "white",
                      border: "none",
                      padding: "5px 10px",
                      cursor: "pointer",
                      borderRadius: 3,
                    }}
                  >
                    Usuń pytanie
                  </button>
                </div>
              ))}
              <button
                onClick={addQuestion}
                style={{
                  background: "#27ae60",
                  color: "white",
                  border: "none",
                  padding: "8px 15px",
                  cursor: "pointer",
                  borderRadius: 5,
                }}
              >
                + Dodaj pytanie
              </button>
            </div>
          )}
        </div>
      )}

      <button
        onClick={createExercise}
        style={{
          background: "#4a90e2",
          color: "white",
          padding: "10px 20px",
          border: "none",
          borderRadius: 5,
          cursor: "pointer",
          fontSize: 16,
        }}
      >
        Dodaj ćwiczenie
      </button>

      <hr style={{ margin: "30px 0" }} />

      {/* WYSZUKIWANIE WIKIPEDII */}
      <h2>Znajdź teksty z Wikipedii</h2>
      <label>
        Długość tekstu: {limit} słów
        <input
          type="range"
          min={100}
          max={500}
          step={10}
          value={limit}
          onChange={(e) => setLimit(Number(e.target.value))}
          style={{ width: "100%", marginBottom: 10 }}
        />
      </label>
      <input
        type="text"
        placeholder="Np. Marvel, matematyka, historia Polski"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{ width: "100%", marginBottom: 10, padding: 8 }}
      />
      <button
        onClick={searchExercises}
        style={{
          background: "#27ae60",
          color: "white",
          padding: "10px 20px",
          border: "none",
          borderRadius: 5,
          cursor: "pointer",
        }}
      >
        Szukaj
      </button>

      <ul style={{ marginTop: 20, listStyle: "none", padding: 0 }}>
        {results.map((item, i) => (
          <li
            key={i}
            style={{
              marginBottom: 20,
              padding: 15,
              border: "1px solid #ddd",
              borderRadius: 8,
              background: "#fafafa",
            }}
          >
            <strong style={{ fontSize: 18 }}>{item.title}</strong>
            <p style={{ marginTop: 10, color: "#555" }}>
              {item.snippet.substring(0, 200)}...
            </p>
            <button
              onClick={() => addExerciseFromResult(item.title, item.snippet)}
              style={{
                background: "#3498db",
                color: "white",
                padding: "8px 15px",
                border: "none",
                borderRadius: 5,
                cursor: "pointer",
              }}
            >
              Dodaj jako ćwiczenie
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}