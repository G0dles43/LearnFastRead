import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

export default function ExerciseCreator() {
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [limit, setLimit] = useState(500);

  const [isPublic, setIsPublic] = useState(false);
  const [isRanked, setIsRanked] = useState(false);
  const [questions, setQuestions] = useState([]);

  const token = localStorage.getItem("access");
  const decoded = token ? jwtDecode(token) : null;

  const isAdmin = decoded?.is_staff || decoded?.is_superuser;

  const navigate = useNavigate();

  const createExercise = async () => {
    if (!title || !text) {
      alert("Podaj tytuł i tekst ćwiczenia!");
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
        if (isRanked) {
          payload.questions = questions;
        }
      }

      await axios.post("http://127.0.0.1:8000/api/exercises/create/", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      alert("Ćwiczenie dodane!");
      navigate("/dashboard");
    } catch (error) {
      alert("Błąd podczas dodawania ćwiczenia");
    }
  };

  const searchExercises = async () => {
    if (!query) {
      alert("Wpisz zainteresowania");
      return;
    }
    try {
      const res = await axios.get(
        `http://127.0.0.1:8000/api/exercises/search/?query=${query}&limit=${limit}`
      );
      setResults(res.data.results);
    } catch (error) {
      alert("Błąd podczas wyszukiwania");
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

  return (
    <div style={{ maxWidth: 600, margin: "auto", padding: 20 }}>
      <button onClick={() => navigate("/dashboard")}>Anuluj</button>
      <h2>Stwórz własne ćwiczenie</h2>
      <input
        type="text"
        placeholder="Tytuł"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        style={{ width: "100%", marginBottom: 10 }}
      />
      <textarea
        placeholder="Tekst ćwiczenia"
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={5}
        style={{ width: "100%", marginBottom: 10 }}
      />
      <button onClick={createExercise}>Dodaj ćwiczenie</button>

      <hr />

      <h2>Znajdź teksty po zainteresowaniach</h2>
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
        placeholder="Np. Marvel, matematyka"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{ width: "100%", marginBottom: 10 }}
      />
      <button onClick={searchExercises}>Szukaj</button>

      <ul style={{ marginTop: 20 }}>
        {results.map((item, i) => (
          <li key={i} style={{ marginBottom: 15 }}>
            <strong>{item.title}</strong>
            <p dangerouslySetInnerHTML={{ __html: item.snippet }} />
            <button
              onClick={() => addExerciseFromResult(item.title, item.snippet)}
            >
              Dodaj jako ćwiczenie
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
