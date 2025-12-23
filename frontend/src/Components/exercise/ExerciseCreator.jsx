import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import QuestionBank from "./QuestionBank.jsx";
import WikipediaImporter from "./WikipediaImporter.jsx";

export default function ExerciseCreator({ api }) {

  const { id } = useParams();
  const isEditMode = Boolean(id);
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [isRanked, setIsRanked] = useState(false);
  const [isDailyCandidate, setIsDailyCandidate] = useState(false);
  const [dailyDate, setDailyDate] = useState(""); 

  const [questions, setQuestions] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isFormValid, setIsFormValid] = useState(false);
  const [aiError, setAiError] = useState(null);

  const token = localStorage.getItem("access");
  const navigate = useNavigate();

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
          setIsDailyCandidate(data.is_daily_candidate);
          
          if (data.scheduled_date) {
            setDailyDate(data.scheduled_date);
          }

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

  const getQuestionBankValidationMessage = () => {
    if (!isRanked) return null;
    const minBank = 15;
    const currentCount = questions.length;
    if (text.trim().length === 0) return { type: "info", message: "Wpisz tekst ćwiczenia..." };
    if (currentCount === 0) return { type: "error", message: `Brak pytań! Minimum do banku: ${minBank}` };
    if (currentCount < minBank) return { type: "warning", message: `Za mało pytań do banku! Masz ${currentCount}, minimum ${minBank}` };
    return { type: "ok", message: `Liczba pytań w banku: ${currentCount}` };
  };

  const handleRankedChange = (e) => {
    const newRankedValue = e.target.checked;
    setIsRanked(newRankedValue);
    if (!newRankedValue) {
        setIsDailyCandidate(false);
    }
    if (newRankedValue) setIsPublic(true);
  };

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


  const handleSubmit = async () => {
    if (!api) return alert("Błąd: Brak instancji API.");
    if (!isFormValid) {
      alert("Formularz niekompletny. Sprawdź wymagania.");
      return;
    }
    setIsSubmitting(true);
    const cleanedText = text.replace(/<[^>]+>|\([^)]*\)|[\[\]{};:,<>/\\|_\-+=]/g, "").replace(/\s+/g, " ").trim();
    
    const payload = { title, text: cleanedText };
    
    if (isAdmin) {
      payload.is_public = isPublic;
      payload.is_ranked = isRanked;
      payload.is_daily_candidate = isDailyCandidate;
      if (dailyDate) payload.daily_date = dailyDate; 
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
      } else {
        await api.post("exercises/create/", payload);
      }
      navigate("/dashboard");
    } catch (error) {
      console.error("Błąd:", error);
      alert(`Błąd: ${error.response?.data?.error || error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWikipediaImport = (importedTitle, importedSnippet) => {
    setTitle(importedTitle);
    setText(importedSnippet);
    window.scrollTo(0, 0);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background-main"><div className="animate-spin rounded-full h-12 w-12 border-primary border-t-2 border-b-2"></div></div>;
  
  const wordCount = text.trim().split(/\s+/).filter(w => w.length > 0).length;
  const validation = getQuestionBankValidationMessage();

  return (
    <div className="min-h-screen text-text-primary p-4 md:p-8 bg-gradient-to-br from-background-main/95 to-background-surface/95 bg-[url('/3.png')] bg-cover bg-center bg-fixed">
      <div className="mx-auto w-full max-w-[1200px]">
        <header className="flex items-center justify-between mb-8 animate-fade-in">
           <div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Kreator Ćwiczeń</h1>
           </div>
           <button onClick={() => navigate("/dashboard")} className="px-6 py-3 rounded-md bg-background-surface border border-border-light hover:border-primary text-text-primary">Powrót</button>
        </header>

        <div className="bg-background-elevated shadow-md rounded-lg border border-border p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-6">Treść Ćwiczenia</h2>
          
          <div className="mb-6">
            <label className="block font-semibold mb-2">Tytuł</label>
            <input type="text" className="w-full p-3 bg-background-main border-2 border-border rounded-md focus:border-primary outline-none" value={title} onChange={e => setTitle(e.target.value)} placeholder="Tytuł..." />
          </div>

          <div className="mb-6">
            <label className="block font-semibold mb-2">Tekst ({wordCount} słów)</label>
            <textarea className="w-full p-3 bg-background-main border-2 border-border rounded-md focus:border-primary outline-none min-h-[200px]" value={text} onChange={e => setText(e.target.value)} placeholder="Tekst..." />
          </div>

          {isAdmin && (
            <div className="bg-background-surface rounded-lg p-6 mt-6 border border-border">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <span>🛠️</span> Opcje Administratora
              </h3>

              <div className="flex flex-col gap-4">
                
                <label className={`flex items-center gap-3 cursor-pointer p-3 rounded-md ${isRanked ? 'bg-warning/10' : 'hover:bg-background-main'}`}>
                  <input 
                    type="checkbox" 
                    checked={isRanked} 
                    onChange={handleRankedChange} 
                    className="w-5 h-5 accent-primary" 
                    disabled={isDailyCandidate} 
                  />
                  <div>
                    <div className="font-semibold">Tryb Rankingowy</div>
                    <div className="text-sm text-text-secondary">Wymaga pytań sprawdzających</div>
                  </div>
                </label>

                <label className={`flex items-center gap-3 cursor-pointer p-3 rounded-md border-2 transition-all ${
                    isDailyCandidate ? 'border-purple-500 bg-purple-500/10' : 'border-transparent hover:bg-background-main'
                }`}>
                  <input 
                    type="checkbox" 
                    checked={isDailyCandidate} 
                    onChange={(e) => {
                        const checked = e.target.checked;
                        setIsDailyCandidate(checked);
                        if (checked) {
                            setIsRanked(true);
                            setIsPublic(false); 
                        } else {
                            setIsRanked(false);
                        }
                    }} 
                    className="w-5 h-5 accent-purple-500" 
                  />
                  <div>
                    <div className="font-semibold text-purple-400">
                        {isDailyCandidate ? "🔒 W Ukrytej Puli Daily" : "Dodaj do Ukrytej Puli Daily 🎲"}
                    </div>
                    <div className="text-sm text-text-secondary">
                        Ćwiczenie będzie <strong>niewidoczne</strong> dla użytkowników na liście głównej, dopóki system nie wylosuje go jako "Wyzwanie Dnia".
                    </div>
                  </div>
                </label>

                <label className={`flex items-center gap-3 cursor-pointer p-3 rounded-md ${isPublic ? 'bg-primary/10' : 'hover:bg-background-main'} ${isDailyCandidate ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  <input 
                    type="checkbox" 
                    checked={isPublic} 
                    onChange={e => setIsPublic(e.target.checked)} 
                    disabled={isDailyCandidate} 
                    className="w-5 h-5 accent-primary" 
                  />
                  <div>
                    <div className="font-semibold">Widoczne na liście głównej</div>
                    <div className="text-sm text-text-secondary">
                        {isDailyCandidate 
                            ? 'Zablokowane (ćwiczenie jest w ukrytej puli)' 
                            : (isRanked ? 'Wymagane dla rankingu (jeśli nie Daily)' : 'Widoczne dla wszystkich')}
                    </div>
                  </div>
                </label>
                
                {isDailyCandidate && (
                    <div className="mt-4 pt-4 border-t border-border animate-fade-in">
                        <label className="block font-semibold mb-2 text-text-primary flex items-center gap-2">
                            📅 (Opcjonalnie) Wymuś konkretną datę
                            {dailyDate && <span className="text-xs bg-success/20 text-success px-2 py-1 rounded">Ustawiono</span>}
                        </label>
                        <div className="flex gap-4 items-center">
                            <input 
                                type="date" 
                                className="p-3 bg-background-main border-2 border-border rounded-md text-text-primary focus:border-primary outline-none"
                                value={dailyDate || ""}
                                onChange={(e) => setDailyDate(e.target.value)}
                            />
                            {dailyDate && (
                                <button onClick={() => setDailyDate("")} className="text-sm text-danger hover:underline">
                                    Wyczyść datę
                                </button>
                            )}
                        </div>
                    </div>
                )}

              </div>

              {isRanked && (
                <QuestionBank 
                    api={api} text={text} topic={title} questions={questions} 
                    validation={validation} aiError={aiError}
                    onAddQuestion={addQuestion} onUpdateQuestion={updateQuestion} 
                    onRemoveQuestion={removeQuestion} onAiQuestionsGenerated={handleAiQuestionsGenerated} 
                    onAiError={handleAiError} 
                />
              )}
            </div>
          )}

          <button 
            onClick={handleSubmit} 
            disabled={!isFormValid || isSubmitting}
            className="w-full mt-6 py-4 bg-gradient-to-r from-primary to-primary-light text-white font-bold rounded-md shadow-lg hover:shadow-xl disabled:opacity-50 transition-all"
          >
            {isSubmitting ? "Zapisywanie..." : (isEditMode ? "Zapisz Zmiany" : "Stwórz Ćwiczenie")}
          </button>
          
          {!isFormValid && <p className="text-center text-warning mt-2 text-sm">Uzupełnij formularz (tytuł, tekst, pytania).</p>}
        </div>

        <WikipediaImporter api={api} onTextImported={handleWikipediaImport} />
      </div>
    </div>
  );
}