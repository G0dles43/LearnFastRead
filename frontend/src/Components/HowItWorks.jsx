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
              Wszystko, co musisz wiedzieć o rankingu i punktacji.
            </p>
          </div>
          <Link to="/dashboard" className="btn btn-secondary">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Powrót
          </Link>
        </header>

        <div className="flex flex-col gap-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          
          <div className="card card-elevated">
            <h2 className="text-2xl font-bold mb-4">🏆 Czym są Punkty (eWPM)?</h2>
            <p>
              W naszej aplikacji nie liczy się tylko to, jak szybko "przeklikasz" tekst. Kluczem jest **efektywność**. Dlatego nie mierzymy prostego WPM (Słów na Minutę), ale **eWPM (Efektywne Słowa na Minutę)**.
            </p>
            <div className="card bg-background-main p-4 my-4">
              <code className="text-lg text-primary-light font-medium">
                Punkty = (Twoje WPM) * (Twoja Trafność %) * (Mnożnik Długości)
              </code>
            </div>
            <p className="text-text-secondary">
              Oznacza to, że czytanie 400 WPM ze 100% zrozumienia da Ci więcej punktów niż czytanie 800 WPM z 40% zrozumienia.
            </p>
          </div>

          <div className="card card-elevated">
            <h2 className="text-2xl font-bold mb-4">❌ Próg Zaliczenia: 60%</h2>
            <p>
              Aby Twój wynik w ogóle został zaliczony do rankingu, musisz osiągnąć minimalny próg zrozumienia tekstu.
            </p>
            <ul className="list-disc pl-6 my-4 space-y-2">
              <li>
                <span className="badge badge-success">Wynik 60% lub więcej</span> = Gratulacje, zdobywasz punkty!
              </li>
              <li>
                <span className="badge badge-danger">Wynik 59% lub mniej</span> = Twój wynik jest anulowany i otrzymujesz 0 punktów.
              </li>
            </ul>
            <p className="text-text-secondary">
              W ten sposób eliminujemy "strzelanie" na chybił-trafił w quizie. Musisz zrozumieć tekst, aby zdobyć punkty.
            </p>
          </div>

          <div className="card card-elevated">
            <h2 className="text-2xl font-bold mb-4">⏱️ Cooldown Rankingu: 30 Dni</h2>
            <p>
              Zasady są proste: liczy się Twój **najlepszy wynik** dla danego tekstu.
            </p>
            <ul className="list-disc pl-6 my-4 space-y-2">
              <li>
                Kiedy ukończysz ćwiczenie rankingowe, Twój wynik jest zapisywany.
              </li>
              <li>
                Przez następne **30 dni** możesz powtarzać to ćwiczenie, ale tylko w trybie treningowym (bez quizu i bez punktów).
              </li>
              <li>
                Po upływie 30 dni, możesz ponownie podejść do tego tekstu i spróbować **poprawić swój wynik**. Jeśli zdobędziesz więcej punktów, stary wynik zostanie zastąpiony nowym, lepszym.
              </li>
            </ul>
            <p className="text-text-secondary">
              Zapobiega to "farmie" punktów i promuje systematyczną poprawę umiejętności.
            </p>
          </div>

          <div className="card card-elevated">
            <h2 className="text-2xl font-bold mb-4">⚡ Wyzwanie Dnia</h2>
            <p>
              Każdego dnia wybierane jest jedno ćwiczenie rankingowe jako "Wyzwanie Dnia". Ukończenie go (z wynikiem powyżej progu 60%) gwarantuje Ci **bonusowe +50 punktów** do Twojego wyniku.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}