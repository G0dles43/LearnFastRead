import React, { useState } from 'react';

function AiGeneratorButton({ api, text, topic, onQuestionsGenerated, onError }) {
  const [aiLoading, setAiLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [openCount, setOpenCount] = useState(10);
  const [choiceCount, setChoiceCount] = useState(5);
  
  const MIN_TOTAL = 15;
  const MAX_TOTAL = 50;

  const totalCount = openCount + choiceCount;

  const handleGenerateAiQuestions = async () => {
    if (!text.trim() || text.trim().length < 50) {
      onError("Wklej najpierw tekst źródłowy (minimum 50 znaków).");
      return;
    }

    if (totalCount < MIN_TOTAL) {
      onError(`Suma pytań musi wynosić co najmniej ${MIN_TOTAL}.`);
      return;
    }

    setAiLoading(true);
    onError(null);

    try {
      const res = await api.post("ai/generate-questions/", {
        content: text,
        topic: topic || "Ogólny temat",
        total_count: totalCount,
        open_count: openCount,
        choice_count: choiceCount
      });

      onQuestionsGenerated(res.data);
      setIsModalOpen(false);

    } catch (err) {
      console.error("Błąd AI:", err);
      const errorMsg = err.response?.data?.error || "Nie udało się wygenerować pytań.";
      onError(errorMsg);
    } finally {
      setAiLoading(false);
    }
  };

  const handleOpenModal = (e) => {
    e.preventDefault();
    if (!text.trim() || text.trim().length < 50) {
      onError("Wklej najpierw tekst źródłowy.");
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
        title="Użyj AI"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
        </svg>
        Generuj (AI)
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[1000] backdrop-blur-sm animate-fade-in">
          <div className="w-[90%] max-w-[600px] p-8 z-[1001] bg-background-elevated shadow-md rounded-lg border border-border">

            <h3 className="text-2xl font-semibold mb-6">Generator AI - Konfiguracja</h3>

            <p className="text-text-secondary mb-6 text-sm">
              Użyj suwaków, aby dostosować liczbę pytań. Suma musi wynosić {MIN_TOTAL}-{MAX_TOTAL}.
            </p>

            {/* Pytania Otwarte */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <label className="font-semibold text-text-primary">Pytania Otwarte</label>
                <div className="px-4 py-2 bg-gradient-to-r from-primary to-primary-light rounded-md font-bold text-xl text-white min-w-[60px] text-center">
                  {openCount}
                </div>
              </div>
              <input
                type="range"
                min="0"
                max={MAX_TOTAL - choiceCount}
                step="1"
                value={openCount}
                onChange={(e) => setOpenCount(parseInt(e.target.value))}
                className="w-full h-3 rounded-lg outline-none appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, var(--primary) 0%, var(--primary) ${(openCount / MAX_TOTAL) * 100}%, var(--border) ${(openCount / MAX_TOTAL) * 100}%, var(--border) 100%)`
                }}
              />
            </div>

            {/* Pytania Zamknięte */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <label className="font-semibold text-text-primary">Pytania Zamknięte</label>
                <div className="px-4 py-2 bg-gradient-to-r from-secondary to-purple-400 rounded-md font-bold text-xl text-white min-w-[60px] text-center">
                  {choiceCount}
                </div>
              </div>
              <input
                type="range"
                min="0"
                max={MAX_TOTAL - openCount}
                step="1"
                value={choiceCount}
                onChange={(e) => setChoiceCount(parseInt(e.target.value))}
                className="w-full h-3 rounded-lg outline-none appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, var(--secondary) 0%, var(--secondary) ${(choiceCount / MAX_TOTAL) * 100}%, var(--border) ${(choiceCount / MAX_TOTAL) * 100}%, var(--border) 100%)`
                }}
              />
            </div>

            {/* Podsumowanie */}
            <div className={`text-center text-lg font-semibold mb-6 p-4 rounded-md ${
              totalCount >= MIN_TOTAL && totalCount <= MAX_TOTAL 
                ? 'bg-success/10 text-success border-2 border-success' 
                : 'bg-danger/10 text-danger border-2 border-danger'
            }`}>
              Suma: {totalCount} / {MIN_TOTAL}-{MAX_TOTAL}
            </div>

            {/* Przyciski */}
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
                disabled={aiLoading || totalCount < MIN_TOTAL || totalCount > MAX_TOTAL}
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