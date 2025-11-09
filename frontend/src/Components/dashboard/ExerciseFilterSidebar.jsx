import React from "react";

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
    <div className={`
      w-5 h-5 rounded-md border-2 
      ${isActive
        ? 'bg-primary border-primary'
        : 'border-border-light'
      }
      flex items-center justify-center transition-all
    `}>
      {isActive && (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" strokeWidth="3" className="stroke-white">
          <path d="M20 6L9 17l-5-5" />
        </svg>
      )}
    </div>
    {text}
  </button>
);


export default function ExerciseFilterSidebar({ filterOptions, onFilterChange, sortBy, onSortChange }) {
  return (
    <aside className="animate-slide-in [animation-delay:0.3s]">
      <div className="bg-background-elevated shadow-md rounded-lg border border-border p-6 sticky top-8">
        <h3 className="mb-4 text-xl font-semibold flex items-center gap-2 text-text-primary">
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

        <div className="h-px bg-border my-6" />

        <div>
          <label className="block font-semibold text-xs uppercase tracking-wider text-text-secondary mb-2">
            Sortowanie
          </label>
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="block w-full rounded-md border-2 border-border bg-background-main px-4 py-3.5 text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 mt-2"
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