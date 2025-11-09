import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import QuestionBank from "./QuestionBank.jsx";
import WikipediaImporter from "./WikipediaImporter.jsx"; // Importujemy nowy komponent

export default function ExerciseCreator({ api }) {

  const { id } = useParams();
  const isEditMode = Boolean(id);
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [isRanked, setIsRanked] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isFormValid, setIsFormValid] = useState(false);
  const [aiError, setAiError] = useState(null);

  const token = localStorage.getItem("access");
  const navigate = useNavigate();

  // useEffect loadInitialData (bez zmian)
  useEffect(() => {
    if (!token) { navigate("/login"); return; }
    if (!api) { console.error("ExerciseCreator: Brak instancji API."); setLoading(false); return; }

    const loadInitialData = async () => {
      setLoading(true);
      try {
        const statusRes = await api.get("user/status/");
        setIsAdmin(statusRes.data.is_admin);

        if (isEditMode) {
          const exerciseRes = await api.get(`exercises/${id}/`);
          const data = exerciseRes.data;

          const currentUserId = jwtDecode(token).user_id;
          const isOwner = data.created_by_id === currentUserId;
          if (!isOwner && !statusRes.data.is_admin) {
            alert("Brak uprawnień do edycji tego ćwiczenia.");
            navigate("/dashboard");
            return;
          }

          setTitle(data.title);
          setText(data.text);
          setIsPublic(data.is_public);
          setIsRanked(data.is_ranked);
          const sanitizedQuestions = (data.questions || []).map(q => ({
            ...q,
            question_type: q.question_type || 'open'
          }));
          setQuestions(sanitizedQuestions);
        }
      } catch (err) {
        console.error("Błąd ładowania danych:", err);
        alert("Nie udało się załadować danych.");
        navigate("/dashboard");
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [token, navigate, api, id, isEditMode]);

  // useEffect isFormValid (bez zmian)
  useEffect(() => {
    const minBank = 15;

    const isBaseValid = title.trim() !== "" && text.trim() !== "";
    if (!isBaseValid) {
      setIsFormValid(false);
      return;
    }

    if (isRanked) {
      const hasMinQuestions = questions.length >= minBank;

      const allQuestionsFilled = questions.every((q) => {
        if (!q.text.trim() || !q.correct_answer.trim()) return false;
        if (q.question_type === 'choice') {
          return q.option_1 && q.option_2 && q.option_3 && q.option_4 &&
            [q.option_1, q.option_2, q.option_3, q.option_4].includes(q.correct_answer);
        }
        return true;
      });

      setIsFormValid(hasMinQuestions && allQuestionsFilled);

    } else {
      setIsFormValid(true);
    }

  }, [title, text, questions, isRanked]);

  // getQuestionBankValidationMessage (bez zmian)
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

  // handleRankedChange (bez zmian)
  const handleRankedChange = (e) => {
    const newRankedValue = e.target.checked;
    setIsRanked(newRankedValue);
    if (newRankedValue) setIsPublic(true);
  };

  // --- Funkcje zarządzania pytaniami (bez zmian) ---
  const addQuestion = () => setQuestions([...questions, {
    text: "", correct_answer: "", question_type: "open", option_1: "", option_2: "", option_3: "", option_4: ""
  }]);
  const updateQuestion = (index, field, value) => {
    const u = [...questions];
    const oldQuestion = { ...u[index] };
    const newQuestion = { ...oldQuestion, [field]: value };
    if (field === 'question_type' && value === 'open') {
      newQuestion.option_1 = ""; newQuestion.option_2 = ""; newQuestion.option_3 = ""; newQuestion.option_4 = "";
      if ([oldQuestion.option_1, oldQuestion.option_2, oldQuestion.option_3, oldQuestion.option_4].includes(oldQuestion.correct_answer)) {
        newQuestion.correct_answer = "";
      }
    }
    if (['option_1', 'option_2', 'option_3', 'option_4'].includes(field)) {
      if (oldQuestion[field] === oldQuestion.correct_answer) {
        newQuestion.correct_answer = value;
      }
    }
    if (field === 'set_correct_answer') {
      newQuestion.correct_answer = value;
    }
    u[index] = newQuestion;
    setQuestions(u);
  };
  const removeQuestion = (index) => setQuestions(questions.filter((_, i) => i !== index));
  const handleAiQuestionsGenerated = (newQuestions) => {
    setQuestions(prevQuestions => [...prevQuestions, ...newQuestions]);
    setAiError(null);
  };
  const handleAiError = (errorMsg) => { setAiError(errorMsg); };
  // --- Koniec funkcji zarządzania pytaniami ---

  // handleSubmit (bez zmian)
  const handleSubmit = async () => {
    if (!api) return alert("Błąd: Brak instancji API.");
    if (!isFormValid) {
      alert("Formularz jest niekompletny lub zawiera błędy. Sprawdź, czy wszystkie pytania rankingowe mają 4 opcje i zaznaczoną poprawną odpowiedź.");
      return;
    }
    setIsSubmitting(true);
    const cleanedText = text.replace(/<[^>]+>|\([^)]*\)|[\[\]{};:,<>/\\|_\-+=]/g, "").replace(/\s+/g, " ").trim();
    const payload = { title, text: cleanedText };
    if (isAdmin) {
      payload.is_public = isPublic;
      payload.is_ranked = isRanked;
    }
    if (isRanked) {
      payload.questions = questions.map(q => ({
        text: q.text, correct_answer: q.correct_answer, question_type: q.question_type,
        option_1: q.question_type === 'choice' ? q.option_1 : null,
        option_2: q.question_type === 'choice' ? q.option_2 : null,
        option_3: q.question_type === 'choice' ? q.option_3 : null,
        option_4: q.question_type === 'choice' ? q.option_4 : null,
      }));
    }
    try {
      if (isEditMode) {
        await api.patch(`exercises/${id}/`, payload);
        alert("Ćwiczenie zaktualizowane!");
      } else {
        await api.post("exercises/create/", payload);
        alert("Ćwiczenie dodane!");
      }
      navigate("/dashboard");
    } catch (error) {
      console.error("Błąd zapisu ćwiczenia:", error);
      alert(`Błąd podczas zapisu: ${error.response?.data?.error || error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Nowa funkcja do obsługi importu z Wikipedii
  const handleWikipediaImport = (importedTitle, importedSnippet) => {
    setTitle(importedTitle);
    setText(importedSnippet);
    // Przewiń na górę strony, aby użytkownik zobaczył wypełniony formularz
    window.scrollTo(0, 0);
  };

  if (loading) return (
    <div className="min-h-screen bg-background-main text-text-primary flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>
  );

  const wordCount = text.trim().split(/\s+/).filter(w => w.length > 0).length;
  const validation = getQuestionBankValidationMessage();

  return (
    <div className="min-h-screen text-text-primary p-4 md:p-8 bg-gradient-to-br from-background-main/95 to-background-surface/95 bg-[url('/3.png')] bg-cover bg-center bg-fixed">
      <div className="mx-auto w-full max-w-[1200px]">
        <header className="flex items-center justify-between mb-8 animate-fade-in">
          <div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Kreator Ćwiczeń
            </h1>
            <p className="text-text-secondary text-lg">
              Stwórz własne teksty lub importuj z Wikipedii
            </p>
          </div>
          <button
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-md font-semibold transition-all bg-background-surface text-text-primary border border-border-light hover:bg-background-surface-hover hover:border-primary"
            onClick={() => navigate("/dashboard")}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Powrót
          </button>
        </header>

        {/* --- Główny Formularz --- */}
        <div className="bg-background-elevated shadow-md rounded-lg border border-border p-6 animate-fade-in [animation-delay:0.1s] mb-8">
          <h2 className="text-2xl font-semibold mb-6 flex items-center gap-3">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
            Własny tekst
          </h2>

          <div className="mb-6">
            <label className="block font-semibold text-text-primary mb-2">Tytuł ćwiczenia</label>
            <input
              type="text"
              className="block w-full rounded-md border-2 border-border bg-background-main px-4 py-3.5 text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="Wpisz tytuł..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="mb-6">
            <label className="block font-semibold text-text-primary mb-2">Tekst ćwiczenia</label>
            <textarea
              className="block w-full rounded-md border-2 border-border bg-background-main px-4 py-3.5 text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[200px] resize-y"
              placeholder="Wklej lub wpisz tekst..."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <div className="flex justify-between items-center mt-3">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-semibold rounded-full bg-primary/15 text-primary-light">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-1">
                  <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
                </svg>
                {wordCount} słów
              </span>
            </div>
          </div>

          {isAdmin && (
            <div className="bg-background-surface rounded-lg p-6 mt-6">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0110 0v4" />
                </svg>
                Opcje Administratora
              </h3>

              <div className="flex flex-col gap-4">
                <label className={`flex items-center gap-3 cursor-pointer p-3 rounded-md transition-all ${isRanked ? 'bg-warning/10' : 'hover:bg-background-main'}`}>
                  <input
                    type="checkbox"
                    checked={isRanked}
                    onChange={handleRankedChange}
                    className="w-5 h-5 cursor-pointer accent-primary"
                  />
                  <div>
                    <div className="font-semibold">Ćwiczenie rankingowe</div>
                    <div className="text-sm text-text-secondary">Wymaga banku pytań sprawdzających</div>
                  </div>
                </label>

                <label className={`flex items-center gap-3 cursor-pointer p-3 rounded-md transition-all ${isPublic ? 'bg-primary/10' : 'hover:bg-background-main'}`}>
                  <input
                    type="checkbox"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    disabled={isRanked}
                    className="w-5 h-5 cursor-pointer accent-primary disabled:cursor-not-allowed disabled:opacity-50"
                  />
                  <div>
                    <div className="font-semibold">Ćwiczenie publiczne</div>
                    <div className="text-sm text-text-secondary">
                      {isRanked ? 'Rankingowe musi być publiczne' : 'Widoczne dla wszystkich'}
                    </div>
                  </div>
                </label>
              </div>

              {isRanked && (
                <QuestionBank
                  api={api}
                  text={text}
                  topic={title}
                  questions={questions}
                  validation={validation}
                  aiError={aiError}
                  onAddQuestion={addQuestion}
                  onUpdateQuestion={updateQuestion}
                  onRemoveQuestion={removeQuestion}
                  onAiQuestionsGenerated={handleAiQuestionsGenerated}
                  onAiError={handleAiError}
                />
              )}
            </div>
          )}

          <button
            onClick={handleSubmit}
            className="inline-flex items-center justify-center gap-2 w-full px-8 py-4 rounded-md font-semibold transition-all text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 bg-gradient-to-r from-primary to-primary-light text-lg mt-6 disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={!isFormValid || isSubmitting}
          >
            {isSubmitting ? (
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-current mx-auto"></div>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
                  <path d="M17 21v-8H7v8M7 3v5h8" />
                </svg>
                {isEditMode ? 'Zapisz zmiany' : 'Stwórz ćwiczenie'}
              </>
            )}
          </button>

          {!isFormValid && (
            <small className="text-warning text-center block mt-3 text-sm">
              {isAdmin && isRanked ? (
                'Wypełnij tytuł, tekst oraz minimum 15 pytań. (Pytania zamknięte muszą mieć 4 opcje i zaznaczoną poprawną).'
              ) : (
                'Wypełnij tytuł i tekst, aby aktywować przycisk.'
              )}
            </small>
          )}
        </div>

        {/* --- Komponent Wikipedii --- */}
        <WikipediaImporter
          api={api}
          onTextImported={handleWikipediaImport}
        />
      </div>
    </div>
  );
}