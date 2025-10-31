import React, { useEffect, useRef, useState } from "react";

export default function HighlightReader({
  text,
  currentIndex,
  width = 800,
  height = 400,
}) {
  const [words, setWords] = useState([]);
  const containerRef = useRef(null);
  const wordRefs = useRef([]);

  useEffect(() => {
    const splitWords = text.trim().split(/\s+/);
    setWords(splitWords);
    wordRefs.current = [];
  }, [text]);

  useEffect(() => {
    if (!containerRef.current || wordRefs.current.length === 0) return;
    const activeWordRef = wordRefs.current[currentIndex];
    const container = containerRef.current;

    if (activeWordRef && container) {
      const wordRect = activeWordRef.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const relativeTop = wordRect.top - containerRect.top + container.scrollTop;
      const targetScrollTop = relativeTop - containerRect.height / 2 + wordRect.height / 2;

      container.scrollTo({
        top: targetScrollTop,
        left: 0,
        behavior: "smooth",
      });
    }
  }, [currentIndex]);

  return (
    <div
      ref={containerRef}
      className="bg-gradient-to-b from-slate-900/40 via-slate-800/40 to-slate-900/40 backdrop-blur-md rounded-xl border border-white/10 p-8 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-indigo-500/20 scrollbar-track-transparent relative"
      style={{ width: `${width}px`, height: `${height}px` }}
    >
      {/* Gradient fade effect */}
      <div className="pointer-events-none fixed top-0 left-0 right-0 h-16 bg-gradient-to-b from-slate-900/80 to-transparent z-10" />
      <div className="pointer-events-none fixed bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-slate-900/80 to-transparent z-10" />
      
      <div className="text-xl md:text-2xl leading-relaxed text-justify relative z-0">
        {words.map((word, index) => {
          const isActive = index === currentIndex;
          return (
            <span
              key={index}
              ref={(el) => (wordRefs.current[index] = el)}
              className={`transition-colors duration-200 ${isActive ? 'text-white font-semibold' : 'text-white/50'}`}
            >
              {word}{" "}
            </span>
          );
        })}
      </div>
    </div>
  );
}