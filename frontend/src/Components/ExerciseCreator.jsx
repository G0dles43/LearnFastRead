import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AiGeneratorButton from "./AiGeneratorButton.jsx";

export default function ExerciseCreator({ api }) {
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [limit, setLimit] = useState(300);
  const [isPublic, setIsPublic] = useState(false);
  const [isRanked, setIsRanked] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [numResults, setNumResults] = useState(5);

  // --- NOWE STANY DO WALIDACJI I OBSŁUGI AI ---
  const [isFormValid, setIsFormValid] = useState(false); // GŁÓWNY STAN WALIDACJI
  const [aiError, setAiError] = useState(null); // Do pokazywania błędów z AI

  const token = localStorage.getItem("access");
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) { navigate("/login"); return; }
    if (!api) { console.error("ExerciseCreator: Brak instancji API."); setLoading(false); return; }

    setLoading(true);
    api.get("user/status/")
      .then((res) => { setIsAdmin(res.data.is_admin); })
      .catch((err) => { console.error("Błąd pobierania statusu użytkownika", err); })
      .finally(() => { setLoading(false); });
  }, [token, navigate, api]);

  
  // --- ⭐ GŁÓWNA LOGIKA WALIDACJI (O TO PROSIŁEŚ) ⭐ ---
  // Ten hook uruchamia się przy każdej zmianie w formularzu
  useEffect(() => {
    const minBank = 15; // Minimalna liczba pytań dla ćwiczenia rankingowego

    // 1. Podstawowa walidacja (tytuł i tekst muszą istnieć)
    const isBaseValid = title.trim() !== "" && text.trim() !== "";
    if (!isBaseValid) {
      setIsFormValid(false);
      return; // Nie idziemy dalej, jeśli brakuje podstaw
    }

    // 2. Walidacja dla ćwiczeń RANKINGOWYCH
    if (isRanked) {
      // 2a. Sprawdź, czy jest minimalna liczba pytań
      const hasMinQuestions = questions.length >= minBank;
      
      // 2b. Sprawdź, czy KAŻDE pytanie jest poprawnie wypełnione
      const allQuestionsFilled = questions.every(
        (q) => q.text.trim() !== "" && q.correct_answer.trim() !== ""
      );

      // Przycisk jest aktywny tylko, gdy oba warunki są spełnione
      setIsFormValid(hasMinQuestions && allQuestionsFilled);
    
    } else {
      // 3. Walidacja dla ćwiczeń NIERANKINGOWYCH
      // Wystarczy tytuł i tekst (sprawdzone w kroku 1)
      setIsFormValid(true);
    }

  }, [title, text, questions, isRanked]); // Zależności, które odpala ją walidację
  // --- KONIEC LOGIKI WALIDACJI ---


  // Ta funkcja służy już tylko do wyświetlania komunikatu dla admina
  const getQuestionBankValidationMessage = () => {
    if (!isRanked) return null;
    
    const minBank = 15;
    const recommendedBank = 20;
    const currentCount = questions.length;
    
    if (text.trim().length === 0) return { type: "info", message: "Wpisz tekst ćwiczenia..." };
    if (currentCount === 0) return { type: "error", message: `Brak pytań! Minimum do banku: ${minBank}` };
    if (currentCount < minBank) return { type: "warning", message: `Za mało pytań do banku! Masz ${currentCount}, minimum ${minBank}` };
    if (currentCount >= recommendedBank) return { type: "success", message: `Wystarczająca liczba pytań w banku! (${currentCount})` };
    
    return { type: "ok", message: `Liczba pytań w banku: ${currentCount}` };
  };

  const handleRankedChange = (e) => {
    const newRankedValue = e.target.checked;
    setIsRanked(newRankedValue);
    if (newRankedValue) setIsPublic(true);
  };

  const addQuestion = () => setQuestions([...questions, { text: "", correct_answer: "", question_type: "open" }]);
  const updateQuestion = (index, field, value) => { const u = [...questions]; u[index][field] = value; setQuestions(u); };
  const removeQuestion = (index) => setQuestions(questions.filter((_, i) => i !== index));

  // --- Funkcje do obsługi komponentu AI ---
  const handleAiQuestionsGenerated = (newQuestions) => {
    // Dodajemy nowe pytania do już istniejących
    setQuestions(prevQuestions => [...prevQuestions, ...newQuestions]);
    setAiError(null); // Czyścimy błędy, bo się udało
  };

  const handleAiError = (errorMsg) => {
    setAiError(errorMsg); // Ustawiamy błąd, aby go wyświetlić
  };
  // --- Koniec obsługi AI ---

  const createExercise = async () => {
    if (!api) return alert("Błąd: Brak instancji API.");
    
    // ⭐️ GŁÓWNA WALIDACJA - teraz wystarczy sprawdzić nasz stan
    if (!isFormValid) { 
      alert("Formularz jest niekompletny lub zawiera błędy. Upewnij się, że wszystkie wymagane pola są wypełnione."); 
      return; 
    }

    // Usunęliśmy stare alerty i `window.confirm`, bo przycisk jest `disabled`
    // Logika tworzenia ćwiczenia pozostaje bez zmian
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
    } catch (error) {
      console.error("Błąd tworzenia ćwiczenia:", error);
      alert("Błąd podczas tworzenia ćwiczenia");
    }
  };

  const searchExercises = async () => {
    if (!api) return alert("Błąd: Brak instancji API.");
    if (!query.trim()) { alert("Wpisz hasło do wyszukania."); return; }

    setSearchLoading(true);
    setResults([]);

    try {
      const res = await api.get("exercises/search/", {
        params: { query, num_results: numResults, limit: limit }
      });
      if (res.data.results && res.data.results.length > 0) setResults(res.data.results);
      else alert(res.data.message || "Wikipedia nie zwróciła wyników.");
    } catch (error) {
      console.error("Błąd wyszukiwania:", error);
      alert("Błąd podczas wyszukiwania w Wikipedii");
    } finally {
      setSearchLoading(false);
    }
  };

  const addExerciseFromResult = async (resultTitle, snippet) => {
    if (!api) return alert("Błąd: Brak instancji API.");
    try {
      // Domyślnie dodaje jako prywatne, nieranigowe
      await api.post("exercises/create/", { title: resultTitle, text: snippet });
      alert(`Ćwiczenie "${resultTitle}" dodane pomyślnie!`);
      navigate("/dashboard");
    } catch (error) {
      console.error("Błąd dodawania ćwiczenia z Wikipedii:", error);
      alert("Błąd podczas dodawania ćwiczenia");
    }
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="spinner"></div>
    </div>
  );

  const wordCount = text.trim().split(/\s+/).filter(w => w.length > 0).length;
  // Używamy nowej funkcji walidacyjnej (tylko do wyświetlania wiadomości)
  const validation = getQuestionBankValidationMessage();

  return (
    <div className="page-wrapper" style={{ 
      background: 'linear-gradient(135deg, rgba(15, 15, 30, 0.95) 0%, rgba(26, 26, 46, 0.95) 100%), url("/3.png")', 
      backgroundSize: 'cover', 
      backgroundPosition: 'center', 
      backgroundAttachment: 'fixed' 
    }}>
      <div className="container" style={{ maxWidth: '1200px' }}>
        {/* Header (bez zmian) */}
        <header className="flex items-center justify-between mb-8 animate-fade-in">
          <div>
            <h1 className="text-gradient mb-2">Kreator Ćwiczeń</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
              Stwórz własne teksty lub importuj z Wikipedii
            </p>
          </div>
          <button className="btn btn-secondary" onClick={() => navigate("/dashboard")}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Powrót
          </button>
        </header>

        {/* Main Form */}
        <div className="card card-elevated animate-fade-in" style={{ animationDelay: '0.1s', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>
            </svg>
            Własny tekst
          </h2>

          <div className="form-group">
            <label className="form-label">Tytuł ćwiczenia</label>
            <input 
              type="text" 
              className="input" 
              placeholder="Wpisz tytuł..." 
              value={title} 
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Tekst ćwiczenia</label>
            <textarea 
              className="textarea" 
              placeholder="Wklej lub wpisz tekst..." 
              value={text} 
              onChange={(e) => setText(e.target.value)}
              style={{ minHeight: '200px' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem' }}>
              <span className="badge badge-primary" style={{ fontSize: '0.9rem' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '0.5rem' }}>
                  <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/>
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
                </svg>
                {wordCount} słów
              </span>
            </div>
          </div>

          {/* Admin Options (bez zmian) */}
          {isAdmin && (
            <div className="card" style={{ background: 'var(--bg-elevated)', padding: '1.5rem', marginTop: '1.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0110 0v4"/>
                </svg>
                Opcje Administratora
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', padding: '0.75rem', borderRadius: 'var(--radius-md)', background: isRanked ? 'rgba(245, 158, 11, 0.1)' : 'transparent', transition: 'var(--transition)' }}>
                  <input 
                    type="checkbox" 
                    checked={isRanked} 
                    onChange={handleRankedChange}
                    style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                  />
                  <div>
                    <div style={{ fontWeight: 600 }}>Ćwiczenie rankingowe</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Wymaga banku pytań sprawdzających</div>
                  </div>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', padding: '0.75rem', borderRadius: 'var(--radius-md)', background: isPublic ? 'rgba(99, 102, 241, 0.1)' : 'transparent', transition: 'var(--transition)' }}>
                  <input 
                    type="checkbox" 
                    checked={isPublic} 
                    onChange={(e) => setIsPublic(e.target.checked)} 
                    disabled={isRanked}
                    style={{ width: '20px', height: '20px', cursor: isRanked ? 'not-allowed' : 'pointer' }}
                  />
                  <div>
                    <div style={{ fontWeight: 600 }}>Ćwiczenie publiczne</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {isRanked ? 'Rankingowe musi być publiczne' : 'Widoczne dla wszystkich'}
                    </div>
                  </div>
                </label>
              </div>

              {/* Questions Section */}
              {isRanked && (
                <div style={{ marginTop: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Bank Pytań (min. 15)</h4>
                    
                    {/* --- ZAKTUALIZOWANE PRZYCISKI (Z KOMPONENTEM AI) --- */}
                    <div style={{display: 'flex', gap: '0.5rem'}}>
                      
                      {/* 2. Używamy nowego komponentu AI */}
                      <AiGeneratorButton
                        api={api}
                        text={text}
                        topic={title}
                        onQuestionsGenerated={handleAiQuestionsGenerated}
                        onError={handleAiError} // Przekazujemy funkcję do obsługi błędu
                      />
                      
                      <button onClick={addQuestion} className="btn btn-primary btn-sm">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <line x1="12" y1="5" x2="12" y2="19"/>
                          <line x1="5" y1="12" x2="19" y2="12"/>
                        </svg>
                        Dodaj pytanie
                      </button>
                    </div>
                  </div>

                  {/* 3. Wyświetlanie błędu, jeśli AI go zwróci */}
                  {aiError && (
                    <div className="badge badge-danger" style={{ display: 'block', marginBottom: '1rem', padding: '0.75rem 1rem', width: '100%' }}>
                      {aiError}
                    </div>
                  )}

                  {/* Wyświetlanie komunikatu walidacji (bez zmian) */}
                  {validation && (
                    <div className={`badge ${
                      validation.type === 'error' ? 'badge-danger' :
                      validation.type === 'warning' ? 'badge-warning' :
                      validation.type === 'success' ? 'badge-success' :
                      validation.type === 'ok' ? 'badge-primary' : 'badge-primary'
                    }`} style={{ display: 'block', marginBottom: '1rem', padding: '0.75rem 1rem', width: '100%' }}>
                      {validation.message}
                    </div>
                  )}

                  {/* Lista pytań (bez zmian) */}
                  {questions.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem', background: 'var(--bg-main)', borderRadius: 'var(--radius-md)', border: '2px dashed var(--border)' }}>
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" style={{ margin: '0 auto 1rem' }}>
                        <circle cx="12" cy="12" r="10"/>
                        <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/>
                        <line x1="12" y1="17" x2="12.01" y2="17"/>
                      </svg>
                      <p style={{ color: 'var(--text-secondary)' }}>Brak pytań. Dodaj je ręcznie lub wygeneruj.</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {questions.map((q, index) => (
                        <div key={index} className="card" style={{ background: 'var(--bg-main)', padding: '1.25rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <span className="badge badge-primary">Pytanie {index + 1}</span>
                            <button onClick={() => removeQuestion(index)} className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }}>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                              </svg>
                              Usuń
                            </button>
                          </div>
                          <div className="form-group">
                            <label className="form-label">Treść pytania</label>
                            <input
                              type="text"
                              placeholder="Wpisz pytanie..."
                              value={q.text}
                              onChange={(e) => updateQuestion(index, 'text', e.target.value)}
                              className="input"
                            />
                          </div>
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">Poprawna odpowiedź</label>
                            <input
                              type="text"
                              placeholder="Wpisz odpowiedź..."
                              value={q.correct_answer}
                              onChange={(e) => updateQuestion(index, 'correct_answer', e.target.value)}
                              className="input"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* --- ⭐ ZAKTUALIZOWANY PRZYCISK "Stwórz ćwiczenie" Z WALIDACJĄ ⭐ --- */}
          <button 
            onClick={createExercise} 
            className="btn btn-primary btn-lg" 
            style={{ width: '100%', marginTop: '1.5rem', cursor: isFormValid ? 'pointer' : 'not-allowed', opacity: isFormValid ? 1 : 0.6 }}
            disabled={!isFormValid} // 4. PRZYCISK JEST WYŁĄCZONY, JEŚLI WALIDACJA NIE PRZEJDZIE
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
              <path d="M17 21v-8H7v8M7 3v5h8"/>
            </svg>
            Stwórz ćwiczenie
          </button>

          {/* 5. Komunikat pomocy, dlaczego przycisk jest wyłączony */}
          {!isFormValid && (
             <small style={{ color: 'var(--warning)', textAlign: 'center', display: 'block', marginTop: '0.75rem' }}>
              Wypełnij tytuł, tekst oraz (jeśli rankingowe) minimum 15 poprawnie wypełnionych pytań.
             </small>
          )}
          {/* --- KONIEC SEKCJI WALIDACJI PRZYCISKU --- */}

        </div>

        {/* Wikipedia Search (bez zmian) */}
        <div className="card card-elevated animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="M21 21l-4.35-4.35"/>
            </svg>
            Znajdź teksty z Wikipedii
          </h2>

          <div className="form-group">
            <label className="form-label">Limit słów: {limit}</label>
            <input 
              type="range" 
              min="100" 
              max="1000" 
              step="50" 
              value={limit} 
              onChange={(e) => setLimit(Number(e.target.value))} 
              disabled={searchLoading}
              style={{
                width: '100%',
                height: '8px',
                borderRadius: '4px',
                background: `linear-gradient(to right, var(--primary) 0%, var(--primary) ${((limit - 100) / 900) * 100}%, var(--border) ${((limit - 100) / 900) * 100}%, var(--border) 100%)`,
                outline: 'none',
                appearance: 'none',
                cursor: 'pointer'
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
              <span>100 słów</span>
              <span>1000 słów</span>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Hasło wyszukiwania</label>
            <input 
              type="text" 
              className="input" 
              placeholder="np. Szybkie czytanie, Historia Polski..." 
              value={query} 
              onChange={(e) => setQuery(e.target.value)} 
              disabled={searchLoading}
              onKeyPress={(e) => e.key === 'Enter' && searchExercises()}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Liczba wyników: {numResults}</label>
            <input 
              type="range" 
              min="1" 
              max="20" 
              value={numResults} 
              onChange={(e) => setNumResults(parseInt(e.target.value))} 
              disabled={searchLoading}
              style={{
                width: '100%',
                height: '8px',
                borderRadius: '4px',
                background: `linear-gradient(to right, var(--secondary) 0%, var(--secondary) ${((numResults - 1) / 19) * 100}%, var(--border) ${((numResults - 1) / 19) * 100}%, var(--border) 100%)`,
                outline: 'none',
                appearance: 'none',
                cursor: 'pointer'
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
              <span>1 wynik</span>
              <span>20 wyników</span>
            </div>
          </div>

          <button 
            onClick={searchExercises} 
            className="btn btn-primary btn-lg" 
            disabled={searchLoading}
            style={{ width: '100%' }}
          >
            {searchLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }}></div>
                <span>Szukam...</span>
              </div>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="M21 21l-4.35-4.35"/>
                </svg>
                Szukaj w Wikipedii
              </>
            )}
          </button>

          {results.length > 0 && (
            <div style={{ marginTop: '2rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>
                Wyniki wyszukiwania ({results.length})
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {results.map((item, i) => (
                  <div key={i} className="card" style={{ background: 'var(--bg-main)', padding: '1.5rem' }}>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.75rem' }}>
                      {item.title}
                    </h4>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '1rem', lineHeight: 1.6 }}>
                      {item.snippet.substring(0, 250)}{item.snippet.length > 250 ? '...' : ''}
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="badge badge-primary">
                        {item.snippet.split(/\s+/).filter(Boolean).length} słów
                      </span>
                      <button
                        onClick={() => addExerciseFromResult(item.title, item.snippet)}
                        className="btn btn-secondary"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="12" y1="5" x2="12" y2="19"/>
                          <line x1="5" y1="12" x2="19" y2="12"/>
                        </svg>
                        Dodaj jako ćwiczenie
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}