import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

// Funkcja pomocnicza do formatowania czasu (bez zmian)
const timeAgo = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " lat temu";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " mies. temu";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + (interval < 2 ? " dzień temu" : " dni temu");
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + (interval < 2 ? " godz. temu" : " godz. temu");
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + (interval < 2 ? " min. temu" : " min. temu");
  return "przed chwilą";
};

// Komponent dla pojedynczego wpisu w feedzie (bez zmian)
const ActivityItem = ({ activity }) => {
  const { user, exercise_title, wpm, ranking_points, completed_at, completed_daily_challenge } = activity;

  const createMessage = () => {
    if (completed_daily_challenge) {
      return (
        <>
          <strong className="text-white">{user.username}</strong>
          {` właśnie ukończył `}
          <strong className="text-primary-light">Wyzwanie Dnia</strong>
          {` (${exercise_title}) i zdobył `}
          <strong className="text-warning">{ranking_points} pkt</strong>
          {`! 🏆`}
        </>
      );
    }
    return (
      <>
        <strong className="text-white">{user.username}</strong>
        {` właśnie zdobył `}
        <strong className="text-warning">{ranking_points} pkt</strong>
        {` na ćwiczeniu `}
        <strong className="text-white">{exercise_title}</strong>
        {` (osiągając ${wpm} WPM).`}
      </>
    );
  };

  return (
    <div className="flex items-start gap-4 p-4 border-b border-border last:border-b-0">
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex-shrink-0 flex items-center justify-center font-bold text-lg">
        {user.username.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1">
        <p className="text-sm text-text-secondary leading-relaxed">
          {createMessage()}
        </p>
        <span className="text-xs text-text-muted">{timeAgo(completed_at)}</span>
      </div>
    </div>
  );
};


// Główny komponent Feedu
export default function FriendActivityFeed({ api }) {
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!api) {
      setLoading(false);
      return;
    }

    api.get("friends/feed/")
      .then(res => {
        setFeed(res.data);
      })
      .catch(err => {
        console.error("Błąd pobierania feedu znajomych:", err);
      })
      .finally(() => {
        setLoading(false);
      });

  }, [api]);


  return (
    <div className="card card-elevated p-0 overflow-hidden min-h-[200px]">
      <h3 className="text-xl font-bold p-6 border-b border-border">
        Aktywność Znajomych
      </h3>
      
      {loading ? (
        <div className="p-6 space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 animate-pulse">
              <div className="w-10 h-10 rounded-full bg-background-surface"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-background-surface rounded w-3/4"></div>
                <div className="h-3 bg-background-surface rounded w-1/4"></div>
              </div>
            </div>
          ))}
        </div>
      ) : feed.length > 0 ? (
        <div className="max-h-96 overflow-y-auto">
          {feed.map(activity => (
            <ActivityItem key={activity.id} activity={activity} />
          ))}
        </div>
      ) : (
        <div className="p-6 text-center flex flex-col items-center justify-center min-h-[150px]">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" className="mb-4">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 00-3-3.87"/>
            <path d="M16 3.13a4 4 0 010 7.75"/>
          </svg>
          <p className="text-text-secondary text-sm font-medium">
            Tutaj będzie się wyświetlać historia rankingowa Twoich znajomych.
          </p>
          <p className="text-text-muted text-xs mt-2">
            Znajdź i zaobserwuj użytkowników w zakładce "Ranking", aby zobaczyć ich postępy!
          </p>
        </div>
      )}
    </div>
  );
}