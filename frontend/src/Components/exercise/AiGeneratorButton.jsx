import React, { useState } from 'react';

/**
 * Komponent przycisku AI, który teraz zawiera własny modal
 * do konfiguracji liczby pytań.
 */
function AiGeneratorButton({ api, text, topic, onQuestionsGenerated, onError }) {
  const [aiLoading, setAiLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Stan dla formularza w okienku
  const [openCount, setOpenCount] = useState(10);
  const [choiceCount, setChoiceCount] = useState(5);

  const handleGenerateAiQuestions = async () => {
    if (!text.trim() || text.trim().length < 50) {
      onError("Wklej najpierw tekst źródłowy (minimum 50 znaków), aby AI mogło działać.");
      return;
    }

    setAiLoading(true);
    onError(null); // Wyczyść poprzednie błędy

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
      setIsModalOpen(false); // Zamknij modal po sukcesie

    } catch (err) {
      console.error("Błąd podczas generowania pytań AI:", err);
      const errorMsg = err.response?.data?.error || "Nie udało się wygenerować pytań. Spróbuj ponownie.";
      onError(errorMsg);
    } finally {
      setAiLoading(false);
    }
  };

  const handleOpenModal = (e) => {
    e.preventDefault(); // Zapobiegaj submitowaniu formularza
    if (!text.trim() || text.trim().length < 50) {
      onError("Wklej najpierw tekst źródłowy (minimum 50 znaków), aby AI mogło działać.");
      return;
    }
    onError(null);
    setIsModalOpen(true);
  };
  
  const handleCloseModal = (e) => {
    if (e) e.preventDefault();
    if (aiLoading) return; // Nie zamykaj podczas ładowania
    setIsModalOpen(false);
  };

  return (
    <>
      {/* Przycisk otwierający Modal */}
      <button
        onClick={handleOpenModal}
        className="btn btn-secondary btn-sm"
        title="Użyj AI, aby wygenerować pytania z tekstu"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
        </svg>
        Generuj (AI)
      </button>

      {/* Okienko Modal */}
      {isModalOpen && (
        <div style={modalStyles.overlay}>
          <div style={modalStyles.content} className="card card-elevated">
            
            <h3 style={{fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem'}}>Konfiguracja Generatora AI</h3>
            
            <p style={{color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.9rem'}}>
              Podaj, ile pytań otwartych i zamkniętych ma wygenerować AI. Suma musi wynosić co najmniej 15.
            </p>

            <div className="form-group">
              <label className="form-label">Liczba pytań OTWARTYCH</label>
              <input
                type="number"
                className="input"
                value={openCount}
                onChange={(e) => setOpenCount(Math.max(0, parseInt(e.target.value)))}
                min="0"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Liczba pytań ZAMKNIĘTYCH</label>
              <input
                type="number"
                className="input"
                value={choiceCount}
                onChange={(e) => setChoiceCount(Math.max(0, parseInt(e.target.value)))}
                min="0"
              />
            </div>
            
            <div style={modalStyles.total}>
              Suma: <strong>{openCount + choiceCount}</strong> (min. 15)
            </div>

            <div style={modalStyles.buttonGroup}>
              <button 
                onClick={handleCloseModal} 
                className="btn btn-secondary"
                disabled={aiLoading}
              >
                Anuluj
              </button>
              <button 
                onClick={handleGenerateAiQuestions} 
                className="btn btn-primary"
                disabled={aiLoading || (openCount + choiceCount < 15)}
              >
                {aiLoading ? (
                  <div className="spinner-small" style={{margin: '0 auto'}}></div>
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

// Style dla Modala (możesz przenieść do CSS)
const modalStyles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    backdropFilter: 'blur(5px)',
  },
  content: {
    width: '90%',
    maxWidth: '500px',
    padding: '2rem',
    zIndex: 1001,
  },
  total: {
    textAlign: 'center',
    fontSize: '1.1rem',
    color: 'var(--text-primary)',
    marginBottom: '1.5rem',
    padding: '0.75rem',
    background: 'var(--bg-elevated)',
    borderRadius: 'var(--radius-md)'
  },
  buttonGroup: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '1rem',
  }
};

export default AiGeneratorButton;