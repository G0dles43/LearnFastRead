import React from 'react';
import { Link } from 'react-router-dom';

export default function CollectionList({ collections, loading }) {

  if (loading) {
    return (
      <div className="mb-12">
        <div className="h-8 w-1/3 bg-background-surface rounded mb-4 animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-40 bg-background-surface rounded-md animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (collections.length === 0) {
    return null;
  }

  return (
    <div className="mb-12 animate-fade-in [animation-delay:0.4s]">
      <h2 className="text-3xl font-bold mb-6">Polecane Kolekcje</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {collections.map(collection => (
          <Link
            to={`/collections/${collection.slug}`}
            key={collection.id}
            className="block bg-background-surface rounded-md shadow-md p-6 flex items-start gap-5 
                       border-2 border-transparent hover:border-primary 
                       transition-all cursor-pointer group"
          >
            <div className="text-5xl mt-1 opacity-80 group-hover:opacity-100 transition-opacity">
              {collection.icon_name}
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                {collection.title}
              </h3>
              <p className="text-text-secondary text-sm mb-4 line-clamp-2">
                {collection.description || "Brak opisu"}
              </p>

              <div className="flex items-center gap-4 text-sm text-text-secondary">
                <span className="flex items-center gap-1.5">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
                  </svg>
                  {collection.exercise_count} tekstów
                </span>
                <span className="flex items-center gap-1.5">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 6v6l4 2" />
                  </svg>
                  ~{Math.round(collection.total_words / 250)} min
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}