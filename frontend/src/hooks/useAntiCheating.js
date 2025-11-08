// src/hooks/useAntiCheating.js
import { useEffect, useRef } from "react";

/**
 * Hook zarządzający logiką wykrywania oszustw na frontendzie.
 * @param {function} cancelSession - Funkcja do wywołania po wykryciu oszustwa.
 * @param {boolean} isQuizMode - Czy hook jest używany w komponencie Quiz.
 * @returns {{stopListeners: function}} Kontrola nad nasłuchiwaniem.
 */
export default function useAntiCheating(cancelSession, isQuizMode = false) {
    const listenersActive = useRef(true);
    const devtoolsOpen = useRef(false);

    useEffect(() => {
        if (!listenersActive.current) return;

        // === 1. BLOKADA KLAWISZY DevTools, PrintScreen, Copy ===
        const handleKeyDown = (e) => {
            if (!listenersActive.current) return;
            
            // F12, Ctrl+Shift+I/J/C, Cmd+Alt+I/J/C, Ctrl+U
            const isDevToolsShortcut = 
                e.keyCode === 123 || 
                (e.ctrlKey && e.shiftKey && [73, 74, 67].includes(e.keyCode)) ||
                (e.metaKey && e.altKey && [73, 74, 67].includes(e.keyCode)) ||
                (e.ctrlKey && e.keyCode === 85);

            if (isDevToolsShortcut) {
                e.preventDefault();
                e.stopPropagation();
                cancelSession(isQuizMode 
                    ? "Próba dostępu do kodu podczas quizu" 
                    : "Próba dostępu do DevTools");
                return false;
            }

            // PrintScreen (Windows/Linux)
            if (e.key === 'PrintScreen' || e.keyCode === 44) {
                e.preventDefault();
                e.stopPropagation();
                cancelSession("Wykryto próbę zrzutu ekranu (PrintScreen)");
                return false;
            }

            // Screenshot na Mac (Cmd+Shift+3/4/5)
            if (e.metaKey && e.shiftKey && [51, 52, 53].includes(e.keyCode)) {
                e.preventDefault();
                e.stopPropagation();
                cancelSession("Wykryto próbę zrzutu ekranu (Mac)");
                return false;
            }

            // Windows + Shift + S (Snipping Tool)
            if (e.metaKey && e.shiftKey && e.keyCode === 83) {
                e.preventDefault();
                e.stopPropagation();
                cancelSession("Wykryto próbę zrzutu ekranu (Snipping Tool)");
                return false;
            }

            // Ctrl/Cmd + C (kopiowanie)
            if ((e.ctrlKey || e.metaKey) && e.keyCode === 67) {
                e.preventDefault();
                e.stopPropagation();
                cancelSession("Próba skopiowania treści");
                return false;
            }
        };

        // === 2. BLOKADA MENU KONTEKSTOWEGO ===
        const handleContextMenu = (e) => {
            if (!listenersActive.current) return;
            e.preventDefault();
            e.stopPropagation();
            cancelSession("Próba użycia menu kontekstowego");
            return false;
        };

        // === 3. BLOKADA KOPIOWANIA (backup) ===
        const handleCopy = (e) => {
            if (!listenersActive.current) return;
            e.preventDefault();
            e.stopPropagation();
            cancelSession("Próba skopiowania treści");
            return false;
        };

        // === 4. DETEKCJA DevTools przez rozmiar okna ===
        const detectDevTools = () => {
            if (!listenersActive.current) return;
            
            const threshold = 160;
            const widthDiff = window.outerWidth - window.innerWidth;
            const heightDiff = window.outerHeight - window.innerHeight;
            
            const isOpen = widthDiff > threshold || heightDiff > threshold;
            
            if (isOpen && !devtoolsOpen.current) {
                devtoolsOpen.current = true;
                cancelSession("Wykryto otwarte narzędzia deweloperskie");
            } else if (!isOpen) {
                devtoolsOpen.current = false;
            }
        };

        // === 5. DETEKCJA UTRATY FOCUSA ===
        const handleVisibilityChange = () => {
            if (!listenersActive.current) return;
            if (document.hidden) {
                cancelSession(isQuizMode 
                    ? "Opuszczenie karty podczas quizu" 
                    : "Opuszczenie karty podczas sesji");
            }
        };

        const handleBlur = () => {
            if (!listenersActive.current) return;
            // Delay, aby nie triggerować przy przypadkowych kliknięciach
            setTimeout(() => {
                if (!document.hasFocus() && listenersActive.current) {
                    cancelSession("Utrata focusa okna przeglądarki");
                }
            }, 500);
        };

        // === 6. DETEKCJA DEBUGGERA (zaawansowane) ===
        const detectDebugger = () => {
            const before = new Date().getTime();
            debugger; // To spowolni wykonanie, jeśli DevTools są otwarte
            const after = new Date().getTime();
            
            if (after - before > 100 && listenersActive.current) {
                cancelSession("Wykryto aktywny debugger");
            }
        };

        // === REJESTRACJA NASŁUCHIWACZY ===
        window.addEventListener('keydown', handleKeyDown, true);
        document.addEventListener('contextmenu', handleContextMenu, true);
        document.addEventListener('copy', handleCopy, true);
        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('blur', handleBlur);

        const devToolsInterval = setInterval(detectDevTools, 1000);
        const debuggerInterval = setInterval(detectDebugger, 3000);

        // === CLEANUP ===
        return () => {
            listenersActive.current = false;
            window.removeEventListener('keydown', handleKeyDown, true);
            document.removeEventListener('contextmenu', handleContextMenu, true);
            document.removeEventListener('copy', handleCopy, true);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('blur', handleBlur);
            clearInterval(devToolsInterval);
            clearInterval(debuggerInterval);
        };
    }, [cancelSession, isQuizMode]);

    return { 
        stopListeners: () => { 
            listenersActive.current = false; 
        }
    };
}