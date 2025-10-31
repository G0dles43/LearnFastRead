import React from "react";
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, rgba(15, 15, 30, 0.97) 0%, rgba(26, 26, 46, 0.97) 100%), url("/3.png")',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed'
    }}>
      {/* Hero Section */}
      <div style={{ 
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Animated background elements */}
        <div style={{
          position: 'absolute',
          top: '20%',
          right: '10%',
          width: '400px',
          height: '400px',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)',
          borderRadius: '50%',
          animation: 'float 6s ease-in-out infinite',
          pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute',
          bottom: '10%',
          left: '5%',
          width: '300px',
          height: '300px',
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 70%)',
          borderRadius: '50%',
          animation: 'float 8s ease-in-out infinite reverse',
          pointerEvents: 'none'
        }} />

        <div className="container">
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
            gap: '4rem',
            alignItems: 'center'
          }}>
            {/* Left Content */}
            <div className="animate-fade-in">
              <div style={{ marginBottom: '2rem' }}>
                <div className="badge badge-primary" style={{ marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                  </svg>
                  #1 Aplikacja do szybkiego czytania
                </div>
                <h1 style={{ 
                  fontSize: '4rem', 
                  fontWeight: 800, 
                  lineHeight: 1.1,
                  marginBottom: '1.5rem',
                  background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>
                  Fast Reader
                </h1>
                <p style={{ 
                  fontSize: '1.5rem', 
                  color: 'var(--text-secondary)',
                  marginBottom: '2.5rem',
                  lineHeight: 1.6
                }}>
                  Czytaj 3x szybciej z pełnym zrozumieniem. Rozwijaj swoje umiejętności i rywalizuj z innymi.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginBottom: '3rem' }}>
                <Link to="/register" className="btn btn-primary btn-lg" style={{ fontSize: '1.1rem', padding: '1rem 2.5rem' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                    <circle cx="8.5" cy="7" r="4"/>
                    <line x1="20" y1="8" x2="20" y2="14"/>
                    <line x1="23" y1="11" x2="17" y2="11"/>
                  </svg>
                  Zacznij za darmo
                </Link>
                <Link to="/login" className="btn btn-outline btn-lg" style={{ fontSize: '1.1rem', padding: '1rem 2.5rem' }}>
                  Zaloguj się
                </Link>
              </div>

              {/* Stats */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(3, 1fr)', 
                gap: '1.5rem',
                padding: '2rem',
                background: 'var(--bg-surface)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border)'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.25rem', color: 'var(--primary)' }}>
                    ~450
                  </div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    Średnie WPM
                  </div>
                </div>
                <div style={{ textAlign: 'center', borderLeft: '1px solid var(--border)', borderRight: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.25rem', color: 'var(--secondary)' }}>
                    +120%
                  </div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    Wzrost prędkości
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.25rem', color: 'var(--warning)' }}>
                    2-3x
                  </div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    Szybciej
                  </div>
                </div>
              </div>
            </div>

            {/* Right Content - Feature Cards */}
            <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div className="card card-elevated" style={{ 
                  padding: '2rem',
                  border: '2px solid transparent',
                  transition: 'var(--transition)',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'transparent'}
                >
                  <div style={{ display: 'flex', gap: '1.5rem' }}>
                    <div style={{
                      width: '64px',
                      height: '64px',
                      flexShrink: 0,
                      borderRadius: 'var(--radius-lg)',
                      background: 'linear-gradient(135deg, var(--primary), var(--primary-light))',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
                    }}>
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                      </svg>
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.75rem' }}>
                        Technika RSVP
                      </h3>
                      <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                        Rapid Serial Visual Presentation - prezentacja słów w stałym tempie eliminuje regresję wzroku
                      </p>
                    </div>
                  </div>
                </div>

                <div className="card card-elevated" style={{ 
                  padding: '2rem',
                  border: '2px solid transparent',
                  transition: 'var(--transition)',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--secondary)'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'transparent'}
                >
                  <div style={{ display: 'flex', gap: '1.5rem' }}>
                    <div style={{
                      width: '64px',
                      height: '64px',
                      flexShrink: 0,
                      borderRadius: 'var(--radius-lg)',
                      background: 'linear-gradient(135deg, var(--secondary), #a78bfa)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)'
                    }}>
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                        <path d="M3 3v18h18"/>
                        <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"/>
                      </svg>
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.75rem' }}>
                        Śledź postępy
                      </h3>
                      <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                        Szczegółowe statystyki WPM, trafności i wykres rozwoju w czasie rzeczywistym
                      </p>
                    </div>
                  </div>
                </div>

                <div className="card card-elevated" style={{ 
                  padding: '2rem',
                  border: '2px solid transparent',
                  transition: 'var(--transition)',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--warning)'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'transparent'}
                >
                  <div style={{ display: 'flex', gap: '1.5rem' }}>
                    <div style={{
                      width: '64px',
                      height: '64px',
                      flexShrink: 0,
                      borderRadius: 'var(--radius-lg)',
                      background: 'linear-gradient(135deg, var(--warning), #fbbf24)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)'
                    }}>
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
                        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                      </svg>
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.75rem' }}>
                        System rankingowy
                      </h3>
                      <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                        Zdobywaj punkty, odznaki i rywalizuj z innymi użytkownikami na globalnej tablicy
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
      <div style={{ 
        padding: '8rem 0',
        background: 'linear-gradient(180deg, transparent 0%, var(--bg-surface) 50%, transparent 100%)'
      }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
            <h2 style={{ 
              fontSize: '3rem', 
              fontWeight: 700, 
              marginBottom: '1rem',
              background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              Wszystko czego potrzebujesz
            </h2>
            <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)' }}>
              Kompleksowa platforma do nauki szybkiego czytania
            </p>
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '2rem'
          }}>
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
                className="card card-elevated animate-fade-in"
                style={{ 
                  padding: '2rem',
                  textAlign: 'center',
                  animationDelay: `${idx * 0.1}s`,
                  border: '2px solid transparent',
                  transition: 'var(--transition)'
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'transparent'}
              >
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
                  {feature.icon}
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.75rem' }}>
                  {feature.title}
                </h3>
                <p style={{ color: 'var(--text-secondary)' }}>
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div style={{ padding: '6rem 0' }}>
        <div className="container">
          <div className="card card-elevated" style={{
            padding: '4rem',
            textAlign: 'center',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(139, 92, 246, 0.05))',
            border: '2px solid rgba(99, 102, 241, 0.3)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: '-50px',
              right: '-50px',
              width: '200px',
              height: '200px',
              background: 'radial-gradient(circle, rgba(99, 102, 241, 0.2) 0%, transparent 70%)',
              borderRadius: '50%'
            }} />
            
            <h2 style={{ 
              fontSize: '2.5rem', 
              fontWeight: 700, 
              marginBottom: '1rem',
              position: 'relative',
              zIndex: 1
            }}>
              Gotowy na rozwój?
            </h2>
            <p style={{ 
              fontSize: '1.25rem', 
              color: 'var(--text-secondary)',
              marginBottom: '2rem',
              position: 'relative',
              zIndex: 1
            }}>
              Dołącz do tysięcy użytkowników już dziś
            </p>
            <Link 
              to="/register" 
              className="btn btn-primary btn-lg"
              style={{ 
                fontSize: '1.1rem', 
                padding: '1rem 3rem',
                position: 'relative',
                zIndex: 1
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                <circle cx="8.5" cy="7" r="4"/>
                <line x1="20" y1="8" x2="20" y2="14"/>
                <line x1="23" y1="11" x2="17" y2="11"/>
              </svg>
              Rozpocznij teraz - 100% darmowe
            </Link>
          </div>
        </div>
      </div>

      <style>
        {`
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-20px); }
          }
        `}
      </style>
    </div>
  );
}