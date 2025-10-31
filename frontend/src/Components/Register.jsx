import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

export default function Register() {
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
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
      await axios.post("http://127.0.0.1:8000/api/register/", form);
      setSuccess(true);
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      if (err.response?.data) {
        const errorMsg = Object.values(err.response.data).flat().join(", ");
        setError(errorMsg || "Błąd rejestracji");
      } else {
        setError("Błąd rejestracji. Spróbuj ponownie.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
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
        <div className="card card-elevated animate-fade-in" style={{ maxWidth: '500px', padding: '3rem', textAlign: 'center' }}>
          <div style={{
            width: '80px',
            height: '80px',
            margin: '0 auto 2rem',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--success), #059669)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2.5rem'
          }}>
            ✓
          </div>
          <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '1rem' }}>
            Rejestracja udana!
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
            Przekierowywanie do logowania...
          </p>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div className="spinner"></div>
          </div>
        </div>
      </div>
    );
  }

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
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', alignItems: 'center' }}>
          {/* Left side - Form */}
          <div className="card card-elevated animate-fade-in" style={{ padding: '2.5rem' }}>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                Stwórz konto
              </h2>
              <p style={{ color: 'var(--text-secondary)' }}>
                Rozpocznij swoją przygodę z szybkim czytaniem
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
                  placeholder="Wybierz unikalną nazwę..."
                  required
                  className="input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Adres email</label>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="twoj@email.com"
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
                  placeholder="Minimum 8 znaków..."
                  required
                  minLength={8}
                  className="input"
                />
                <span className="form-hint">
                  Hasło musi zawierać minimum 8 znaków
                </span>
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
                    <span>Tworzenie konta...</span>
                  </div>
                ) : (
                  'Zarejestruj się'
                )}
              </button>
            </form>

            <div style={{ marginTop: '2rem', textAlign: 'center' }}>
              <p style={{ color: 'var(--text-secondary)' }}>
                Masz już konto?{" "}
                <Link 
                  to="/login" 
                  style={{ 
                    color: 'var(--primary)', 
                    fontWeight: 600,
                    textDecoration: 'none'
                  }}
                >
                  Zaloguj się
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

          {/* Right side - Benefits */}
          <div className="animate-slide-in" style={{ animationDelay: '0.2s' }}>
            <div style={{ marginBottom: '3rem' }}>
              <h3 style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '1rem' }}>
                Co zyskujesz?
              </h3>
              <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)' }}>
                Dołącz do społeczności i zacznij rozwijać swoje umiejętności
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="card" style={{ padding: '1.5rem', border: '1px solid var(--border-light)' }}>
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
                      <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                      <path d="M22 4L12 14.01l-3-3"/>
                    </svg>
                  </div>
                  <div>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                      Trening z RSVP
                    </h4>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                      Naucz się czytać szybciej dzięki technice prezentacji pojedynczych słów
                    </p>
                  </div>
                </div>
              </div>

              <div className="card" style={{ padding: '1.5rem', border: '1px solid var(--border-light)' }}>
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
                    <h4 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                      Szczegółowe statystyki
                    </h4>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                      Monitoruj swoje WPM, trafność i postępy w czasie
                    </p>
                  </div>
                </div>
              </div>

              <div className="card" style={{ padding: '1.5rem', border: '1px solid var(--border-light)' }}>
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
                    <h4 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                      Rankingi i osiągnięcia
                    </h4>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                      Zdobywaj punkty, odznaki i konkuruj z innymi użytkownikami
                    </p>
                  </div>
                </div>
              </div>

              <div className="card" style={{ padding: '1.5rem', border: '1px solid var(--success)', background: 'rgba(16, 185, 129, 0.05)' }}>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ color: 'var(--success)', fontWeight: 600, fontSize: '1.1rem' }}>
                    100% Darmowe
                  </p>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                    Bez ukrytych opłat • Bez limitów • Bez reklam
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}