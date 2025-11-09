import React from "react";

export default function QuestionItem({ q, index, onUpdate, onRemove }) {
  return (
    <div className="bg-background-main rounded-lg border border-border p-5">
      <div className="flex justify-between items-center mb-4">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-primary/15 text-primary-light border border-primary/30">
          Pytanie {index + 1}
        </span>
        <button
          onClick={() => onRemove(index)}
          className="inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-md font-semibold transition-all text-sm text-danger hover:bg-background-surface-hover"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
          </svg>
          Usuń
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center mb-4">
        <div className="flex-grow w-full">
          <label className="block font-semibold text-text-primary mb-2">Treść pytania</label>
          <input
            type="text"
            placeholder="Wpisz pytanie..."
            value={q.text || ''}
            onChange={(e) => onUpdate(index, 'text', e.target.value)}
            className="block w-full rounded-md border-2 border-border bg-background-main px-4 py-3.5 text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div className="w-full md:w-auto">
          <label className="block font-semibold text-text-primary mb-2">Typ Pytania</label>
          <select
            className="block w-full rounded-md border-2 border-border bg-background-main px-4 py-3.5 text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 min-w-[120px]"
            value={q.question_type || 'open'}
            onChange={(e) => onUpdate(index, 'question_type', e.target.value)}
          >
            <option value="open">Otwarte</option>
            <option value="choice">Zamknięte</option>
          </select>
        </div>
      </div>

      {q.question_type === 'choice' ? (
        <div className="bg-background-surface p-4 rounded-md mt-4">
          <label className="block font-semibold text-text-primary mb-3">Opcje odpowiedzi (zaznacz poprawną)</label>
          <div className="grid grid-cols-1 gap-3">
            {['option_1', 'option_2', 'option_3', 'option_4'].map((optionKey) => (
              <div key={optionKey} className="flex items-center gap-3">
                <input
                  type="radio"
                  name={`q-${index}-correct`}
                  checked={q.correct_answer === q[optionKey] && q[optionKey] !== ""}
                  onChange={() => onUpdate(index, 'set_correct_answer', q[optionKey])}
                  className="w-5 h-5 flex-shrink-0 cursor-pointer accent-primary"
                />
                <input
                  type="text"
                  placeholder={`Opcja ${optionKey.split('_')[1]}`}
                  value={q[optionKey] || ''}
                  onChange={(e) => onUpdate(index, optionKey, e.target.value)}
                  className="block w-full rounded-md border-2 border-border bg-background-main px-4 py-3.5 text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 m-0"
                />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div>
          <label className="block font-semibold text-text-primary mb-2">Poprawna odpowiedź</label>
          <input
            type="text"
            placeholder="Wpisz odpowiedź..."
            value={q.correct_answer || ''}
            onChange={(e) => onUpdate(index, 'correct_answer', e.target.value)}
            className="block w-full rounded-md border-2 border-border bg-background-main px-4 py-3.5 text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      )}
    </div>
  );
}