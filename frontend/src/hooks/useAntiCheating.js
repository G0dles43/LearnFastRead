import { useEffect, useRef } from "react";

export default function useAntiCheating(cancelSession, isQuizMode = false, enabled = true) {
    const listenersActive = useRef(enabled); 
    const devtoolsOpen = useRef(false);

    useEffect(() => {
        if (!enabled) {
            listenersActive.current = false;
            return; 
        }
        
        listenersActive.current = true;

        const handleKeyDown = (e) => {
            if (!listenersActive.current) return;
            
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

            if (e.key === 'PrintScreen' || e.keyCode === 44) {
                e.preventDefault();
                e.stopPropagation();
                cancelSession("Wykryto próbę zrzutu ekranu (PrintScreen)");
                return false;
            }

            if (e.metaKey && e.shiftKey && [51, 52, 53].includes(e.keyCode)) {
                e.preventDefault();
                e.stopPropagation();
                cancelSession("Wykryto próbę zrzutu ekranu (Mac)");
                return false;
            }

            if (e.metaKey && e.shiftKey && e.keyCode === 83) {
                e.preventDefault();
                e.stopPropagation();
                cancelSession("Wykryto próbę zrzutu ekranu (Snipping Tool)");
                return false;
            }

            if (!isQuizMode && (e.ctrlKey || e.metaKey) && e.keyCode === 67) {
                e.preventDefault();
                e.stopPropagation();
                cancelSession("Próba skopiowania treści");
                return false;
            }
        };

        const handleContextMenu = (e) => {
            if (!listenersActive.current) return;
            e.preventDefault();
            e.stopPropagation();
            cancelSession("Próba użycia menu kontekstowego");
            return false;
        };

        const handleCopy = (e) => {
            if (!listenersActive.current) return;
            if (!isQuizMode) {
                e.preventDefault();
                e.stopPropagation();
                cancelSession("Próba skopiowania treści");
                return false;
            }
        };

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
            setTimeout(() => {
                if (!document.hasFocus() && listenersActive.current) {
                    cancelSession("Wykryto screen shot");
                }
            }, 500);
        };

        const detectDebugger = () => {
            const before = new Date().getTime();
            debugger; 
            const after = new Date().getTime();
            
            if (after - before > 100 && listenersActive.current) {
                cancelSession("Wykryto aktywny debugger");
            }
        };

        window.addEventListener('keydown', handleKeyDown, true);
        document.addEventListener('contextmenu', handleContextMenu, true);
        document.addEventListener('copy', handleCopy, true);
        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('blur', handleBlur);

        const devToolsInterval = setInterval(detectDevTools, 1000);
        const debuggerInterval = setInterval(detectDebugger, 3000);

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
    }, [cancelSession, isQuizMode, enabled]); 

    return { 
        stopListeners: () => { 
            listenersActive.current = false; 
        }
    };
}