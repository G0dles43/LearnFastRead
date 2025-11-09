import React, { useState } from 'react';

function AiGeneratorButton({ api, text, topic, onQuestionsGenerated, onError }) {
  const [aiLoading, setAiLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [openCount, setOpenCount] = useState(10);
  const [choiceCount, setChoiceCount] = useState(5);

  const handleGenerateAiQuestions = async () => {
    if (!text.trim() || text.trim().length < 50) {
      onError("Wklej najpierw tekst źródłowy (minimum 50 znaków), aby AI mogło działać.");
      return;
    }

    setAiLoading(true);
    onError(null);

    const total_count = openCount + choiceCount;

    if (total_count < 15) {
      onError("Suma pytań (otwartych + zamkniętych) musi wynosić co najmniej 15.");
      setAiLoading(false);
      return;
    }

    try {
      const res = await api.post("ai/generate-questions/", {
        content: text,
        topic: topic || "Ogólny temat",
        total_count: total_count,
        open_count: openCount,
        choice_count: choiceCount
      });

      onQuestionsGenerated(res.data);
      setIsModalOpen(false);

    } catch (err) {
      console.error("Błąd podczas generowania pytań AI:", err);
      const errorMsg = err.response?.data?.error || "Nie udało się wygenerować pytań. Spróbuj ponownie.";
      onError(errorMsg);
    } finally {
      setAiLoading(false);
    }
  };

  const handleOpenModal = (e) => {
    e.preventDefault();
    if (!text.trim() || text.trim().length < 50) {
      onError("Wklej najpierw tekst źródłowy (minimum 50 znaków), aby AI mogło działać.");
      return;
    }
    onError(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = (e) => {
    if (e) e.preventDefault();
    if (aiLoading) return;
    setIsModalOpen(false);
  };

  return (
    <>
      <button
        onClick={handleOpenModal}
        className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md font-semibold transition-all text-sm bg-background-surface text-text-primary border border-border-light hover:bg-background-surface-hover hover:border-primary"
        title="Użyj AI, aby wygenerować pytania z tekstu"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
        </svg>
        Generuj (AI)
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[1000] backdrop-blur-sm animate-fade-in">
          <div className="w-[90%] max-w-[500px] p-8 z-[1001] bg-background-elevated shadow-md rounded-lg border border-border">

            <h3 className="text-xl font-semibold mb-6">Konfiguracja Generatora AI</h3>

            <p className="text-text-secondary mb-4 text-sm">
              Podaj, ile pytań otwartych i zamkniętych ma wygenerować AI. Suma musi wynosić co najmniej 15.
            </p>

            <div className="mb-6">
              <label className="block font-semibold text-text-primary mb-2">Liczba pytań OTWARTYCH</label>
              <input
                type="number"
                className="block w-full rounded-md border-2 border-border bg-background-main px-4 py-3.5 text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                value={openCount}
                onChange={(e) => setOpenCount(Math.max(0, parseInt(e.target.value)))}
                min="0"
              />
            </div>

            <div className="mb-6">
              <label className="block font-semibold text-text-primary mb-2">Liczba pytań ZAMKNIĘTYCH</label>
              <input
                type="number"
                className="block w-full rounded-md border-2 border-border bg-background-main px-4 py-3.5 text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                value={choiceCount}
                onChange={(e) => setChoiceCount(Math.max(0, parseInt(e.target.value)))}
                min="0"
              />
            </div>

            <div className="text-center text-lg text-text-primary mb-6 p-3 bg-background-main rounded-md">
              Suma: <strong className="text-primary-light">{openCount + choiceCount}</strong> (min. 15)
            </div>

            <div className="flex justify-between gap-4">
              <button
                onClick={handleCloseModal}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-md font-semibold transition-all bg-background-surface text-text-primary border border-border-light hover:bg-background-surface-hover hover:border-primary disabled:opacity-50"
                disabled={aiLoading}
              >
                Anuluj
              </button>
              <button
                onClick={handleGenerateAiQuestions}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-md font-semibold transition-all text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 bg-gradient-to-r from-primary to-primary-light disabled:opacity-50"
                disabled={aiLoading || (openCount + choiceCount < 15)}
              >
                {aiLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-current mx-auto"></div>
                ) : (
                  "Generuj"
                )}
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}

export default AiGeneratorButton;