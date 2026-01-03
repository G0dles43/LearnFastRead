import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

export default function DailyChallenge() {
  const [challenge, setChallenge] = useState(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [hasAttempted, setHasAttempted] = useState(false); // Czy była jakakolwiek próba
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showWarningModal, setShowWarningModal] = useState(false);

  const navigate = useNavigate();
  const token = localStorage.getItem("access");


useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    axios
      .get("http://127.0.0.1:8000/api/challenge/today/", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        if (res.data.challenge) {
            setChallenge(res.data.challenge);
            setIsCompleted(res.data.is_completed);
            setHasAttempted(res.data.has_attempted || res.data.is_completed);
        } else {
            setError("Brak wyzwania na dziś.");
        }
        setLoading(false);
      })
      .catch((err) => {
        setError("Nie udało się załadować wyzwania na dziś.");
        setLoading(false);
      });
  }, [token]);

  const handleStartClick = () => {
    if (hasAttempted) return; 
    setShowWarningModal(true);
  };

  const handleModalConfirm = () => {
    setShowWarningModal(false);
    navigate(`/training/${challenge.id}`);
  };

  if (loading) {
    return (
      <div className="p-8 rounded-lg shadow-md bg-gradient-to-r from-background-surface to-background-elevated animate-pulse">
        <div className="h-8 bg-background-main rounded-md w-2/5 mb-4"></div>
        <div className="h-6 bg-background-main rounded-md w-3/4"></div>
      </div>
    );
  }

  if (!challenge) {
    return null;
  }

  return (
    <>
      <div
        className={`relative overflow-hidden rounded-lg shadow-md border-2 bg-cover bg-center ${
          isCompleted ? "border-success" : hasAttempted ? "border-danger" : "border-border-light"
        }`}
      >
        <div
          className={`absolute inset-0 backdrop-blur-sm ${
            isCompleted
              ? "bg-gradient-to-r from-success/15 to-success/[.05]"
              : hasAttempted
              ? "bg-gradient-to-r from-danger/15 to-danger/[.05]"
              : "bg-gradient-to-r from-primary/15 to-secondary/[.05]"
          }`}
        ></div>
        <div
          className={`absolute top-0 right-0 w-[300px] h-[300px] pointer-events-none ${
            isCompleted
              ? "bg-[radial-gradient(circle,rgba(16,185,129,0.15)_0%,transparent_70%)]"
              : hasAttempted
              ? "bg-[radial-gradient(circle,rgba(239,68,68,0.15)_0%,transparent_70%)]"
              : "bg-[radial-gradient(circle,rgba(99,102,241,0.15)_0%,transparent_70%)]"
          }`}
        ></div>

        <div className="relative z-10 p-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div
                className={`w-14 h-14 rounded-lg flex items-center justify-center text-3xl text-white ${
                  isCompleted
                    ? "bg-gradient-to-r from-success to-green-600 shadow-lg shadow-success/30"
                    : hasAttempted
                    ? "bg-gradient-to-r from-danger to-red-600 shadow-lg shadow-danger/30"
                    : "bg-gradient-to-r from-primary to-secondary shadow-lg shadow-primary/30"
                }`}
              >
                {isCompleted ? "✓" : hasAttempted ? "✗" : (
                  <svg
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                  </svg>
                )}
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-1">
                  {isCompleted 
                    ? "Wyzwanie ukończone!" 
                    : hasAttempted 
                    ? "Próba wykorzystana" 
                    : "Dzienne wyzwanie"}
                </h3>
                <p className="text-text-secondary text-base">
                  {isCompleted
                    ? "Świetna robota! Wróć jutro"
                    : hasAttempted
                    ? "Spróbuj ponownie jutro"
                    : "Ukończ i zdobądź +50 pkt bonusu"}
                </p>
              </div>
            </div>

            {isCompleted && (
              <div className="inline-flex items-center gap-1 px-4 py-2 font-semibold rounded-full bg-success/15 text-success border border-success/30 text-base">
                +50 pkt
              </div>
            )}
          </div>

          <div className="bg-background-surface border border-border p-6 rounded-lg">
            <div className="flex items-start justify-between gap-8">
              <div className="flex-1">
                <h2 className="text-2xl font-semibold mb-4">{challenge.title}</h2>

                <div className="flex items-center flex-wrap gap-x-6 gap-y-2 text-text-secondary text-sm mb-6">
                  <span className="flex items-center gap-2">
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
                      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
                    </svg>
                    <span className="font-medium">{challenge.word_count} słów</span>
                  </span>

                  <span className="flex items-center gap-2">
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 6v6l4 2" />
                    </svg>
                    <span className="font-medium">
                      ~{Math.ceil(challenge.word_count / 250)} min
                    </span>
                  </span>

                  {challenge.is_ranked && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-warning/15 text-warning border border-warning/30">
                      <svg
                        className="w-3.5 h-3.5"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                      </svg>
                      Ranking
                    </span>
                  )}
                </div>

                {!hasAttempted ? (
                  <button
                    className="inline-flex items-center justify-center gap-2 w-full px-8 py-4 rounded-md font-semibold transition-all text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 bg-gradient-to-r from-primary to-primary-light text-lg"
                    onClick={handleStartClick}
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M8 5v14l11-7z" />
                    </svg>
                    Rozpocznij wyzwanie
                  </button>
                ) : (
                  <div className={`p-4 rounded-md font-semibold text-center cursor-not-allowed ${
                    isCompleted 
                      ? "bg-success/10 border border-success/30 text-success"
                      : "bg-danger/10 border border-danger/30 text-danger"
                  }`}>
                    {isCompleted 
                      ? "✓ Wyzwanie ukończone - wróć jutro" 
                      : "✗ Próba wykorzystana - wróć jutro"}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showWarningModal && (
        <div className="fixed inset-0 bg-background-main/80 backdrop-blur-lg flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-background-elevated shadow-xl rounded-lg border border-border max-w-2xl animate-slide-in p-8">
            <h2 className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent text-3xl font-bold mb-4">
              📅 Nowy dzień – Nowe wyzwanie!
            </h2>
            <p className="text-lg text-text-secondary mb-4">
              Oto wylosowane ćwiczenie na dziś. Masz szansę na ekstra{" "}
              <strong className="text-warning">+50 pkt</strong>, ale zasady są surowe:
            </p>
            <ul className="list-disc pl-6 my-6 space-y-3 text-text-primary">
              <li>
                To zadanie jest dostępne <strong className="text-danger">tylko do północy</strong>. 
                Jutro zniknie bezpowrotnie i zostanie zastąpione innym!
              </li>
              <li>
                Masz <strong className="text-danger">tylko JEDNĄ próbę</strong>. 
                Jeśli przerwiesz lub nie zdasz testu, bonus na dziś przepada.
              </li>
              <li>
                Aby zaliczyć, musisz uzyskać <strong className="text-success">min. 60% trafności</strong> odpowiedzi.
              </li>
              <li>
                To idealna okazja na sprawdzenie się w nieznanym tekście.
              </li>
              <li className="text-danger font-bold">
                ⚠️ Pełne skupienie – system Anti-Cheat jest aktywny!
              </li>
            </ul>

            <p className="text-text-secondary mb-6">
              Chcesz dowiedzieć się więcej o systemie punktacji?{" "}
              <Link
                to="/how-it-works"
                className="text-primary font-semibold hover:text-primary-hover"
              >
                Kliknij tutaj
              </Link>
              .
            </p>

            <div className="flex gap-4 justify-end">
              <button
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-md font-semibold transition-all bg-background-surface text-text-primary border border-border-light hover:bg-background-surface-hover hover:border-primary"
                onClick={() => setShowWarningModal(false)}
              >
                Jeszcze nie teraz
              </button>
              <button
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-md font-semibold transition-all text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 bg-gradient-to-r from-primary to-primary-light"
                onClick={handleModalConfirm}
              >
                Podejmuję wyzwanie!
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}