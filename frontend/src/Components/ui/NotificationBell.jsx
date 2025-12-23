import React, { useState, useEffect, useRef } from 'react';

const timeAgo = (dateStr) => {
  const date = new Date(dateStr);
  const seconds = Math.floor((new Date() - date) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " lat temu";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " mies. temu";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " dni temu";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " godz. temu";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " min. temu";
  return "przed chwilą";
};

export default function NotificationBell({ api }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const dropdownRef = useRef(null);
  const audioRef = useRef(null);
  const previousCountRef = useRef(0);
  const API_BASE_URL = "http://127.0.0.1:8000";

  const playNotificationSound = () => {
    try {
      if (!audioRef.current) {
        console.warn("Audio ref nie istnieje");
        return;
      }

      audioRef.current.load();
      audioRef.current.volume = 0.5;
      audioRef.current.currentTime = 0;
      
      const playPromise = audioRef.current.play();

      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log("Dźwięk powiadomienia odtworzony");
          })
          .catch(err => {
            console.warn("Autoplay zablokowany:", err);
          });
      }
    } catch (err) {
      console.error("Błąd odtwarzania dźwięku:", err);
    }
  };

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await api.get('/notifications/');

      const newUnreadCount = res.data.filter(n => !n.read).length;

      if (previousCountRef.current < newUnreadCount && previousCountRef.current !== 0) {
        playNotificationSound();
      }

      previousCountRef.current = newUnreadCount;
      setNotifications(res.data);
      setUnreadCount(newUnreadCount);
    } catch (err) {
      console.error("Błąd pobierania powiadomień:", err);
      setError("Nie udało się pobrać powiadomień");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (api) {
      fetchNotifications();

      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [api]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAllAsRead = async () => {
    if (unreadCount === 0) return;

    try {
      await api.post('/notifications/mark-all-as-read/');

      setUnreadCount(0);
      previousCountRef.current = 0;
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error("Błąd oznaczania:", err.response?.data || err);
      alert("Nie udało się oznaczyć powiadomień jako przeczytane");
    }
  };

  const handleToggle = () => {
    setIsOpen(prev => !prev);
    if (!isOpen && unreadCount > 0) {
      markAllAsRead();
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <audio
        ref={audioRef}
        src="/notifications.mp3"
        preload="auto"
      />

      <button
        onClick={handleToggle}
        className="inline-flex items-center justify-center w-10 h-10 p-2 rounded-lg transition-all bg-transparent text-text-secondary hover:bg-background-surface hover:text-text-primary relative"
        title="Powiadomienia"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2 w-3 h-3 bg-danger rounded-full border-2 border-background-main animate-pulse" />
        )}
      </button>

      {isOpen && (
        <div className="bg-background-elevated shadow-md rounded-lg border border-border absolute top-full right-0 mt-2 w-80 max-w-sm z-50 animate-fade-in p-0 overflow-hidden">
          <div className="p-4 border-b border-border">
            <h4 className="font-semibold text-lg text-text-primary">Powiadomienia</h4>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-text-secondary">Ładowanie...</div>
            ) : error ? (
              <div className="p-4 text-center text-danger">
                {error}
                <button
                  onClick={fetchNotifications}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md font-semibold transition-all text-sm bg-transparent text-text-secondary hover:bg-background-surface hover:text-text-primary mt-2"
                >
                  Spróbuj ponownie
                </button>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-text-secondary">
                Brak nowych powiadomień.
              </div>
            ) : (
              notifications.map(notif => (
                <div
                  key={notif.id}
                  className={`flex items-start gap-3 p-4 border-b border-border transition-colors ${!notif.read ? 'bg-primary/10' : 'hover:bg-background-surface-hover'}`}
                >
                  <div className="flex-1">
                    <p className="text-sm text-text-secondary">
                      {notif.actor && (
                        <strong className="text-text-primary">{notif.actor.username}</strong>
                      )}
                      {' '}{notif.verb}
                    </p>
                    <span className="text-xs text-text-muted">
                      {timeAgo(notif.created_at)}
                    </span>
                  </div>
                  {!notif.read && (
                    <span className="w-2.5 h-2.5 bg-primary rounded-full mt-1.5 flex-shrink-0" title="Nowe" />
                  )}
                </div>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div className="p-2 bg-background-main border-t border-border">
              <button
                onClick={markAllAsRead}
                disabled={unreadCount === 0}
                className="inline-flex items-center justify-center gap-2 w-full px-4 py-2 rounded-md font-semibold transition-all text-sm bg-transparent text-text-secondary hover:bg-background-surface hover:text-text-primary disabled:opacity-50"
              >
                Oznacz wszystkie jako przeczytane
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}