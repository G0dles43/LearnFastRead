import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
  const [form, setForm] = useState({ username: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await axios.post("http://127.0.0.1:8000/api/login/", form);
      localStorage.setItem("access", res.data.access);
      localStorage.setItem("refresh", res.data.refresh);
      navigate("/dashboard");
    } catch (err) {
      setError("Nieprawidłowa nazwa użytkownika lub hasło");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="page-wrapper"
      style={{ 
        background: 'linear-gradient(135deg, rgba(15, 15, 30, 0.97) 0%, rgba(26, 26, 46, 0.97) 100%), url("/3.png")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh'
      }}
    >
      <div className="container" style={{ maxWidth: '1200px' }}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="animate-slide-in">
            <div style={{ marginBottom: '3rem' }}>
              <h1 className="text-gradient" style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>
                Fast Reader
              </h1>
              <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                Rozwiń umiejętność szybkiego czytania i zwiększ swoją produktywność
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: 'var(--radius-md)',
                  background: 'linear-gradient(135deg, var(--primary), var(--primary-light))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                  </svg>
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                    Zwiększ prędkość czytania
                  </h3>
                  <p style={{ color: 'var(--text-secondary)' }}>
                    Czytaj nawet 3x szybciej z pełnym zrozumieniem tekstu
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: 'var(--radius-md)',
                  background: 'linear-gradient(135deg, var(--secondary), #a78bfa)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <path d="M3 3v18h18"/>
                    <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"/>
                  </svg>
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                    Śledź postępy
                  </h3>
                  <p style={{ color: 'var(--text-secondary)' }}>
                    Szczegółowe statystyki i wykresy rozwoju
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: 'var(--radius-md)',
                  background: 'linear-gradient(135deg, var(--warning), #fbbf24)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                  </svg>
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                    Rywalizuj w rankingach
                  </h3>
                  <p style={{ color: 'var(--text-secondary)' }}>
                    Zdobywaj punkty i porównuj się z innymi
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right side - Form */}
          <div className="card card-elevated animate-fade-in" style={{ animationDelay: '0.2s', padding: '2.5rem' }}>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                Witaj z powrotem
              </h2>
              <p style={{ color: 'var(--text-secondary)' }}>
                Zaloguj się do swojego konta
              </p>
            </div>

            {error && (
              <div style={{
                padding: '1rem',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid var(--danger)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--danger)',
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="form-group">
                <label className="form-label">Nazwa użytkownika</label>
                <input
                  name="username"
                  type="text"
                  value={form.username}
                  onChange={handleChange}
                  placeholder="Wpisz swoją nazwę..."
                  required
                  className="input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Hasło</label>
                <input
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Wpisz swoje hasło..."
                  required
                  className="input"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-primary btn-lg"
                style={{ width: '100%', marginTop: '1rem' }}
              >
                {isLoading ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }}></div>
                    <span>Logowanie...</span>
                  </div>
                ) : (
                  'Zaloguj się'
                )}
              </button>
            </form>

            <div style={{ marginTop: '2rem', textAlign: 'center' }}>
              <p style={{ color: 'var(--text-secondary)' }}>
                Nie masz jeszcze konta?{" "}
                <Link 
                  to="/register" 
                  style={{ 
                    color: 'var(--primary)', 
                    fontWeight: 600,
                    textDecoration: 'none'
                  }}
                >
                  Zarejestruj się
                </Link>
              </p>
            </div>

            <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
              <Link 
                to="/" 
                className="btn btn-ghost btn-sm"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
                Powrót do strony głównej
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}