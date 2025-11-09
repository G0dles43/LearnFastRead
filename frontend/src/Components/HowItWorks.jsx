import React from "react";
import { Link, useNavigate } from "react-router-dom";

export default function HowItWorks() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background-main text-text-primary p-4 md:p-8">
      <div className="mx-auto w-full max-w-4xl">

        <header className="flex items-center justify-between mb-8 animate-fade-in">
          <div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Jak to działa?
            </h1>
            <p className="text-text-secondary text-lg">
              Wszystko, co musisz wiedzieć o trybach, rankingu i punktacji.
            </p>
          </div>
          <Link
            to="/dashboard"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-md font-semibold transition-all bg-background-surface text-text-primary border border-border-light hover:bg-background-surface-hover hover:border-primary"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Powrót
          </Link>
        </header>

        <div className="flex flex-col gap-8 animate-fade-in [animation-delay:0.1s]">

          <div className="bg-background-elevated shadow-md rounded-lg border border-border p-8">
            <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
              <span className="text-5xl">📖</span>
              <div>
                Podstawy: Trzy Tryby Czytania
                <p className="text-lg text-text-secondary font-normal">Wybierz swój ulubiony styl.</p>
              </div>
            </h2>

            <ul className="flex flex-col gap-5">
              <li className="flex items-start gap-4 p-4 rounded-lg bg-background-main border border-border">
                <span className="text-3xl mt-1 text-primary font-bold">1.</span>
                <div>
                  <h3 className="text-xl font-semibold mb-1 text-text-primary">RSVP (Słowo po słowie)</h3>
                  <p className="text-text-secondary">
                    Klasyczna metoda szybkiego czytania. Słowa pojawiają się jedno po drugim na środku ekranu. Eliminuje to ruch gałek ocznych i zmusza mózg do szybszego przetwarzania. Użyj <Link to="/calibrate" className="text-primary font-semibold hover:text-primary-hover">Kalibracji</Link>, aby znaleźć swoje idealne tempo.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-4 p-4 rounded-lg bg-background-main border border-border">
                <span className="text-3xl mt-1 text-primary font-bold">2.</span>
                <div>
                  <h3 className="text-xl font-semibold mb-1 text-text-primary">Highlight (Podświetlenie)</h3>
                  <p className="text-text-secondary">
                    Tryb ten pokazuje cały tekst, ale podświetla kolejne słowa w zadanym tempie, prowadząc Twój wzrok. Jest świetny do nauki płynności i utrzymania kontekstu. Wymiary okna możesz zmienić w <Link to="/settings" className="text-primary font-semibold hover:text-primary-hover">Ustawieniach</Link>.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-4 p-4 rounded-lg bg-background-main border border-border">
                <span className="text-3xl mt-1 text-primary font-bold">3.</span>
                <div>
                  <h3 className="text-xl font-semibold mb-1 text-text-primary">Chunking (Grupowanie)</h3>
                  <p className="text-text-secondary">
                    Tryb dla zaawansowanych. Zamiast jednego słowa, pokazuje 2, 3 lub więcej słów naraz. Uczy to mózg postrzegania całych fraz, a nie pojedynczych wyrazów. Rozmiar "chunka" zmienisz w <Link to="/settings" className="text-primary font-semibold hover:text-primary-hover">Ustawieniach</Link>.
                  </p>
                </div>
              </li>
            </ul>
          </div>

          <div className="h-px bg-border my-4" />

          <div className="bg-background-elevated shadow-md rounded-lg border border-border p-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-text-primary">
              <span>🎯</span> Rankingowe vs Treningowe
            </h2>
            <div className="space-y-4 text-text-secondary">
              <p>
                W naszym systemie rozróżniamy <strong className="text-text-primary">ćwiczenia rankingowe</strong> i <strong className="text-text-primary">treningowe</strong>.
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong className="text-text-primary">Rankingowe:</strong> Oznaczone 🏆, mają quiz, dają punkty i wpływają na statystyki
                </li>
                <li>
                  <strong className="text-text-primary">Treningowe:</strong> Bez quizu, nie dają punktów, ale <strong className="text-success">aktualizują streak!</strong>
                </li>
              </ul>
            </div>
          </div>

          <div className="bg-background-elevated shadow-md rounded-lg border border-border p-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-text-primary">
              <span>✅</span> Próg Zaliczenia - 60%
            </h2>
            <div className="space-y-4 text-text-secondary">
              <p>
                Aby Twój wynik zaliczył się do rankingu i statystyk, musisz osiągnąć <strong className="text-success">minimum 60% trafności</strong> w quizie.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="bg-success/10 border-2 border-success rounded-lg p-4">
                  <div className="text-2xl mb-2">✓</div>
                  <h3 className="font-bold mb-2 text-text-primary">Próba Zaliczona (≥60%)</h3>
                  <ul className="text-sm space-y-1">
                    <li>✓ Dostajesz punkty rankingowe</li>
                    <li>✓ Liczy się do średnich (WPM, Accuracy)</li>
                    <li>✓ Aktualizuje streak</li>
                    <li>✓ Może dać osiągnięcia</li>
                  </ul>
                </div>
                <div className="bg-danger/10 border-2 border-danger rounded-lg p-4">
                  <div className="text-2xl mb-2">✗</div>
                  <h3 className="font-bold mb-2 text-text-primary">Próba Niezaliczona (&lt;60%)</h3>
                  <ul className="text-sm space-y-1">
                    <li>✗ 0 punktów rankingowych</li>
                    <li>✗ NIE liczy się do średnich</li>
                    <li>✓ Ale AKTUALIZUJE streak!</li>
                    <li>✗ Brak osiągnięć</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-background-elevated shadow-md rounded-lg border border-border p-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-text-primary">
              <span>📊</span> Jak Obliczane są Statystyki?
            </h2>
            <div className="space-y-4 text-text-secondary">
              <p>
                Wszystkie statystyki w profilu, rankingu i po quizie są obliczane <strong className="text-text-primary">TYLKO z zaliczonych prób</strong> (trafność ≥60%).
              </p>
              <div className="bg-background-surface rounded-lg p-6 mt-4">
                <h3 className="font-bold mb-4 text-text-primary">Co pokazujemy:</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="text-warning text-xl">➤</span>
                    <div>
                      <strong className="text-text-primary">Średnie WPM:</strong> Średnia prędkość z wszystkich ZALICZONYCH prób
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-success text-xl">➤</span>
                    <div>
                      <strong className="text-text-primary">Średnia Accuracy:</strong> Średnia trafność z wszystkich ZALICZONYCH prób
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-primary text-xl">➤</span>
                    <div>
                      <strong className="text-text-primary">Ukończone:</strong> Liczba ZALICZONYCH prób rankingowych
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-danger text-xl">➤</span>
                    <div>
                      <strong className="text-text-primary">Punkty:</strong> Suma punktów ze wszystkich ZALICZONYCH prób
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-background-elevated shadow-md rounded-lg border border-border p-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-text-primary">
              <span>🏆</span> System Punktów
            </h2>
            <div className="space-y-4 text-text-secondary">
              <p>Punkty rankingowe obliczane są według wzoru:</p>
              <div className="bg-primary/10 border-2 border-primary rounded-lg p-4 text-center my-4">
                <code className="text-lg text-text-primary font-mono">
                  Punkty = WPM × (Accuracy / 100) × Mnożnik_Długości
                </code>
              </div>
              <div>
                <strong className="text-text-primary">Mnożniki długości tekstu:</strong>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>≤300 słów: <strong className="text-warning">×0.8</strong></li>
                  <li>301-500 słów: <strong className="text-success">×1.0</strong></li>
                  <li>501-800 słów: <strong className="text-primary">×1.2</strong></li>
                  <li>&gt;800 słów: <strong className="text-danger">×1.5</strong></li>
                </ul>
              </div>
              <div className="bg-warning/10 border-2 border-warning rounded-lg p-4 mt-4">
                <p className="text-warning font-semibold mb-2">🎁 Bonus Daily Challenge: +50 pkt</p>
                <p className="text-sm">
                  Jeśli ukończysz wyzwanie dnia z zaliczeniem, otrzymasz dodatkowo 50 punktów!
                </p>
              </div>
            </div>
          </div>

          <div className="bg-background-elevated shadow-md rounded-lg border border-border p-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-text-primary">
              <span>⏱️</span> System Cooldown (30 dni)
            </h2>
            <div className="space-y-4 text-text-secondary">
              <p>
                Po zaliczeniu ćwiczenia rankingowego musisz poczekać <strong className="text-text-primary">30 dni</strong>,
                zanim będziesz mógł poprawić swój wynik rankingowy.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="bg-background-surface rounded-lg p-4">
                  <h3 className="font-bold mb-2 text-primary">Tryb Rankingowy</h3>
                  <p className="text-sm">
                    Pierwsza próba LUB po upływie 30 dni od ostatniego zaliczenia.
                    Wynik liczy się do rankingu i statystyk.
                  </p>
                </div>
                <div className="bg-background-surface rounded-lg p-4">
                  <h3 className="font-bold mb-2 text-secondary">Tryb Treningowy</h3>
                  <p className="text-sm">
                    Podczas cooldownu. Możesz trenować, wynik zapisany,
                    ale nie liczy się do rankingu. Streak się aktualizuje!
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-background-elevated shadow-md rounded-lg border border-border p-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-text-primary">
              <span>🔥</span> Seria (Streak)
            </h2>
            <div className="space-y-4 text-text-secondary">
              <p>
                Seria to liczba kolejnych dni, w których ukończyłeś <strong className="text-text-primary">DOWOLNE ćwiczenie</strong>
                (rankingowe lub treningowe, zaliczone lub nie).
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong className="text-success">+1 do serii:</strong> Ukończ jakiekolwiek ćwiczenie następnego dnia po poprzednim
                </li>
                <li>
                  <strong className="text-danger">Reset serii:</strong> Pominięcie dnia (brak aktywności)
                </li>
                <li>
                  <strong className="text-primary">Zaliczenie tego samego dnia:</strong> Nie zmienia serii (już +1 za dziś)
                </li>
              </ul>
              <div className="bg-success/10 border-2 border-success rounded-lg p-4 mt-4">
                <p className="text-success font-semibold">
                  💡 Pro tip: Nawet niezaliczona próba rankingowa lub trening aktualizuje streak!
                </p>
              </div>
            </div>
          </div>

          <div className="bg-background-elevated shadow-md rounded-lg border border-border p-8">
            <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
              <span className="text-5xl">🤝</span>
              <div>
                Motywacja i Społeczność
                <p className="text-lg text-text-secondary font-normal">Rywalizuj i utrzymuj nawyk.</p>
              </div>
            </h2>
            <ul className="list-disc pl-6 my-4 space-y-4">
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

          <div className="bg-background-elevated shadow-md rounded-lg border border-border p-8">
            <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
              <span className="text-5xl">💡</span>
              <div>
                Porady dla Zaawansowanych
                <p className="text-lg text-text-secondary font-normal">Jak wycisnąć jeszcze więcej.</p>
              </div>
            </h2>
            <ul className="list-disc pl-6 my-4 space-y-4">
              <li>
                <strong className="text-lg text-text-primary">Dynamiczne Tempo</strong>
                <p className="text-text-secondary">
                  W trybach RSVP i Highlight włączone jest "dynamiczne tempo". Aplikacja automatycznie zwalnia o kilka milisekund na dłuższych lub rzadszych słowach. Daje to Twojemu mózgowi kluczowy ułamek sekundy na ich przetworzenie, znacznie poprawiając zrozumienie przy wysokich prędkościach.
                </p>
              </li>
              <li>
                <strong className="text-lg text-text-primary">Twórz Własne Teksty</strong>
                <p className="text-text-secondary">
                  Użyj przycisku "Nowe ćwiczenie", aby dodać własne teksty (np. artykuł, notatki ze studiów) lub importować je bezpośrednio z Wikipedii. Twoje własne teksty są domyślnie prywatne.
                </p>
              </li>
            </ul>
          </div>

          <div className="bg-background-elevated shadow-md rounded-lg p-8 bg-gradient-to-br from-primary/10 to-secondary/10 border-2 border-primary/30">
            <h2 className="text-2xl font-bold mb-4 text-text-primary">📌 Podsumowanie</h2>
            <div className="space-y-3 text-text-secondary">
              <p>✓ <strong className="text-text-primary">Statystyki (WPM, Accuracy, Punkty):</strong> TYLKO z zaliczonych prób (≥60%)</p>
              <p>✓ <strong className="text-text-primary">Próg zaliczenia:</strong> 60% trafności w quizie</p>
              <p>✓ <strong className="text-text-primary">Cooldown:</strong> 30 dni na poprawę wyniku rankingowego</p>
              <p>✓ <strong className="text-text-primary">Streak:</strong> Aktualizowany po KAŻDYM ćwiczeniu, niezależnie od wyniku</p>
              <p>✓ <strong className="text-text-primary">Konsystencja danych:</strong> Te same wartości w quizie, profilu i rankingu</p>
            </div>
          </div>

          <div className="text-center mt-8">
            <Link
              to="/dashboard"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-md font-semibold transition-all text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 bg-gradient-to-r from-primary to-primary-light text-lg"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-2">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
              Rozumiem, wróć do panelu
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}