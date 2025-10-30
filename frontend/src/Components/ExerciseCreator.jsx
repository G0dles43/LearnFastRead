import React, { useState, useEffect } from "react";
// Usunięto import axios
import { useNavigate } from "react-router-dom";
import styles from "./ExerciseCreator.module.css";

// Odbieramy 'api' jako prop
export default function ExerciseCreator({ api }) {
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [query, setQuery] = useState(""); // Zapytanie do Wikipedii
  const [results, setResults] = useState([]); // Wyniki z Wikipedii
  const [limit, setLimit] = useState(300); // Stan dla limitu słów
  const [isPublic, setIsPublic] = useState(false);
  const [isRanked, setIsRanked] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true); // Ładowanie statusu admina
  const [searchLoading, setSearchLoading] = useState(false); // Ładowanie wyników Wikipedii
  const [numResults, setNumResults] = useState(5); // Liczba wyników z Wikipedii

  const token = localStorage.getItem("access");
  const navigate = useNavigate();

  // Sprawdzanie statusu admina
  useEffect(() => {
    if (!token) { navigate("/login"); return; }
    if (!api) { console.error("ExerciseCreator: Brak instancji API."); setLoading(false); return; }

    setLoading(true);
    api.get("user/status/")
      .then((res) => { setIsAdmin(res.data.is_admin); })
      .catch((err) => { console.error("Błąd pobierania statusu użytkownika", err); })
      .finally(() => { setLoading(false); });
  }, [token, navigate, api]);

  // Funkcje pomocnicze (getRecommendedQuestions, getQuestionValidation) - bez zmian
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
       if (text.trim().length === 0) return { type: "info", message: "Wpisz tekst ćwiczenia..." };
       if (currentCount === 0) return { type: "error", message: `Brak pytań! Min. ${min} (zalecane: ${recommended})` };
       if (currentCount < min) return { type: "warning", message: `Za mało pytań! Masz ${currentCount}, min. ${min}` };
       if (currentCount > max) return { type: "warning", message: `Za dużo pytań! Masz ${currentCount}, max. ${max}` };
       if (currentCount === recommended) return { type: "success", message: `✅ Idealna liczba pytań! (${currentCount}/${recommended})` };
       return { type: "ok", message: `✓ Dobra liczba pytań (${currentCount}). Zalecane: ${recommended}` };
   };

  // Handler zmiany checkboxa 'isRanked'
  const handleRankedChange = (e) => {
    const newRankedValue = e.target.checked;
    setIsRanked(newRankedValue);
    if (newRankedValue) setIsPublic(true);
  };

  // Funkcje zarządzania pytaniami (add/update/remove) - bez zmian
  const addQuestion = () => setQuestions([...questions, { text: "", correct_answer: "", question_type: "open" }]);
  const updateQuestion = (index, field, value) => { const u = [...questions]; u[index][field] = value; setQuestions(u); };
  const removeQuestion = (index) => setQuestions(questions.filter((_, i) => i !== index));

  // Tworzenie ćwiczenia
  const createExercise = async () => {
    if (!api) return alert("Błąd: Brak instancji API.");
    if (!title || !text) { alert("Podaj tytuł i tekst ćwiczenia!"); return; }
    if (isRanked) {
        const { min, max } = getRecommendedQuestions();
        if (questions.length === 0) { alert("Ćwiczenia rankingowe muszą mieć pytania!"); return; }
        if (questions.length < min && !window.confirm(`Masz tylko ${questions.length} pytań (min. ${min}). Kontynuować?`)) return;
        if (questions.length > max && !window.confirm(`Masz ${questions.length} pytań (max. ${max}). Kontynuować?`)) return;
        if (questions.some(q => !q.text.trim() || !q.correct_answer.trim())) { alert("Wypełnij treść i odpowiedź dla wszystkich pytań!"); return; }
    }

    try {
      const cleanedText = text.replace(/<[^>]+>|\([^)]*\)|[\[\]{};:,<>/\\|_\-+=]/g, "").replace(/\s+/g, " ").trim();
      const payload = { title, text: cleanedText };
      if (isAdmin) {
        payload.is_public = isPublic;
        payload.is_ranked = isRanked;
        if (isRanked && questions.length > 0) {
           payload.questions = questions.map(q => ({ text: q.text, correct_answer: q.correct_answer }));
        }
      }
      await api.post("exercises/create/", payload);
      alert("Ćwiczenie dodane!");
      navigate("/dashboard");
    } catch (error) { /* ... (obsługa błędów jak wcześniej) ... */ }
  };

  // Wyszukiwanie w Wikipedii
  const searchExercises = async () => {
    if (!api) return alert("Błąd: Brak instancji API.");
    if (!query.trim()) { alert("Wpisz hasło do wyszukania."); return; }

    setSearchLoading(true);
    setResults([]);

    try {
      const res = await api.get("exercises/search/", {
        params: { query, num_results: numResults, limit: limit } // Przekazuj limit
      });
      if (res.data.results && res.data.results.length > 0) setResults(res.data.results);
      else alert(res.data.message || "Wikipedia nie zwróciła wyników.");
    } catch (error) { /* ... (obsługa błędów jak wcześniej) ... */ }
    finally { setSearchLoading(false); }
  };

  // Dodawanie ćwiczenia z wyniku Wikipedii (używa 'snippet')
  const addExerciseFromResult = async (resultTitle, snippet) => {
    if (!api) return alert("Błąd: Brak instancji API.");
    try {
      await api.post("exercises/create/", { title: resultTitle, text: snippet }); // Przekaż snippet
      alert(`Ćwiczenie "${resultTitle}" dodane pomyślnie!`);
      navigate("/dashboard");
    } catch (error) { /* ... (obsługa błędów jak wcześniej) ... */ }
  };

  if (loading) return <div className={styles.loading}>Ładowanie kreatora...</div>;

  const wordCount = text.trim().split(/\s+/).filter(w => w.length > 0).length;
  const validation = getQuestionValidation();

  // --- RENDEROWANIE KOMPONENTU ---
  return (
    <div className={styles.container}>
      <button className="button-secondary" onClick={() => navigate("/dashboard")}>← Powrót do panelu</button>
      <h2 className={styles.title}>Stwórz własne ćwiczenie</h2>

      <div className={styles.formGroup}>
        <input type="text" className={styles.input} placeholder="Tytuł ćwiczenia" value={title} onChange={(e) => setTitle(e.target.value)}/>
      </div>

      <div className={styles.formGroup}>
        <textarea className={styles.textarea} placeholder="Wklej lub wpisz tutaj tekst ćwiczenia..." value={text} onChange={(e) => setText(e.target.value)}/>
        <div className={styles.wordCount}>Liczba słów: <strong>{wordCount}</strong></div>
      </div>

      {isAdmin && (
        <div className={styles.adminSection}>
          <h3 className={styles.adminTitle}>🔐 Opcje Administratora</h3>
          <label className={styles.checkbox}>
            <input type="checkbox" checked={isRanked} onChange={handleRankedChange}/> Ćwiczenie rankingowe (wymaga pytań)
          </label>
          <label className={styles.checkbox}>
            <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} disabled={isRanked}/> Ćwiczenie publiczne (widoczne dla wszystkich)
            {isRanked && <span className={styles.hint}>(Rankingowe musi być publiczne)</span>}
          </label>
          {isRanked && (
            <div className={styles.questionsSection}>
                <div className={styles.questionsHeader}>
                    <h4 className={styles.questionsTitle}>Pytania (Wymagane do rankingu)</h4>
                    <button onClick={addQuestion} className={styles.addQuestionBtn}>+ Dodaj pytanie</button>
                </div>

                {validation && (
                    <div className={`${styles.validationBanner} ${styles[validation.type === 'error' ? 'validationError' :
                                                                        validation.type === 'warning' ? 'validationWarning' :
                                                                        validation.type === 'success' ? 'validationSuccess' :
                                                                        validation.type === 'ok' ? 'validationOk' : 'validationInfo']}`}>
                        {validation.message}
                    </div>
                )}

                {questions.length === 0 && !validation && (
                    <div className={styles.emptyState}>
                        <p>Brak pytań. Kliknij "+ Dodaj pytanie", aby rozpocząć.</p>
                    </div>
                )}

                {questions.map((q, index) => (
                    <div key={index} className={styles.questionCard}>
                        <div className={styles.questionNumber}>PYTANIE {index + 1}</div>
                        <input
                            type="text"
                            placeholder="Treść pytania"
                            value={q.text}
                            onChange={(e) => updateQuestion(index, 'text', e.target.value)}
                            className={styles.questionInput}
                        />
                        <input
                            type="text"
                            placeholder="Poprawna odpowiedź"
                            value={q.correct_answer}
                            onChange={(e) => updateQuestion(index, 'correct_answer', e.target.value)}
                            className={styles.questionInput}
                        />
                        <button onClick={() => removeQuestion(index)} className={styles.removeQuestionBtn}>Usuń</button>
                    </div>
                ))}
            </div>
        )}
        </div>
      )}

      <button onClick={createExercise} className={styles.submitButton}>Dodaj ćwiczenie</button>
      <hr className={styles.divider} />

      <div className={styles.wikiSection}>
        <h2 className={styles.wikiTitle}>Znajdź teksty z Wikipedii</h2>

        <label className={styles.rangeLabel}>
          Maksymalna długość tekstu: {limit} słów
          <input type="range" className={styles.rangeInput} min={100} max={1000} step={50} value={limit} onChange={(e) => setLimit(Number(e.target.value))} disabled={searchLoading}/>
        </label>

        <input type="text" className={styles.searchInput} placeholder="Wpisz hasło (np. Szybkie czytanie, Polska)" value={query} onChange={(e) => setQuery(e.target.value)} disabled={searchLoading}/>

        <div className={styles.formGroupInline}>
            <label htmlFor="numResultsInput" className={styles.inlineLabel}>Liczba wyników:</label>
            <input id="numResultsInput" type="number" className={styles.inputNumberSmall} min={1} max={20} value={numResults} onChange={(e) => setNumResults(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))} disabled={searchLoading}/>
        </div>

        <button onClick={searchExercises} className={styles.searchButton} disabled={searchLoading}>
          {searchLoading ? 'Szukam...' : 'Szukaj w Wikipedii'}
        </button>

        {searchLoading && <p>Ładowanie wyników z Wikipedii...</p>}
        {!searchLoading && results.length > 0 && (
            <ul className={styles.resultsList}>
            {results.map((item, i) => (
                <li key={i} className={styles.resultItem}>
                <div className={styles.resultTitle}>{item.title}</div>
                <p className={styles.resultSnippet}>
                    {item.snippet.substring(0, 250)}{item.snippet.length > 250 ? '...' : ''}
                </p>
                <button
                    onClick={() => addExerciseFromResult(item.title, item.snippet)}
                    className={styles.addResultButton}
                >
                    Dodaj jako ćwiczenie ({item.snippet.split(/\s+/).filter(Boolean).length} słów)
                </button>
                </li>
            ))}
            </ul>
        )}
      </div>
    </div>
  );
}