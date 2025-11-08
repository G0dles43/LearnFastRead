import React, { useState, useEffect, useRef, useCallback } from 'react'; // Dodano useCallback
import { useNavigate } from 'react-router-dom';

export default function Profile({ api }) {
  const navigate = useNavigate();
  const token = localStorage.getItem("access");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Stan na oryginalne dane (niezmieniane)
  const [originalData, setOriginalData] = useState({ username: '', email: '', has_usable_password: false });
  // Stan na dane formularza (zmieniane przez użytkownika)
  const [username, setUsername] = useState('');
  const [avatarFile, setAvatarFile] = useState(null); // Tu trzymamy tylko nowy plik

  const [avatarPreview, setAvatarPreview] = useState(null);
  const [userLoading, setUserLoading] = useState(false);
  const [userError, setUserError] = useState('');
  const [userSuccess, setUserSuccess] = useState('');
  const fileInputRef = useRef(null);

  // Stan dla formularza hasła (bez zmian)
  const [passwordData, setPasswordData] = useState({ old_password: '', new_password1: '', new_password2: '' });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  const API_BASE_URL = "http://127.0.0.1:8000";

  // === NOWA, OSOBNA FUNKCJA DO POBIERANIA DANYCH ===
  // Używamy useCallback, aby móc ją bezpiecznie wywołać w useEffect i po zapisie
  const fetchUserData = useCallback(async () => {
    if (!api) return;
    try {
      const res = await api.get("/auth/user/");
      
      setOriginalData({
        username: res.data.username,
        email: res.data.email,
        has_usable_password: res.data.has_usable_password,
      });
      setUsername(res.data.username); 
      
      // === KLUCZOWA ZMIANA (Cache-Busting) ===
      // Dodajemy losowy parametr '?v=' do URL-a awatara.
      // To zmusza przeglądarkę, aby za każdym razem pobrała obrazek
      // na nowo, zamiast wczytywać stary z pamięci cache.
      const avatarUrl = API_BASE_URL + res.data.avatar + '?v=' + new Date().getTime();
      setAvatarPreview(avatarUrl);
      // === KONIEC ZMIANY ===

    } catch (err) {
      console.error("Błąd pobierania danych użytkownika:", err);
      setError("Nie udało się pobrać danych profilu.");
    } finally {
      setLoading(false);
    }
  }, [api, navigate]);
  // === KONIEC NOWEJ FUNKCJI ===


  // Pobieranie danych użytkownika przy pierwszym ładowaniu
  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    setLoading(true);
    fetchUserData(); // Wywołujemy naszą nową funkcję
  }, [token, navigate, fetchUserData]); // Dodajemy fetchUserData do zależności


  // Obsługa wyboru pliku awatara (bez zmian)
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file); // Zapisujemy plik w stanie
      // Tworzenie lokalnego podglądu obrazka
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Wysyłanie formularza DANYCH UŻYTKOWNIKA (zmienione)
  const handleUserSubmit = async (e) => {
    e.preventDefault();
    setUserLoading(true);
    setUserError('');
    setUserSuccess('');

    const formData = new FormData();
    let dataChanged = false;

    // 1. Sprawdź, czy username się zmienił
    if (username !== originalData.username) {
      formData.append('username', username);
      dataChanged = true;
    }

    // 2. Sprawdź, czy wybrano nowy awatar
    if (avatarFile) {
      formData.append('avatar', avatarFile);
      dataChanged = true;
    }

    // 3. Jeśli nic się nie zmieniło, nie wysyłaj zapytania
    if (!dataChanged) {
      setUserSuccess('Nie wprowadzono żadnych zmian.');
      setUserLoading(false);
      return;
    }

    try {
      // Wciąż wysyłamy PATCH
      await api.patch("/auth/user/", formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setUserSuccess('Profil zaktualizowany!');
      
      // === KLUCZOWA ZMIANA ===
      // Nie ufamy odpowiedzi z 'PATCH'. Zamiast tego...
      // 1. Czyścimy plik z pamięci
      setAvatarFile(null);
      // 2. Mówimy frontendowi, aby OD NOWA pobrał dane z serwera.
      // To da nam 100% pewności, że mamy nowy URL awatara.
      await fetchUserData(); 
      // === KONIEC ZMIANY ===

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

  // Obsługa zmiany pól w formularzu hasła (bez zmian)
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  // Wysyłanie formularza ZMIANY HASŁA (bez zmian)
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
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="spinner"></div>
    </div>
  );

  if (error) return (
     <div className="page-wrapper flex items-center justify-center">
        <div className="card card-elevated p-8 bg-danger/10 border-danger text-center">
            <h2 className="text-3xl font-bold text-danger mb-4">Błąd</h2>
            <p className="text-lg text-text-secondary">{error}</p>
        </div>
    </div>
  );

  return (
    <div className="page-wrapper">
      <div className="container" style={{ maxWidth: '900px' }}>
        {/* Header (bez zmian) */}
        <header className="flex items-center justify-between mb-8 animate-fade-in">
          <div>
            <h1 className="text-gradient mb-2">Edytuj Profil</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
              Zarządzaj swoimi danymi i ustawieniami konta.
            </p>
          </div>
          <button className="btn btn-secondary" onClick={() => navigate("/dashboard")}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Powrót
          </button>
        </header>

        {/* Formularz Danych Użytkownika */}
        <div className="card card-elevated animate-fade-in mb-8" style={{ animationDelay: '0.1s' }}>
          <form onSubmit={handleUserSubmit}>
            <h2 className="text-2xl font-bold mb-6">Dane Publiczne</h2>
            
            {userError && <div className="badge badge-danger mb-4 p-3 w-full">{userError}</div>}
            {userSuccess && <div className="badge badge-success mb-4 p-3 w-full">{userSuccess}</div>}

            <div className="flex flex-col md:flex-row items-center gap-8 mb-6">
              {/* Sekcja Awatara (bez zmian) */}
              <div className="flex flex-col items-center">
                <img 
                  src={avatarPreview || `${API_BASE_URL}/media/avatars/default.png`} 
                  alt="Avatar"
                  className="w-32 h-32 rounded-full object-cover border-4 border-border-light mb-4"
                  onError={(e) => { e.target.src = `${API_BASE_URL}/media/avatars/default.png` }} // Fallback
                />
                <input 
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                />
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => fileInputRef.current.click()}
                >
                  Zmień awatar
                </button>
              </div>
              
              {/* Sekcja Pól Tekstowych (bez zmian) */}
              <div className="flex-1 w-full">
                <div className="form-group mb-6">
                  <label className="form-label">Nazwa użytkownika</label>
                  <input
                    type="text"
                    name="username"
                    value={username} 
                    onChange={(e) => setUsername(e.target.value)}
                    className="input"
                    required
                  />
                </div>
                <div className="form-group mb-0">
                  <label className="form-label">Adres e-mail (Tylko do odczytu)</label>
                  <input
                    type="email"
                    name="email"
                    value={originalData.email}
                    className="input"
                    readOnly
                    disabled
                  />
                  <span className="form-hint">E-mail nie może być zmieniony po rejestracji.</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button type="submit" className="btn btn-primary" disabled={userLoading}>
                {userLoading ? <div className="spinner-small"></div> : 'Zapisz zmiany profilu'}
              </button>
            </div>
          </form>
        </div>

        {/* Formularz Zmiany Hasła (warunkowy) */}
        {originalData.has_usable_password && (
          <div className="card card-elevated animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <form onSubmit={handlePasswordSubmit}>
              <h2 className="text-2xl font-bold mb-6">Zmień Hasło</h2>
              
              {passwordError && <div className="badge badge-danger mb-4 p-3 w-full">{passwordError}</div>}
              {passwordSuccess && <div className="badge badge-success mb-4 p-3 w-full">{passwordSuccess}</div>}

              <div className="form-group">
                <label className="form-label">Stare hasło</label>
                <input
                  type="password"
                  name="old_password"
                  value={passwordData.old_password}
                  onChange={handlePasswordChange}
                  className="input"
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="form-group">
                  <label className="form-label">Nowe hasło</label>
                  <input
                    type="password"
                    name="new_password1"
                    value={passwordData.new_password1}
                    onChange={handlePasswordChange}
                    className="input"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Powtórz nowe hasło</label>
                  <input
                    type="password"
                    name="new_password2"
                    value={passwordData.new_password2}
                    onChange={handlePasswordChange}
                    className="input"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end mt-4">
                <button type="submit" className="btn btn-primary" disabled={passwordLoading}>
                  {passwordLoading ? <div className="spinner-small"></div> : 'Zmień hasło'}
                </button>
              </div>
            </form>
          </div>
        )}
        
      </div>
    </div>
  );
}