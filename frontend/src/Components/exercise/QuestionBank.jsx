import React from "react";
import AiGeneratorButton from "./AiGeneratorButton.jsx";
import QuestionItem from "./QuestionItem.jsx";

export default function QuestionBank({
  api,
  text,
  topic,
  questions,
  validation,
  aiError,
  onAddQuestion,
  onUpdateQuestion,
  onRemoveQuestion,
  onAiQuestionsGenerated,
  onAiError
}) {
  return (
    <div className="mt-6">
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <h4 className="text-lg font-semibold">Bank Pytań (min. 15)</h4>
        <div className="flex gap-2">
          <AiGeneratorButton
            api={api}
            text={text}
            topic={topic}
            onQuestionsGenerated={onAiQuestionsGenerated}
            onError={onAiError}
          />
          <button
            onClick={onAddQuestion}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md font-semibold text-sm transition-all text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 bg-gradient-to-r from-primary to-primary-light"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Dodaj pytanie
          </button>
        </div>
      </div>

      {aiError && (
        <div className="flex items-center justify-center p-3 w-full rounded-md font-semibold bg-danger/15 text-danger border border-danger/30 mb-4">
          {aiError}
        </div>
      )}

      {validation && (
        <div className={`flex items-center justify-center p-3 w-full rounded-md font-semibold border mb-4 ${validation.type === 'error' ? 'bg-danger/15 text-danger border-danger/30' :
          validation.type === 'warning' ? 'bg-warning/15 text-warning border-warning/30' :
            validation.type === 'success' ? 'bg-success/15 text-success border-success/30' :
              'bg-primary/15 text-primary-light border-primary/30'
          }`}>
          {validation.message}
        </div>
      )}

      {questions.length === 0 ? (
        <div className="text-center p-8 bg-background-main rounded-md border-2 border-dashed border-border">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" className="mx-auto mb-4 stroke-text-muted">
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <p className="text-text-secondary">Brak pytań. Dodaj je ręcznie lub wygeneruj.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {questions.map((q, index) => (
            <QuestionItem
              key={index}
              q={q}
              index={index}
              onUpdate={onUpdateQuestion}
              onRemove={onRemoveQuestion}
            />
          ))}
        </div>
      )}

      {questions.length > 0 && (
        <div className="flex justify-center mt-6">
          <button
            onClick={onAddQuestion}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-md font-semibold transition-all bg-background-surface text-text-primary border border-border-light hover:bg-background-surface-hover hover:border-primary"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Dodaj kolejne pytanie
          </button>
        </div>
      )}
    </div>
  );
}