import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import styles from "./ExerciseCreator.module.css";

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

  const getRecommendedQuestions = () => {
    const wordCount = text.trim().split(/\s+/).filter(w => w.length > 0).length;
    
    if (wordCount === 0) return { min: 0, max: 0, recommended: 0 };
    if (wordCount <= 300) return { min: 3, max: 4, recommended: 3 };
    if (wordCount <= 500) return { min: 4, max: 5, recommended: 4 };
    if (wordCount <= 800) return { min: 5, max: 6, recommended: 5 };
    return { min: 6, max: 7, recommended: 6 };
  };

  const getQuestionValidation = () => {
    if (!isRanked) return null;
    
    const { min, max, recommended } = getRecommendedQuestions();
    const currentCount = questions.length;
    
    if (text.trim().length === 0) {
      return {
        type: "info",
        message: "Wpisz tekst ćwiczenia, aby zobaczyć zalecaną liczbę pytań"
      };
    }
    
    if (currentCount === 0) {
      return {
        type: "error",
        message: `Brak pytań! Dodaj przynajmniej ${min} pytania (zalecane: ${recommended})`
      };
    }
    
    if (currentCount < min) {
      return {
        type: "warning",
        message: `Za mało pytań! Masz ${currentCount}, potrzebujesz minimum ${min}`
      };
    }
    
    if (currentCount > max) {
      return {
        type: "warning",
        message: `Za dużo pytań! Masz ${currentCount}, zalecane: ${min}-${max} pytań`
      };
    }
    
    if (currentCount === recommended) {
      return {
        type: "success",
        message: `✅ Idealna liczba pytań! (${currentCount}/${recommended})`
      };
    }
    
    return {
      type: "ok",
      message: `✓ Dobra liczba pytań (${currentCount}). Zalecane: ${recommended}`
    };
  };

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

    if (isRanked) {
      const { min, max } = getRecommendedQuestions();
      
      if (questions.length === 0) {
        alert("Ćwiczenia rankingowe muszą mieć przynajmniej jedno pytanie!");
        return;
      }
      
      if (questions.length < min) {
        const confirm = window.confirm(
          `Masz tylko ${questions.length} pytań, a zalecane minimum to ${min}. Czy na pewno chcesz kontynuować?`
        );
        if (!confirm) return;
      }
      
      if (questions.length > max) {
        const confirm = window.confirm(
          `Masz ${questions.length} pytań, a zalecane maksimum to ${max}. Czy na pewno chcesz kontynuować?`
        );
        if (!confirm) return;
      }
      
      const emptyQuestions = questions.filter(q => !q.text.trim() || !q.correct_answer.trim());
      if (emptyQuestions.length > 0) {
        alert("Wszystkie pytania muszą mieć wypełnioną treść i poprawną odpowiedź!");
        return;
      }
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
    return <div className={styles.loading}>Ładowanie...</div>;
  }

  const wordCount = text.trim().split(/\s+/).filter(w => w.length > 0).length;
  const validation = getQuestionValidation();

  return (
    <div className={styles.container}>
      <button className="button-secondary" onClick={() => navigate("/dashboard")}>
        ← Powrót do panelu
      </button>

      <h2 className={styles.title}>Stwórz własne ćwiczenie</h2>
      
      <div className={styles.formGroup}>
        <input
          type="text"
          className={styles.input}
          placeholder="Tytuł"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>
      
      <div className={styles.formGroup}>
        <textarea
          className={styles.textarea}
          placeholder="Tekst ćwiczenia"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className={styles.wordCount}>
          Liczba słów: <strong>{wordCount}</strong>
        </div>
      </div>

      {isAdmin && (
        <div className={styles.adminSection}>
          <h3 className={styles.adminTitle}>
            🔐 Opcje Administratora
          </h3>
          
          <label className={styles.checkbox}>
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
            />
            Ćwiczenie publiczne (widoczne dla wszystkich)
          </label>

          <label className={styles.checkbox}>
            <input
              type="checkbox"
              checked={isRanked}
              onChange={(e) => setIsRanked(e.target.checked)}
            />
            Ćwiczenie rankingowe (z pytaniami)
          </label>

          {isRanked && (
            <div className={styles.questionsSection}>
              <div className={styles.questionsHeader}>
                <h4 className={styles.questionsTitle}>Pytania do quizu:</h4>
                <button
                  onClick={addQuestion}
                  className={styles.addQuestionBtn}
                >
                  + Dodaj pytanie
                </button>
              </div>

              {validation && (
                <div className={`${styles.validationBanner} ${styles[`validation${validation.type.charAt(0).toUpperCase() + validation.type.slice(1)}`]}`}>
                  {validation.message}
                </div>
              )}

              {questions.length === 0 ? (
                <div className={styles.emptyState}>
                  <p>Brak pytań. Kliknij "+ Dodaj pytanie" aby rozpocząć.</p>
                </div>
              ) : (
                questions.map((q, index) => (
                  <div key={index} className={styles.questionCard}>
                    <div className={styles.questionNumber}>
                      Pytanie #{index + 1}
                    </div>
                    <input
                      type="text"
                      className={`${styles.questionInput} ${!q.text.trim() ? styles.questionInputError : ''}`}
                      placeholder="Treść pytania (np. Kto jest głównym bohaterem?)"
                      value={q.text}
                      onChange={(e) => updateQuestion(index, "text", e.target.value)}
                    />
                    <input
                      type="text"
                      className={`${styles.questionInput} ${!q.correct_answer.trim() ? styles.questionInputError : ''}`}
                      placeholder="Poprawna odpowiedź"
                      value={q.correct_answer}
                      onChange={(e) => updateQuestion(index, "correct_answer", e.target.value)}
                    />
                    {(!q.text.trim() || !q.correct_answer.trim()) && (
                      <div className={styles.questionError}>
                        To pytanie nie jest kompletne
                      </div>
                    )}
                    <button
                      onClick={() => removeQuestion(index)}
                      className={styles.removeQuestionBtn}
                    >
                      Usuń
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      <button onClick={createExercise} className={styles.submitButton}>
        Dodaj ćwiczenie
      </button>

      <hr className={styles.divider} />

      <div className={styles.wikiSection}>
        <h2 className={styles.wikiTitle}>Znajdź teksty z Wikipedii</h2>
        <label className={styles.rangeLabel}>
          Długość tekstu: {limit} słów
          <input
            type="range"
            className={styles.rangeInput}
            min={100}
            max={500}
            step={10}
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
          />
        </label>
        <input
          type="text"
          className={styles.searchInput}
          placeholder="Np. Marvel, matematyka, historia Polski"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button onClick={searchExercises} className={styles.searchButton}>
          Szukaj
        </button>

        <ul className={styles.resultsList}>
          {results.map((item, i) => (
            <li key={i} className={styles.resultItem}>
              <div className={styles.resultTitle}>{item.title}</div>
              <p className={styles.resultSnippet}>
                {item.snippet.substring(0, 200)}...
              </p>
              <button
                onClick={() => addExerciseFromResult(item.title, item.snippet)}
                className={styles.addResultButton}
              >
                Dodaj jako ćwiczenie
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}