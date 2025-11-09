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
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background-main via-background-surface to-background-elevated text-text-primary">
        <div className="bg-background-elevated shadow-md rounded-lg border border-border animate-fade-in max-w-[500px] p-12 text-center">
          <div className="w-20 h-20 mx-auto mb-8 rounded-full bg-gradient-to-br from-success to-green-600 flex items-center justify-center text-4xl text-white">
            ✓
          </div>
          <h2 className="text-3xl font-bold mb-4 text-text-primary">
            Rejestracja udana!
          </h2>
          <p className="text-text-secondary mb-8">
            Przekierowywanie do logowania...
          </p>
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background-main via-background-surface to-background-elevated text-text-primary">
      <div className="mx-auto w-full max-w-[1200px] px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

          <div className="bg-background-elevated shadow-md rounded-lg border border-border animate-fade-in p-10">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-2 text-text-primary">
                Stwórz konto
              </h2>
              <p className="text-text-secondary">
                Rozpocznij swoją przygodę z szybkim czytaniem
              </p>
            </div>

            {error && (
              <div className="p-4 bg-danger/10 border border-danger rounded-md text-danger mb-6 flex items-center gap-3">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              <div>
                <label className="block font-semibold text-text-primary mb-2">Nazwa użytkownika</label>
                <input
                  name="username"
                  type="text"
                  value={form.username}
                  onChange={handleChange}
                  placeholder="Wybierz unikalną nazwę..."
                  required
                  className="block w-full rounded-md border-2 border-border bg-background-main px-4 py-3.5 text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div>
                <label className="block font-semibold text-text-primary mb-2">Adres email</label>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="twoj@email.com"
                  required
                  className="block w-full rounded-md border-2 border-border bg-background-main px-4 py-3.5 text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div>
                <label className="block font-semibold text-text-primary mb-2">Hasło</label>
                <input
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Minimum 8 znaków..."
                  required
                  minLength={8}
                  className="block w-full rounded-md border-2 border-border bg-background-main px-4 py-3.5 text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <span className="block mt-2 text-sm text-text-muted">
                  Hasło musi zawierać minimum 8 znaków
                </span>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex items-center justify-center gap-2 w-full px-8 py-4 rounded-md font-semibold transition-all text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 bg-gradient-to-r from-primary to-primary-light text-lg mt-4 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-current"></div>
                    <span>Tworzenie konta...</span>
                  </>
                ) : (
                  'Zarejestruj się'
                )}
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-text-secondary">
                Masz już konto?{" "}
                <Link to="/login" className="text-primary font-semibold no-underline hover:text-primary-hover transition-colors">
                  Zaloguj się
                </Link>
              </p>
            </div>

            <div className="mt-6 text-center">
              <Link to="/" className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md font-semibold transition-all text-sm bg-transparent text-text-secondary hover:bg-background-surface hover:text-text-primary">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
                Powrót do strony głównej
              </Link>
            </div>
          </div>

          <div className="animate-slide-up hidden lg:block">
            <div className="mb-12">
              <h3 className="text-4xl font-bold mb-4 text-text-primary">
                Co zyskujesz?
              </h3>
              <p className="text-lg text-text-secondary">
                Dołącz do społeczności i zacznij rozwijać swoje umiejętności
              </p>
            </div>

            <div className="flex flex-col gap-6">
              <div className="bg-background-surface rounded-lg p-6 border border-border-light">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-md bg-gradient-to-br from-primary to-primary-light flex items-center justify-center flex-shrink-0">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                      <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                      <path d="M22 4L12 14.01l-3-3" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold mb-2 text-text-primary">
                      Trening z RSVP
                    </h4>
                    <p className="text-text-secondary text-sm">
                      Naucz się czytać szybciej dzięki technice prezentacji pojedynczych słów
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-background-surface rounded-lg p-6 border border-border-light">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-md bg-gradient-to-br from-secondary to-purple-400 flex items-center justify-center flex-shrink-0">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                      <path d="M3 3v18h18" />
                      <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold mb-2 text-text-primary">
                      Szczegółowe statystyki
                    </h4>
                    <p className="text-text-secondary text-sm">
                      Monitoruj swoje WPM, trafność i postępy w czasie
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-background-surface rounded-lg p-6 border border-border-light">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-md bg-gradient-to-br from-warning to-yellow-500 flex items-center justify-center flex-shrink-0">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold mb-2 text-text-primary">
                      Rankingi i osiągnięcia
                    </h4>
                    <p className="text-text-secondary text-sm">
                      Zdobywaj punkty, odznaki i konkuruj z innymi użytkownikami
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-success/5 rounded-lg p-6 border border-success">
                <div className="text-center">
                  <p className="text-success font-semibold text-lg">
                    100% Darmowe
                  </p>
                  <p className="text-text-secondary text-sm mt-1">
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