import React from "react";
import { Link } from "react-router-dom";

export default function HowItWorks() {
  return (
    <div className="page-wrapper">
      <div className="container" style={{ maxWidth: "900px" }}>
        <header className="flex items-center justify-between mb-8 animate-fade-in">
          <div>
            <h1 className="text-gradient mb-2">Jak to działa?</h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "1.1rem" }}>
              Wszystko, co musisz wiedzieć o trybach, rankingu i punktacji.
            </p>
          </div>
          <Link to="/dashboard" className="btn btn-secondary">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Powrót
          </Link>
        </header>

        <div className="flex flex-col gap-8 animate-fade-in" style={{ animationDelay: '0.1s' }}>

          <div className="card card-elevated">
            <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
              <span className="text-5xl">📖</span>
              <div>
                Podstawy: Trzy Tryby Czytania
                <p className="text-lg text-text-secondary font-normal">Wybierz swój ulubiony styl.</p>
              </div>
            </h2>
            
            <ul className="flex flex-col gap-5">
              <li className="flex items-start gap-4 p-4 rounded-lg bg-[var(--bg-main)] border border-[var(--border)]">
                <span className="text-3xl mt-1">1.</span>
                <div>
                  <h3 className="text-xl font-semibold mb-1">RSVP (Słowo po słowie)</h3>
                  <p className="text-text-secondary">
                    Klasyczna metoda szybkiego czytania. Słowa pojawiają się jedno po drugim na środku ekranu. Eliminuje to ruch gałek ocznych i zmusza mózg do szybszego przetwarzania. Użyj <Link to="/calibrate" className="text-primary font-semibold">Kalibracji</Link>, aby znaleźć swoje idealne tempo.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-4 p-4 rounded-lg bg-[var(--bg-main)] border border-[var(--border)]">
                <span className="text-3xl mt-1">2.</span>
                <div>
                  <h3 className="text-xl font-semibold mb-1">Highlight (Podświetlenie)</h3>
                  <p className="text-text-secondary">
                    Tryb ten pokazuje cały tekst, ale podświetla kolejne słowa w zadanym tempie, prowadząc Twój wzrok. Jest świetny do nauki płynności i utrzymania kontekstu. Wymiary okna możesz zmienić w <Link to="/settings" className="text-primary font-semibold">Ustawieniach</Link>.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-4 p-4 rounded-lg bg-[var(--bg-main)] border border-[var(--border)]">
                <span className="text-3xl mt-1">3.</span>
                <div>
                  <h3 className="text-xl font-semibold mb-1">Chunking (Grupowanie)</h3>
                  <p className="text-text-secondary">
                    Tryb dla zaawansowanych. Zamiast jednego słowa, pokazuje 2, 3 lub więcej słów naraz. Uczy to mózg postrzegania całych fraz, a nie pojedynczych wyrazów. Rozmiar "chunka" zmienisz w <Link to="/settings" className="text-primary font-semibold">Ustawieniach</Link>.
                  </p>
                </div>
              </li>
            </ul>
          </div>

          <div className="card card-elevated">
            <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
              <span className="text-5xl">🏆</span>
              <div>
                Ranking i Punkty (eWPM)
                <p className="text-lg text-text-secondary font-normal">Jak sprawiedliwie liczymy punkty.</p>
              </div>
            </h2>
            
            <h3 className="text-2xl font-bold mb-4">Formuła Punktowa: Liczy się Efektywność</h3>
            <p className="mb-4">
              W naszej aplikacji nie liczy się tylko to, jak szybko "przeklikasz" tekst. Kluczem jest **efektywność**, czyli połączenie szybkości i zrozumienia. Dlatego Twoje punkty to **eWPM** (Efektywne Słowa na Minutę).
            </p>
            <div className="card bg-background-main p-4 my-4">
              <code className="text-lg text-primary-light font-medium">
                Punkty = (Twoje WPM) * (Twoja Trafność %) * (Mnożnik Długości)
              </code>
            </div>
            
            <h3 className="text-2xl font-bold mt-8 mb-4">Mnożnik Długości Tekstu</h3>
            <p className="mb-4 text-text-secondary">
              Nie byłoby sprawiedliwe, gdyby krótki, 200-słowny tekst dawał tyle samo punktów co długi esej na 1000 słów. Dłuższe teksty wymagają większej koncentracji, dlatego są nagradzane mnożnikiem:
            </p>
            
            <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[var(--bg-surface)]">
                  <tr>
                    <th className="p-3 text-sm font-semibold">Liczba słów w tekście</th>
                    <th className="p-3 text-sm font-semibold">Mnożnik Punktów</th>
                    <th className="p-3 text-sm font-semibold">Dlaczego?</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  <tr>
                    <td className="p-3 font-medium">0 - 300</td>
                    <td className="p-3 font-medium">x0.8</td>
                    <td className="p-3 text-text-secondary">Krótkie sprinty (mniejsza premia)</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium">301 - 500</td>
                    <td className="p-3 font-medium text-primary-light">x1.0 (Bazowy)</td>
                    <td className="p-3 text-text-secondary">Standardowa długość</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium">501 - 800</td>
                    <td className="p-3 font-medium">x1.2</td>
                    <td className="p-3 text-text-secondary">Dłuższa koncentracja</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium">801+</td>
                    <td className="p-3 font-medium text-warning">x1.5</td>
                    <td className="p-3 text-text-secondary">Prawdziwe maratony (duża premia)</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="text-2xl font-bold mt-8 mb-4">Zasady Rankingu</h3>
            <ul className="list-disc pl-6 my-4 space-y-4">
              <li>
                <strong className="text-lg text-danger">Próg Zaliczenia: 60%</strong>
                <p className="text-text-secondary">
                  Aby Twój wynik w ogóle został zaliczony do rankingu, musisz osiągnąć minimalny próg **60% poprawnych odpowiedzi** w quizie. Jeśli masz 59% lub mniej, Twój wynik jest anulowany i otrzymujesz 0 punktów. Koniec ze "strzelaniem"!
                </p>
              </li>
              <li>
                <strong className="text-lg text-primary">Cooldown Rankingu: 30 Dni</strong>
                <p className="text-text-secondary">
                  Liczy się Twój **najlepszy** wynik dla danego tekstu. Po zaliczeniu ćwiczenia, przez 30 dni możesz je powtarzać tylko w trybie treningowym (bez quizu). Po 30 dniach możesz spróbować **poprawić swój wynik**. Jeśli będzie lepszy, zastąpi stary.
                </p>
              </li>
              <li>
                <strong className="text-lg text-warning">Wyzwanie Dnia: +50 Punktów</strong>
                <p className="text-text-secondary">
                  Każdego dnia wybierane jest jedno "Wyzwanie Dnia". Za jego pomyślne ukończenie (powyżej 60% trafności) otrzymujesz **bonusowe +50 punktów** do finalnego wyniku.
                </p>
              </li>
            </ul>
          </div>
          
          <div className="card card-elevated">
            <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
              <span className="text-5xl">🔥</span>
              <div>
                Motywacja i Społeczność
                <p className="text-lg text-text-secondary font-normal">Utrzymaj nawyk i rywalizuj.</p>
              </div>
            </h2>
            <ul className="list-disc pl-6 my-4 space-y-4">
              <li>
                <strong className="text-lg text-warning">Dzienna Seria (Streak)</strong>
                <p className="text-text-secondary">
                  Chcemy nagradzać Twój nawyk. Za ukończenie **dowolnego ćwiczenia** (rankingowego lub treningowego) przynajmniej raz dziennie, Twoja seria rośnie. Zobaczysz ją w panelu obok swojego imienia. Nie przerywaj passy!
                </p>
              </li>
              <li>
                <strong className="text-lg text-primary">System Znajomych i Aktywności</strong>
                <p className="text-text-secondary">
                  W zakładce "Ranking" możesz wyszukiwać i **obserwować** innych użytkowników. Odblokowuje to dwie funkcje: "Ranking Znajomych" (prywatna tabela liderów) oraz "Aktywność Znajomych" na głównym panelu, gdzie widzisz ich ostatnie osiągnięcia.
                </p>
              </li>
              <li>
                <strong className="text-lg text-secondary">Kolekcje Ćwiczeń</strong>
                <p className="text-text-secondary">
                  Przeglądaj publiczne "Kolekcje", czyli zestawy ćwiczeń pogrupowane tematycznie przez administratorów. To świetny sposób na śledzenie postępów w konkretnym temacie (np. "Ukończono 3 z 8 tekstów").
                </p>
              </li>
            </ul>
          </div>
          
          <div className="card card-elevated">
            <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
              <span className="text-5xl">💡</span>
              <div>
                Porady dla Zaawansowanych
                <p className="text-lg text-text-secondary font-normal">Jak wycisnąć jeszcze więcej.</p>
              </div>
            </h2>
            <ul className="list-disc pl-6 my-4 space-y-4">
              <li>
                <strong className="text-lg">Dynamiczne Tempo</strong>
                <p className="text-text-secondary">
                  W trybach RSVP i Highlight włączone jest "dynamiczne tempo". Aplikacja automatycznie zwalnia o kilka milisekund na dłuższych lub rzadszych słowach. Daje to Twojemu mózgowi kluczowy ułamek sekundy na ich przetworzenie, znacznie poprawiając zrozumienie przy wysokich prędkościach.
                </p>
              </li>
              <li>
                <strong className="text-lg">Twórz Własne Teksty</strong>
                <p className="text-text-secondary">
                  Użyj przycisku "Nowe ćwiczenie", aby dodać własne teksty (np. artykuł, notatki ze studiów) lub importować je bezpośrednio z Wikipedii. Twoje własne teksty są domyślnie prywatne.
                </p>
              </li>
            </ul>
          </div>

          <div className="text-center mt-8">
            <Link to="/dashboard" className="btn btn-primary btn-lg">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-2">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
              </svg>
              Rozumiem, wróć do panelu
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}