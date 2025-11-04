import React, { useState } from 'react';

/**
 * Wydzielony komponent przycisku do generowania pytań przez AI.
 * Zarządza własnym stanem ładowania i obsługą błędów.
 *
 * @param {object} api - Instancja Twojego klienta API (axios).
 * @param {string} text - Tekst źródłowy ćwiczenia.
 * @param {string} topic - Tytuł ćwiczenia (używany jako kontekst dla AI).
 * @param {function} onQuestionsGenerated - Callback wywoływany po sukcesie, zwraca tablicę nowych pytań.
 * @param {function} onError - Callback wywoływany przy błędzie, zwraca string z wiadomością.
 */
function AiGeneratorButton({ api, text, topic, onQuestionsGenerated, onError }) {
  const [aiLoading, setAiLoading] = useState(false);

  const handleGenerateAiQuestions = async () => {
    // Prosta walidacja po stronie klienta
    if (!text.trim() || text.trim().length < 50) {
      onError("Wklej najpierw tekst źródłowy (minimum 50 znaków), aby AI mogło działać.");
      return;
    }

    setAiLoading(true);
    onError(null); // Wyczyść poprzednie błędy

    try {
      // 1. Wywołujemy endpoint backendu, który stworzyliśmy
      const res = await api.post("ai/generate-questions/", {
        content: text,
        topic: topic || "Ogólny temat",
        count: 15, // Domyślnie generuj 15 pytań
      });

      // 2. Mapujemy odpowiedź z AI (np. {question: "...", answer: "..."})
      //    na format stanu React (np. {text: "...", correct_answer: "..."})
      const newQuestions = res.data.map((q) => ({
        text: q.question,
        correct_answer: q.answer,
        question_type: "open", // Zakładamy domyślny typ
      }));

      // 3. Przekazujemy gotowe pytania do komponentu nadrzędnego
      onQuestionsGenerated(newQuestions);

    } catch (err) {
      console.error("Błąd podczas generowania pytań AI:", err);
      // Przekazujemy błąd z backendu (jeśli jest) lub generyczny
      const errorMsg = err.response?.data?.error || "Nie udało się wygenerować pytań. Spróbuj ponownie.";
      onError(errorMsg);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <button
      onClick={handleGenerateAiQuestions}
      className="btn btn-secondary btn-sm"
      title="Użyj AI, aby wygenerować pytania z tekstu"
      disabled={aiLoading}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: aiLoading ? 'spin 1.5s linear infinite' : 'none' }}>
        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
      </svg>
      {aiLoading ? "Generuję..." : "Generuj (AI)"}
    </button>
  );
}

export default AiGeneratorButton;