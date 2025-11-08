import React from "react";

// Mały komponent-przycisk dla filtrów
const FilterButton = ({ text, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`
      w-full text-left flex items-center gap-3 p-3 rounded-lg transition-all 
      font-medium text-text-primary
      ${isActive 
        ? 'bg-primary/15 text-primary' 
        : 'bg-background-main hover:bg-background-surface-hover'
      }
    `}
  >
    {/* Symulujemy checkbox dla spójnego wyglądu */}
    <div className={`
      w-5 h-5 rounded border-2 
      ${isActive 
        ? 'bg-primary border-primary' 
        : 'border-border-light'
      }
      flex items-center justify-center transition-all
    `}>
      {isActive && (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
          <path d="M20 6L9 17l-5-5" />
        </svg>
      )}
    </div>
    {text}
  </button>
);


export default function ExerciseFilterSidebar({ filterOptions, onFilterChange, sortBy, onSortChange }) {
  return (
    <aside className="animate-slide-in" style={{ animationDelay: '0.3s' }}>
      <div className="card card-elevated sticky top-8">
        <h3 className="mb-4 text-xl flex items-center gap-2">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="4" y1="21" x2="4" y2="14" />
            <line x1="4" y1="10" x2="4" y2="3" />
            <line x1="12" y1="21" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12" y2="3" />
            <line x1="20" y1="21" x2="20" y2="16" />
            <line x1="20" y1="12" x2="20" y2="3" />
          </svg>
          Filtry
        </h3>

        {/* <<< ULEPSZONE FILTRY (KARTY/PRZYCISKI) >>> */}
        <div className="flex flex-col gap-3">
          <FilterButton
            text="Ulubione"
            isActive={filterOptions.favorites}
            onClick={() => onFilterChange('favorites')}
          />
          <FilterButton
            text="Rankingowe"
            isActive={filterOptions.ranked}
            onClick={() => onFilterChange('ranked')}
          />
          <FilterButton
            text="Moje prywatne"
            isActive={filterOptions.my_private}
            onClick={() => onFilterChange('my_private')}
          />
        </div>

        <div className="divider" />

        <div>
          <label className="form-label text-xs uppercase tracking-wider text-text-secondary">
            Sortowanie
          </label>
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="select mt-2"
          >
            <option value="-created_at">Najnowsze</option>
            <option value="created_at_asc">Najstarsze</option>
            <option value="title_asc">Tytuł (A-Z)</option>
            <option value="title_desc">Tytuł (Z-A)</option>
            <option value="word_count_desc">Najdłuższe</option>
            <option value="word_count_asc">Najkrótsze</option>
          </select>
        </div>
      </div>
    </aside>
  );
}