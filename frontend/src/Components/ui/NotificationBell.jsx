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
      if (audioRef.current) {
        audioRef.current.volume = 0.5;
        audioRef.current.currentTime = 0;
        const playPromise = audioRef.current.play();
        
        if (playPromise !== undefined) {
          playPromise.catch(err => {
            console.warn("Autoplay zablokowany przez przeglądarkę:", err);
          });
        }
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
      
      console.log("📊 Poprzednia liczba:", previousCountRef.current, "Nowa liczba:", newUnreadCount);
      
      if (previousCountRef.current < newUnreadCount && previousCountRef.current !== 0) {
        console.log("🔔 Odtwarzam dźwięk powiadomienia!");
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
        className="btn btn-ghost p-3 relative"
        title="Powiadomienia"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/>
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2 w-3 h-3 bg-danger rounded-full border-2 border-background-main animate-pulse" />
        )}
      </button>

      {isOpen && (
        <div className="card card-elevated absolute top-full right-0 mt-2 w-80 max-w-sm z-50 animate-fade-in p-0 overflow-hidden">
          <div className="p-4 border-b border-border">
            <h4 className="font-semibold text-lg">Powiadomienia</h4>
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-text-secondary">Ładowanie...</div>
            ) : error ? (
              <div className="p-4 text-center text-danger">
                {error}
                <button 
                  onClick={fetchNotifications}
                  className="btn btn-sm btn-ghost mt-2"
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
                  {notif.actor && (
                    <img 
                      src={API_BASE_URL + (notif.actor.avatar || '/media/avatars/default.png')} 
                      alt={notif.actor.username}
                      className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                      onError={(e) => { e.target.src = `${API_BASE_URL}/media/avatars/default.png` }}
                    />
                  )}
                  <div className="flex-1">
                    <p className="text-sm">
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
                className="btn btn-ghost btn-sm w-full text-text-secondary disabled:opacity-50"
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