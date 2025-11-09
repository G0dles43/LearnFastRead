import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useGoogleLogin } from "@react-oauth/google";

export default function Login({ api }) {
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
      const res = await api.post("/login/", form);
      localStorage.setItem("access", res.data.access);
      localStorage.setItem("refresh", res.data.refresh);
      navigate("/dashboard");
    } catch (err) {
      setError("Nieprawidłowa nazwa użytkownika lub hasło");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLoginSuccess = async (tokenResponse) => {
    setIsLoading(true);
    setError("");
    try {
      const res = await api.post("/auth/google/", {
        access_token: tokenResponse.access_token,
      });

      localStorage.setItem("access", res.data.access);
      localStorage.setItem("refresh", res.data.refresh);
      navigate("/dashboard");

    } catch (err) {
      console.error("Błąd logowania Google:", err);
      setError("Nie udało się zalogować przez Google. Spróbuj ponownie.");
    } finally {
      setIsLoading(false);
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: handleGoogleLoginSuccess,
    onError: () => {
      setError("Logowanie Google nie powiodło się");
    },
  });

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background-main via-background-surface to-background-elevated text-text-primary">
      <div className="mx-auto w-full max-w-[1200px] px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

          <div className="animate-slide-in hidden lg:block">
            <div className="mb-12">
              <h1 className="text-6xl mb-4 font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Fast Reader
              </h1>
              <p className="text-xl text-text-secondary mb-8">
                Rozwiń umiejętność szybkiego czytania i zwiększ swoją produktywność
              </p>
            </div>

            <div className="flex flex-col gap-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-md bg-gradient-to-br from-primary to-primary-light flex items-center justify-center flex-shrink-0">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-text-primary">
                    Zwiększ prędkość czytania
                  </h3>
                  <p className="text-text-secondary">
                    Czytaj nawet 3x szybciej z pełnym zrozumieniem tekstu
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-md bg-gradient-to-br from-secondary to-purple-400 flex items-center justify-center flex-shrink-0">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <path d="M3 3v18h18" />
                    <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-text-primary">
                    Śledź postępy
                  </h3>
                  <p className="text-text-secondary">
                    Szczegółowe statystyki i wykresy rozwoju
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-md bg-gradient-to-br from-warning to-yellow-500 flex items-center justify-center flex-shrink-0">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-text-primary">
                    Rywalizuj w rankingach
                  </h3>
                  <p className="text-text-secondary">
                    Zdobywaj punkty i porównuj się z innymi
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-background-elevated shadow-md rounded-lg border border-border animate-fade-in p-10">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-2 text-text-primary">
                Witaj z powrotem
              </h2>
              <p className="text-text-secondary">
                Zaloguj się do swojego konta
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
                  placeholder="Wpisz swoją nazwę..."
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
                  placeholder="Wpisz swoje hasło..."
                  required
                  className="block w-full rounded-md border-2 border-border bg-background-main px-4 py-3.5 text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex items-center justify-center gap-2 w-full px-8 py-4 rounded-md font-semibold transition-all text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 bg-gradient-to-r from-primary to-primary-light text-lg mt-4 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-current"></div>
                    <span>Logowanie...</span>
                  </>
                ) : (
                  'Zaloguj się'
                )}
              </button>
            </form>

            <div className="flex items-center gap-4 my-6 text-text-muted">
              <div className="flex-1 h-px bg-border"></div>
              <span>LUB</span>
              <div className="flex-1 h-px bg-border"></div>
            </div>

            <button
              onClick={() => googleLogin()}
              disabled={isLoading}
              className="inline-flex items-center justify-center gap-2 w-full px-6 py-3 rounded-md font-semibold transition-all bg-background-surface text-text-primary border border-border-light hover:bg-background-surface-hover hover:border-border-light disabled:opacity-50"
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
                <g fillRule="evenodd">
                  <path d="M20.64 12.2045c0-.6386-.0573-1.2518-.1682-1.8409H12v3.4818h4.8441c-.2086 1.125-.8441 2.0782-1.7964 2.7164v2.2582h2.9086c1.7018-1.5668 2.6877-3.8732 2.6877-6.6155z" fill="#4285F4" />
                  <path d="M12 21c2.43 0 4.4673-.806 5.9564-2.1805l-2.9086-2.2582c-.806.5427-1.8409.8682-2.9932.8682-2.3127 0-4.2659-1.5668-4.9636-3.6659H4.0436v2.2582C5.5327 20.1932 8.56 21 12 21z" fill="#34A853" />
                  <path d="M7.0364 13.7159c-.1841-.5427-.2823-1.1127-.2823-1.7159s.0982-1.1732.2823-1.7159V7.9991H4.0436C3.6568 8.9496 3.4264 9.9841 3.4264 11.0505c0 1.0664.2305 2.1009.6173 3.0505L7.0364 13.716v-.0001z" fill="#FBBC05" />
                  <path d="M12 6.5795c1.3214 0 2.5077.4568 3.4405 1.3482l2.5814-2.5814C16.4632 3.8236 14.43 3 12 3 8.56 3 5.5327 4.8068 4.0436 7.9991L7.0364 10.284c.6977-2.099 2.6509-3.6659 4.9636-3.6659z" fill="#EA4335" />
                </g>
              </svg>
              Zaloguj się przez Google
            </button>

            <div className="mt-8 text-center">
              <p className="text-text-secondary">
                Nie masz jeszcze konta?{" "}
                <Link to="/register" className="text-primary font-semibold no-underline hover:text-primary-hover transition-colors">
                  Zarejestruj się
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
        </div>
      </div>
    </div>
  );
}