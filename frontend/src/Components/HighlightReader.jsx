import React, { useEffect, useRef, useState } from "react";
import styles from "./HighlightReader.module.css";

export default function HighlightReader({
  text,
  currentIndex,
  width = 600,
  height = 300,
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
      const relativeLeft = wordRect.left - containerRect.left + container.scrollLeft;
      const targetScrollTop = relativeTop - containerRect.height / 2 + wordRect.height / 2;
      const targetScrollLeft = relativeLeft - containerRect.width / 2 + wordRect.width / 2;
      container.scrollTo({
        top: targetScrollTop,
        left: targetScrollLeft,
        behavior: "smooth",
      });
    }
  }, [currentIndex]);

  return (
    <div
      ref={containerRef}
      className={styles.readerContainer} 
      style={{ width: `${width}px`, height: `${height}px` }} 
      tabIndex={0}
    >
      {words.map((word, index) => {
        const isActive = index === currentIndex;
        return (
          <span
            key={index}
            ref={(el) => (wordRefs.current[index] = el)}
            className={`${styles.wordWrapper} ${isActive ? styles.activeWrapper : ''}`}
          >
            {isActive && <span className={styles.activePulse} />}
            <span className={`${styles.word} ${isActive ? styles.activeWord : ''}`}>
              {word}
            </span>
            {' '}
          </span>
        );
      })}
      <style>
        {`
          @keyframes pulse {
            0% { opacity: 0.6; }
            50% { opacity: 1; }
            100% { opacity: 0.6; }
          }
        `}
      </style>
    </div>
  );
}