import React from "react";
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background-main/95 to-background-surface/95 bg-[url('/3.png')] bg-cover bg-center bg-fixed text-text-primary">
      
      {/* Hero Section */}
      <div className="min-h-screen flex items-center relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute top-[20%] right-[10%] w-[400px] h-[400px] bg-[radial-gradient(circle,theme(colors.primary.DEFAULT)_/_0.15)_0%,transparent_70%)] rounded-full animate-float pointer-events-none" style={{ animationDuration: '6s' }} />
        <div className="absolute bottom-[10%] left-[5%] w-[300px] h-[300px] bg-[radial-gradient(circle,theme(colors.secondary)_/_0.15)_0%,transparent_70%)] rounded-full animate-float pointer-events-none" style={{ animationDuration: '8s', animationDirection: 'reverse' }} />

        <div className="mx-auto w-full max-w-[1400px] px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            
            {/* Left Content */}
            <div className="animate-fade-in">
              <div className="mb-8">
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold rounded-full bg-primary/15 text-primary-light border border-primary/30 mb-6">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                  </svg>
                  #1 Aplikacja do nauki szybkiego czytania
                </div>
                <h1 className="text-5xl lg:text-7xl font-extrabold leading-tight mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Fast Reader
                </h1>
                <p className="text-2xl text-text-secondary mb-10 leading-relaxed">
                  Czytaj 3x szybciej z pełnym zrozumieniem. Rozwijaj swoje umiejętności i rywalizuj z innymi.
                </p>
              </div>

              <div className="flex gap-4 mb-12">
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center gap-2 px-10 py-4 rounded-md font-semibold transition-all text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 bg-gradient-to-r from-primary to-primary-light text-lg"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                    <circle cx="8.5" cy="7" r="4" />
                    <line x1="20" y1="8" x2="20" y2="14" />
                    <line x1="23" y1="11" x2="17" y2="11" />
                  </svg>
                  Zacznij za darmo
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center px-10 py-4 rounded-md font-semibold transition-all bg-transparent border-2 border-primary text-primary hover:bg-primary hover:text-white text-lg"
                >
                  Zaloguj się
                </Link>
              </div>

              <div className="grid grid-cols-3 gap-6 p-8 bg-background-surface rounded-lg border border-border">
                <div className="text-center">
                  <div className="text-2xl lg:text-3xl font-bold mb-1 text-primary">
                    3 Tryby
                  </div>
                  <div className="text-sm text-text-secondary">
                    RSVP, Highlight, Chunking
                  </div>
                </div>
                <div className="text-center border-l border-r border-border px-4">
                  <div className="text-2xl lg:text-3xl font-bold mb-1 text-secondary">
                    Gamifikacja
                  </div>
                  <div className="text-sm text-text-secondary">
                    Ranking, Punkty i Odznaki
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl lg:text-3xl font-bold mb-1 text-warning">
                    Społeczność
                  </div>
                  <div className="text-sm text-text-secondary">
                    Rywalizuj ze znajomymi
                  </div>
                </div>
              </div>
            </div>

            {/* Right Content - Feature Cards */}
            <div className="animate-fade-in [animation-delay:0.2s]">
              <div className="flex flex-col gap-6">
                <div className="bg-background-elevated shadow-md rounded-lg p-8 border-2 border-transparent transition-all hover:border-primary cursor-pointer">
                  <div className="flex gap-6">
                    <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-primary to-primary-light flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary/30">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold mb-3 text-text-primary">
                        Wiele Trybów Czytania
                      </h3>
                      <p className="text-text-secondary leading-relaxed">
                        Wybierz swój styl: klasyczne RSVP, dynamiczne podświetlanie (Highlight) lub czytanie grupami (Chunking).
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-background-elevated shadow-md rounded-lg p-8 border-2 border-transparent transition-all hover:border-secondary cursor-pointer">
                  <div className="flex gap-6">
                    <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-secondary to-purple-400 flex items-center justify-center flex-shrink-0 shadow-lg shadow-secondary/30">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                        <path d="M3 3v18h18" />
                        <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold mb-3 text-text-primary">
                        Śledź Postępy i Zrozumienie
                      </h3>
                      <p className="text-text-secondary leading-relaxed">
                        Szczegółowe statystyki WPM i trafności. Quizy po czytaniu i generator pytań AI sprawdzają, ile pamiętasz.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-background-elevated shadow-md rounded-lg p-8 border-2 border-transparent transition-all hover:border-warning cursor-pointer">
                  <div className="flex gap-6">
                    <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-warning to-yellow-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-warning/30">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
                        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold mb-3 text-text-primary">
                        Rywalizuj i Zdobywaj
                      </h3>
                      <p className="text-text-secondary leading-relaxed">
                        Zdobywaj punkty za ćwiczenia rankingowe, odblokowuj osiągnięcia i pnij się w globalnym rankingu.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-32 bg-gradient-to-b from-transparent via-background-surface to-transparent">
        <div className="mx-auto w-full max-w-[1400px] px-6">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Wszystko czego potrzebujesz
            </h2>
            <p className="text-xl text-text-secondary">
              Kompleksowa platforma do nauki szybkiego czytania
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: '📚', title: 'Własne teksty', desc: 'Import z Wikipedii lub dodaj własne materiały' },
              { icon: '🎯', title: 'Trzy tryby czytania', desc: 'RSVP, Highlight i Chunking - wybierz najlepszy dla siebie' },
              { icon: '⚡', title: 'Dostosuj tempo', desc: 'Od 100 do 1500 WPM - kontroluj prędkość' },
              { icon: '📊', title: 'Analityka', desc: 'Wykresy postępów i szczegółowe statystyki' },
              { icon: '🏅', title: 'Osiągnięcia', desc: 'Zdobywaj odznaki za ukończone cele' },
              { icon: '🌍', title: 'Ranking globalny', desc: 'Porównuj się z użytkownikami z całego świata' }
            ].map((feature, idx) => (
              <div
                key={idx}
                className="bg-background-elevated shadow-md rounded-lg p-8 text-center border-2 border-transparent transition-all hover:border-primary animate-fade-in"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <div className="text-5xl mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-3 text-text-primary">
                  {feature.title}
                </h3>
                <p className="text-text-secondary">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-24">
        <div className="mx-auto w-full max-w-[1400px] px-6">
          <div className="bg-background-elevated shadow-xl rounded-lg p-16 text-center bg-gradient-to-br from-primary/15 to-secondary/[.05] border-2 border-primary/30 relative overflow-hidden">
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-[radial-gradient(circle,theme(colors.primary.DEFAULT)_/_0.2)_0%,transparent_70%)] rounded-full" />
            
            <h2 className="text-5xl font-bold mb-4 relative z-10 text-text-primary">
              Gotowy na rozwój?
            </h2>
            <p className="text-xl text-text-secondary mb-8 relative z-10">
              Dołącz do nowych użytkowników już dziś
            </p>
            <Link
              to="/register"
              className="inline-flex items-center justify-center gap-2 px-12 py-4 rounded-md font-semibold transition-all text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 bg-gradient-to-r from-primary to-primary-light text-lg relative z-10"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                <circle cx="8.5" cy="7" r="4" />
                <line x1="20" y1="8" x2="20" y2="14" />
                <line x1="23" y1="11" x2="17" y2="11" />
              </svg>
              Rozpocznij teraz - 100% darmowe
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}