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
    is_ranked,
    user_attempt_status,
    is_public,
    is_today_daily,
    is_daily_candidate,
    scheduled_date,
    word_count,
    created_by,
    created_by_id,
    is_favorite
  } = exercise;

  const navigate = useNavigate();
  const isOwner = loggedInUserId && loggedInUserId === created_by_id;
  const canModify = isOwner || isAdmin;

  const isLockedCandidate = is_daily_candidate && !is_today_daily;

  return (
    <div
      className={`
        group relative flex flex-col justify-between min-h-[200px]
        bg-background-elevated rounded-xl border p-5 transition-all duration-300
        hover:shadow-lg hover:-translate-y-1
        ${is_today_daily 
          ? 'border-emerald-500/50 shadow-emerald-500/10 ring-1 ring-emerald-500/20' 
          : 'border-border hover:border-primary/40'
        }
      `}
      style={{ animationDelay }}
    >
      <div>
        <div className="flex justify-between items-start mb-3">
          <div className="flex flex-wrap gap-2">
            
            {is_today_daily && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] uppercase tracking-wide font-bold rounded-full bg-emerald-500 text-white shadow-sm animate-pulse">
                 🔥 Dziś
              </span>
            )}

            {isAdmin && (
              <>
                {scheduled_date && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-bold rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    📅 {scheduled_date}
                  </span>
                )}
                {is_daily_candidate && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-bold rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    🎲 Pula
                  </span>
                )}
              </>
            )}

            {is_ranked ? (
              user_attempt_status === 'training_cooldown' && !is_today_daily ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-slate-500/10 text-slate-400 border border-slate-500/20">
                  Cooldown
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
                  Ranking
                </span>
              )
            ) : (
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-medium rounded-full border ${
                is_public 
                  ? 'bg-primary/10 text-primary border-primary/20' 
                  : 'bg-background-main text-text-muted border-border'
              }`}>
                {is_public ? 'Publiczne' : 'Prywatne'}
              </span>
            )}
          </div>

          <button
            onClick={(e) => { e.stopPropagation(); onToggleFavorite(id); }}
            className={`p-1.5 rounded-full transition-colors ${
              is_favorite 
                ? 'text-warning bg-warning/10' 
                : 'text-text-muted hover:text-text-primary hover:bg-background-main'
            }`}
          >
            <svg width="18" height="18" fill={is_favorite ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </button>
        </div>

        <h3 className="text-lg font-bold text-text-primary mb-3 leading-snug group-hover:text-primary transition-colors">
          {title}
        </h3>

        <div className="flex items-center gap-4 text-text-secondary text-xs font-medium mb-6">
          <span className="flex items-center gap-1.5 bg-background-main/50 px-2 py-1 rounded-md border border-border/50">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 19.5A2.5 2.5 0 016.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
            </svg>
            {word_count} słów
          </span>
          {created_by && (
            <span className="flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
              </svg>
              {created_by}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 pt-4 border-t border-border/50">
        
        <button
          className={`
            flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all shadow-md
            ${isLockedCandidate 
                ? 'bg-background-main text-text-muted cursor-not-allowed border border-border shadow-none opacity-70' 
                : 'bg-gradient-to-r from-primary to-primary-light text-white hover:shadow-primary/25 hover:-translate-y-0.5'
            }
          `}
          onClick={() => !isLockedCandidate && onStart(exercise)}
          disabled={isLockedCandidate}
          title={isLockedCandidate ? "To ćwiczenie czeka w puli" : "Rozpocznij"}
        >
          {isLockedCandidate ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                W Puli
              </>
          ) : "Rozpocznij"}
        </button>

        {canModify && (
          <div className="flex items-center gap-1">
            <button
              className="p-2 rounded-lg text-text-muted hover:text-primary hover:bg-primary/10 transition-all"
              title="Edytuj"
              onClick={() => navigate(`/edit-exercise/${id}`)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>

            <button
              className="p-2 rounded-lg text-text-muted hover:text-danger hover:bg-danger/10 transition-all"
              title="Usuń"
              onClick={() => onDelete(id)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}