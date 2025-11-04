import React from "react";
import { useNavigate } from "react-router-dom";

export default function ExerciseCard({ 
  exercise, 
  loggedInUserId, 
  onStart, 
  onToggleFavorite, 
  onDelete, 
  animationDelay,
  isAdmin
}) {
  const { 
    id, 
    title, 
    created_by_is_admin, 
    is_ranked, 
    user_attempt_status, 
    is_public, 
    word_count, 
    created_by,
    created_by_id,
    is_favorite
  } = exercise;

  const navigate = useNavigate();

  const isOwner = loggedInUserId && loggedInUserId === created_by_id;
  const canModify = isOwner || isAdmin;

  return (
    <div
      className="card card-elevated animate-fade-in flex flex-col justify-between"
      style={{ animationDelay: animationDelay, minHeight: '200px' }}
    >
      {/* Górna część karty */}
      <div>
        <div className="flex items-center gap-3 mb-3 flex-wrap">
          <h3 className="text-xl font-semibold mt-3">
            {title}
          </h3>

          {is_ranked ? (
            <>
              {user_attempt_status === 'training_cooldown' ? (
                <span className="badge badge-primary">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-1">
                    <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0118.8-4.3M22 12.5a10 10 0 01-18.8 4.2" />
                  </svg>
                  TRENING (Cooldown)
                </span>
              ) : (
                <span className="badge badge-warning">RANKING</span>
              )}
            </>
          ) : (
            <>
              {is_public ? (
                <span className="badge badge-primary">PUBLICZNE</span>
              ) : (
                <span className="badge bg-[rgba(100,116,139,0.15)] text-text-secondary border border-border">
                  PRYWATNE
                </span>
              )}
            </>
          )}
        </div>

        <div className="flex items-center gap-6 text-text-secondary text-sm">
          <span className="flex items-center gap-1.5">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
            </svg>
            {word_count} słów
          </span>
          {created_by && (
            <span className="flex items-center gap-1.5">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              {created_by}
            </span>
          )}
        </div>
      </div>

      {/* Dolna część karty (przyciski) */}
      <div className="flex gap-3 items-center mt-6 justify-end">
        <button
          className="btn btn-ghost btn-sm min-w-[40px] p-2"
          onClick={() => onToggleFavorite(id)}
          style={{ color: is_favorite ? 'var(--warning)' : 'var(--text-secondary)' }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill={is_favorite ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
          </svg>
        </button>

        {canModify && (
          <>
            <button
              className="btn btn-ghost btn-sm min-w-[40px] p-2 text-secondary"
              title="Edytuj ćwiczenie"
              onClick={() => navigate(`/edit-exercise/${id}`)}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>
              </svg>
            </button>
            
            <button
              className="btn btn-ghost btn-sm min-w-[40px] p-2 text-danger"
              title="Usuń ćwiczenie"
              onClick={() => onDelete(id)}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
              </svg>
            </button>
          </>
        )}

        <button
          className="btn btn-primary"
          onClick={() => onStart(exercise)}
          style={{ minWidth: '120px' }}
        >
          Rozpocznij
        </button>
      </div>
    </div>
  );
}