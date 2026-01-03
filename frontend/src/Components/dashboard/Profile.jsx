import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Profile({ api }) {
  const navigate = useNavigate();
  const token = localStorage.getItem("access");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [originalData, setOriginalData] = useState({ 
    username: '', 
    email: '', 
    has_usable_password: false,
    current_streak: 0,
    max_streak: 0 
  });
  const [username, setUsername] = useState('');
  
  const [userLoading, setUserLoading] = useState(false);
  const [userError, setUserError] = useState('');
  const [userSuccess, setUserSuccess] = useState('');

  const [passwordData, setPasswordData] = useState({ old_password: '', new_password1: '', new_password2: '' });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  const fetchUserData = useCallback(async () => {
    if (!api) return;
    try {
      const res = await api.get("/auth/user/");
      const statusRes = await api.get("user/status/");

      setOriginalData({
        username: res.data.username,
        email: res.data.email,
        has_usable_password: res.data.has_usable_password,
        current_streak: statusRes.data.current_streak || 0,
        max_streak: statusRes.data.max_streak || 0,
      });
      setUsername(res.data.username);

    } catch (err) {
      console.error("Błąd pobierania danych użytkownika:", err);
      setError("Nie udało się pobrać danych profilu.");
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    setLoading(true);
    fetchUserData();
  }, [token, navigate, fetchUserData]);

  const handleUserSubmit = async (e) => {
    e.preventDefault();
    setUserLoading(true);
    setUserError('');
    setUserSuccess('');

    const formData = new FormData();
    let dataChanged = false;

    if (username !== originalData.username) {
      formData.append('username', username);
      dataChanged = true;
    }

    if (!dataChanged) {
      setUserSuccess('Nie wprowadzono żadnych zmian.');
      setUserLoading(false);
      return;
    }

    try {
      await api.patch("/auth/user/", formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setUserSuccess('Profil zaktualizowany!');
      await fetchUserData();

    } catch (err) {
      console.error("Błąd aktualizacji profilu:", err.response);
      const data = err.response?.data;
      if (data) {
        let errorMsg = '';
        for (const key in data) {
          if (Array.isArray(data[key])) {
            errorMsg += `${key}: ${data[key].join(' ')} `;
          }
        }
        setUserError(errorMsg.trim() || 'Wystąpił nieznany błąd walidacji.');
      } else {
        setUserError('Wystąpił błąd sieciowy.');
      }
    } finally {
      setUserLoading(false);
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordError('');
    setPasswordSuccess('');

    if (passwordData.new_password1 !== passwordData.new_password2) {
      setPasswordError("Nowe hasła nie są takie same.");
      setPasswordLoading(false);
      return;
    }

    try {
      await api.post("/auth/password/change/", passwordData);
      setPasswordSuccess('Hasło zostało zmienione!');
      setPasswordData({ old_password: '', new_password1: '', new_password2: '' });
    } catch (err) {
      console.error("Błąd zmiany hasła:", err.response);
      const errors = err.response?.data;
      if (errors?.old_password) {
        setPasswordError(errors.old_password.join(' '));
      } else if (errors?.new_password2) {
        setPasswordError(errors.new_password2.join(' '));
      } else {
        setPasswordError('Nie udało się zmienić hasła. Sprawdź poprawność danych.');
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-background-main text-text-primary flex items-center justify-center p-4 md:p-8">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-background-main text-text-primary flex items-center justify-center p-4 md:p-8">
      <div className="bg-background-elevated shadow-md rounded-lg p-8 bg-danger/10 border border-danger text-center">
        <h2 className="text-3xl font-bold text-danger mb-4">Błąd</h2>
        <p className="text-lg text-text-secondary">{error}</p>
      </div>
    </div>
  );

  const getDayWord = (days) => {
    if (days === 1) return 'dzień';
    if ([2, 3, 4].includes(days % 10) && ![12, 13, 14].includes(days % 100)) {
      return 'dni';
    }
    return 'dni';
  };

  return (
    <div className="min-h-screen bg-background-main text-text-primary p-4 md:p-8">
      <div className="mx-auto w-full max-w-[900px]">
        <header className="flex items-center justify-between mb-8 animate-fade-in">
          <div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Twój Profil
            </h1>
            <p className="text-text-secondary text-lg">
              Zarządzaj swoimi danymi i statystykami
            </p>
          </div>
          <button
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-md font-semibold transition-all bg-background-surface text-text-primary border border-border-light hover:bg-background-surface-hover hover:border-primary"
            onClick={() => navigate("/dashboard")}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Powrót
          </button>
        </header>

        {/* Sekcja Statystyk Serii */}
        <div className="bg-background-elevated shadow-md rounded-lg p-6 animate-fade-in mb-8">
          <h2 className="text-2xl font-bold mb-6">Twoje Serie</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-warning/20 to-warning/5 border-2 border-warning/30 rounded-lg p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-warning to-yellow-500 flex items-center justify-center shadow-lg">
                  <img
                    src="/fire.gif"
                    alt="Seria"
                    className="w-10 h-10 object-contain"
                  />
                </div>
                <div>
                  <div className="text-sm text-text-secondary mb-1">Aktualna Seria</div>
                  <div className="text-4xl font-bold text-text-primary">
                    {originalData.current_streak}
                  </div>
                </div>
              </div>
              <p className="text-text-secondary text-sm">
                {originalData.current_streak > 0 
                  ? `Świetnie! ${originalData.current_streak} ${getDayWord(originalData.current_streak)} z rzędu!`
                  : 'Rozpocznij serię, trenując dziś!'
                }
              </p>
            </div>

            <div className="bg-gradient-to-br from-primary/20 to-primary/5 border-2 border-primary/30 rounded-lg p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary-light flex items-center justify-center shadow-lg">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm text-text-secondary mb-1">Najdłuższa Seria</div>
                  <div className="text-4xl font-bold text-text-primary">
                    {originalData.max_streak}
                  </div>
                </div>
              </div>
              <p className="text-text-secondary text-sm">
                {originalData.max_streak > 0
                  ? `Twój rekord: ${originalData.max_streak} ${getDayWord(originalData.max_streak)}!`
                  : 'Zbuduj swoją pierwszą serię!'
                }
              </p>
            </div>
          </div>
        </div>

        <div className="bg-background-elevated shadow-md rounded-lg p-6 animate-fade-in mb-8 [animation-delay:0.1s]">
          <form onSubmit={handleUserSubmit}>
            <h2 className="text-2xl font-bold mb-6">Dane Publiczne</h2>

            {userError && (
              <div className="flex items-center justify-center p-3 w-full rounded-md font-semibold bg-danger/15 text-danger mb-4">
                {userError}
              </div>
            )}
            {userSuccess && (
              <div className="flex items-center justify-center p-3 w-full rounded-md font-semibold bg-success/15 text-success mb-4">
                {userSuccess}
              </div>
            )}

            <div className="mb-6">
              <label className="block font-semibold text-text-primary mb-2">Nazwa użytkownika</label>
              <input
                type="text"
                name="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="block w-full rounded-md border-2 border-border bg-background-main px-4 py-3.5 text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                required
              />
              <span className="block mt-2 text-sm text-text-muted">Zmiana nazwy użytkownika = zmiana loginu</span>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-md font-semibold transition-all text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 bg-gradient-to-r from-primary to-primary-light disabled:opacity-50"
                disabled={userLoading}
              >
                {userLoading ? <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-current"></div> : 'Zapisz zmiany profilu'}
              </button>
            </div>
          </form>
        </div>

        {originalData.has_usable_password && (
          <div className="bg-background-elevated shadow-md rounded-lg p-6 animate-fade-in [animation-delay:0.2s]">
            <form onSubmit={handlePasswordSubmit}>
              <h2 className="text-2xl font-bold mb-6">Zmień Hasło</h2>

              {passwordError && (
                <div className="flex items-center justify-center p-3 w-full rounded-md font-semibold bg-danger/15 text-danger border border-danger/30 mb-4">
                  {passwordError}
                </div>
              )}
              {passwordSuccess && (
                <div className="flex items-center justify-center p-3 w-full rounded-md font-semibold bg-success/15 text-success border border-success/30 mb-4">
                  {passwordSuccess}
                </div>
              )}

              <div>
                <label className="block font-semibold text-text-primary mb-2">Stare hasło</label>
                <input
                  type="password"
                  name="old_password"
                  value={passwordData.old_password}
                  onChange={handlePasswordChange}
                  className="block w-full rounded-md border-2 border-border bg-background-main px-4 py-3.5 text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div>
                  <label className="block font-semibold text-text-primary mb-2">Nowe hasło</label>
                  <input
                    type="password"
                    name="new_password1"
                    value={passwordData.new_password1}
                    onChange={handlePasswordChange}
                    className="block w-full rounded-md border-2 border-border bg-background-main px-4 py-3.5 text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-text-primary mb-2">Powtórz nowe hasło</label>
                  <input
                    type="password"
                    name="new_password2"
                    value={passwordData.new_password2}
                    onChange={handlePasswordChange}
                    className="block w-full rounded-md border-2 border-border bg-background-main px-4 py-3.5 text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end mt-6">
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-md font-semibold transition-all text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 bg-gradient-to-r from-primary to-primary-light disabled:opacity-50"
                  disabled={passwordLoading}
                >
                  {passwordLoading ? <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-current"></div> : 'Zmień hasło'}
                </button>
              </div>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}