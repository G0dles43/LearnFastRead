import React, { useState } from "react";

export default function WikipediaImporter({ api, onTextImported }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [limit, setLimit] = useState(300);
  const [searchLoading, setSearchLoading] = useState(false);
  const [numResults, setNumResults] = useState(5);

  const searchExercises = async () => {
    if (!api) return alert("Błąd: Brak instancji API.");
    if (!query.trim()) { alert("Wpisz hasło do wyszukania."); return; }
    setSearchLoading(true);
    setResults([]);
    try {
      const res = await api.get("exercises/search/", {
        params: { query, num_results: numResults, limit: limit }
      });
      if (res.data.results && res.data.results.length > 0) {
        setResults(res.data.results);
      } else {
        alert(res.data.message || "Wikipedia nie zwróciła wyników.");
      }
    } catch (error) {
      console.error("Błąd wyszukiwania:", error);
      alert("Błąd podczas wyszukiwania w Wikipedii");
    } finally {
      setSearchLoading(false);
    }
  };

  const handleAddClick = (title, snippet) => {
    // Zamiast nawigować, przekazujemy dane do rodzica
    onTextImported(title, snippet);
    // Czyścimy wyniki po dodaniu
    setResults([]);
  };

  return (
    <div className="bg-background-elevated shadow-md rounded-lg border border-border p-6 animate-fade-in [animation-delay:0.2s]">
      <h2 className="text-2xl font-semibold mb-6 flex items-center gap-3">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
        Znajdź teksty z Wikipedii
      </h2>

      <div className="mb-6">
        <label className="block font-semibold text-text-primary mb-2">Limit słów: {limit}</label>
        <input
          type="range"
          min="100"
          max="1000"
          step="50"
          value={limit}
          onChange={(e) => setLimit(Number(e.target.value))}
          disabled={searchLoading}
          className="w-full h-2 rounded-lg outline-none appearance-none cursor-pointer"
          style={{ background: `linear-gradient(to right, var(--primary) 0%, var(--primary) ${((limit - 100) / 900) * 100}%, var(--border) ${((limit - 100) / 900) * 100}%, var(--border) 100%)` }}
        />
        <div className="flex justify-between text-text-secondary text-sm mt-2">
          <span>100 słów</span>
          <span>1000 słów</span>
        </div>
      </div>

      <div className="mb-6">
        <label className="block font-semibold text-text-primary mb-2">Hasło wyszukiwania</label>
        <input
          type="text"
          className="block w-full rounded-md border-2 border-border bg-background-main px-4 py-3.5 text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
          placeholder="np. Szybkie czytanie, Historia Polski..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={searchLoading}
          onKeyPress={(e) => e.key === 'Enter' && searchExercises()}
        />
      </div>

      <div className="mb-6">
        <label className="block font-semibold text-text-primary mb-2">Liczba wyników: {numResults}</label>
        <input
          type="range"
          min="1"
          max="20"
          value={numResults}
          onChange={(e) => setNumResults(parseInt(e.target.value))}
          disabled={searchLoading}
          className="w-full h-2 rounded-lg outline-none appearance-none cursor-pointer"
          style={{ background: `linear-gradient(to right, var(--secondary) 0%, var(--secondary) ${((numResults - 1) / 19) * 100}%, var(--border) ${((numResults - 1) / 19) * 100}%, var(--border) 100%)` }}
        />
        <div className="flex justify-between text-text-secondary text-sm mt-2">
          <span>1 wynik</span>
          <span>20 wyników</span>
        </div>
      </div>

      <button
        onClick={searchExercises}
        className="inline-flex items-center justify-center gap-2 w-full px-8 py-4 rounded-md font-semibold transition-all text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 bg-gradient-to-r from-primary to-primary-light text-lg"
        disabled={searchLoading}
      >
        {searchLoading ? (
          <div className="flex items-center justify-center gap-3">
            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-current"></div>
            <span>Szukam...</span>
          </div>
        ) : (
          <>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            Szukaj w Wikipedii
          </>
        )}
      </button>

      {results.length > 0 && (
        <div className="mt-8">
          <h3 className="text-xl font-semibold mb-4">
            Wyniki wyszukiwania ({results.length})
          </h3>
          <div className="flex flex-col gap-4">
            {results.map((item, i) => (
              <div key={i} className="bg-background-main rounded-lg border border-border p-6">
                <h4 className="text-lg font-semibold mb-3">
                  {item.title}
                </h4>
                <p className="text-text-secondary text-sm mb-4 leading-relaxed">
                  {item.snippet.substring(0, 250)}{item.snippet.length > 250 ? '...' : ''}
                </p>
                <div className="flex justify-between items-center">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-primary/15 text-primary-light border border-primary/30">
                    {item.snippet.split(/\s+/).filter(Boolean).length} słów
                  </span>
                  <button
                    onClick={() => handleAddClick(item.title, item.snippet)}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-md font-semibold transition-all bg-background-surface text-text-primary border border-border-light hover:bg-background-surface-hover hover:border-primary"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Wypełnij formularz
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}