import React from "react";

const getMedalIcon = (rank) => {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  if (typeof rank !== 'number') return "?";
  return rank;
};

const getRankBadgeClasses = (rank) => {
  if (rank === 1) {
    return 'bg-gradient-to-br from-yellow-400 to-orange-500 shadow-lg shadow-yellow-400/30 text-white';
  }
  if (rank === 2) {
    return 'bg-gradient-to-br from-gray-300 to-gray-400 shadow-lg shadow-gray-300/30 text-gray-800';
  }
  if (rank === 3) {
    return 'bg-gradient-to-br from-orange-400 to-yellow-600 shadow-lg shadow-orange-400/30 text-white';
  }
  return 'bg-background-elevated shadow-transparent text-text-primary';
};

export default function LeaderboardTable({ users, onFollowToggle, followingIds, currentUserId }) {
  const API_BASE_URL = "http://127.0.0.1:8000";

  if (users.length === 0) {
    return (
      <div className="text-center py-20 px-6 bg-background-surface rounded-lg border border-border">
        <svg width="80" height="80" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" className="mx-auto mb-6 stroke-text-muted">
          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
        </svg>
        <h3 className="text-2xl mb-2">Ranking jest pusty!</h3>
        <p className="text-text-secondary">
          Nie ma tu jeszcze żadnych wyników.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-background-elevated shadow-md rounded-lg border border-border overflow-hidden p-0">
      <div className="overflow-x-auto">
        <div className="min-w-[900px]">
          <div className="grid grid-cols-[80px_2fr_1fr_1fr_1fr_1fr_1.5fr] gap-4 p-4 border-b border-border text-text-secondary uppercase text-xs font-semibold">
            <span>Pozycja</span>
            <span>Użytkownik</span>
            <span className="text-center">Punkty</span>
            <span className="text-center">Śr. WPM</span>
            <span className="text-center">Trafność</span>
            <span className="text-center">Ukończone</span>
            <span className="text-right">Akcja</span>
          </div>

          {users.map((user) => (
            <div
              key={user.id}
              className="grid grid-cols-[80px_2fr_1fr_1fr_1fr_1fr_1.5fr] gap-4 items-center p-4 border-b border-border transition-colors hover:bg-background-surface-hover"
            >
              <div
                className={`w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold ${getRankBadgeClasses(user.rank)}`}
              >
                {getMedalIcon(user.rank)}
              </div>

              <div className="flex items-center gap-3">
                <img
                  src={user.avatar_url || `${API_BASE_URL}/media/avatars/default.png`}
                  alt={`${user.username} avatar`}
                  className="w-12 h-12 rounded-full object-cover border-2 border-border"
                  onError={(e) => {
                    e.target.src = `${API_BASE_URL}/media/avatars/default.png`
                  }}
                />
                <div className="flex flex-col">
                  <span className="text-lg font-semibold text-text-primary">{user.username}</span>
                  {user.id === currentUserId && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-primary/15 text-primary-light border border-primary/30 w-fit">
                      TY
                    </span>
                  )}
                </div>
              </div>

              <div className="text-center text-lg font-bold text-warning">{user.total_points}</div>
              <div className="text-center text-lg text-text-primary">{user.average_wpm}</div>
              <div className="text-center text-lg text-success">{user.average_accuracy}%</div>
              <div className="text-center text-lg text-text-primary">{user.exercises_completed}</div>

              <div className="text-right">
                {user.id !== currentUserId && (
                  <button
                    onClick={() => onFollowToggle(user.id, followingIds.includes(user.id))}
                    className={followingIds.includes(user.id)
                      ? "inline-flex items-center justify-center gap-2 px-6 py-3 rounded-md font-semibold transition-all bg-background-surface text-text-primary border border-border-light hover:bg-background-surface-hover hover:border-primary"
                      : "inline-flex items-center justify-center gap-2 px-6 py-3 rounded-md font-semibold transition-all text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 bg-gradient-to-r from-primary to-primary-light"
                    }
                  >
                    {followingIds.includes(user.id) ? 'Obserwujesz' : 'Obserwuj'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}