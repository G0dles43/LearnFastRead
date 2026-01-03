import React, { useState } from 'react';

function AiGeneratorButton({ api, text, topic, onQuestionsGenerated, onError }) {
  const [aiLoading, setAiLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [openCount, setOpenCount] = useState(10);
  const [choiceCount, setChoiceCount] = useState(5);
  
  const MIN_TOTAL = 15;
  const MAX_TOTAL = 50;

  const totalCount = openCount + choiceCount;

  const maxOpen = MAX_TOTAL - choiceCount;
  const maxChoice = MAX_TOTAL - openCount;

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


  const getSliderBackground = (value, max, colorVariable) => {
    const percentage = max > 0 ? (value / max) * 100 : 0;
    return {
      background: `linear-gradient(to right, var(${colorVariable}) 0%, var(${colorVariable}) ${percentage}%, var(--border) ${percentage}%, var(--border) 100%)`
    };
  };

  const rangeInputClasses = `
    w-full h-3 rounded-lg outline-none appearance-none cursor-pointer bg-transparent
    [&::-webkit-slider-thumb]:appearance-none 
    [&::-webkit-slider-thumb]:w-5 
    [&::-webkit-slider-thumb]:h-5 
    [&::-webkit-slider-thumb]:rounded-full 
    [&::-webkit-slider-thumb]:bg-white 
    [&::-webkit-slider-thumb]:shadow-md 
    [&::-webkit-slider-thumb]:mt-[-4px]
    [&::-webkit-slider-thumb]:border
    [&::-webkit-slider-thumb]:border-gray-200
    [&::-moz-range-thumb]:w-5 
    [&::-moz-range-thumb]:h-5 
    [&::-moz-range-thumb]:rounded-full 
    [&::-moz-range-thumb]:bg-white 
    [&::-moz-range-thumb]:border-none 
    [&::-moz-range-thumb]:shadow-md
  `;

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
                max={maxOpen}
                step="1"
                value={openCount}
                onChange={(e) => setOpenCount(parseInt(e.target.value))}
                className={rangeInputClasses}
                style={getSliderBackground(openCount, maxOpen, '--primary')}
              />
              <div className="flex justify-between text-xs text-text-secondary mt-1">
                <span>0</span>
                <span>max: {maxOpen}</span>
              </div>
            </div>

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
                max={maxChoice}
                step="1"
                value={choiceCount}
                onChange={(e) => setChoiceCount(parseInt(e.target.value))}
                className={rangeInputClasses}
                style={getSliderBackground(choiceCount, maxChoice, '--secondary')}
              />
              <div className="flex justify-between text-xs text-text-secondary mt-1">
                <span>0</span>
                <span>max: {maxChoice}</span>
              </div>
            </div>

            <div className={`text-center text-lg font-semibold mb-6 p-4 rounded-md transition-colors ${
              totalCount >= MIN_TOTAL && totalCount <= MAX_TOTAL 
                ? 'bg-success/10 text-success border-2 border-success' 
                : 'bg-danger/10 text-danger border-2 border-danger'
            }`}>
              Suma: {totalCount} / {MIN_TOTAL}-{MAX_TOTAL}
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
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-md font-semibold transition-all text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 bg-gradient-to-r from-primary to-primary-light disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:transform-none"
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