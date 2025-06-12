import React, { useEffect, useRef, useState } from "react";

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

      const relativeTop =
        wordRect.top - containerRect.top + container.scrollTop;
      const relativeLeft =
        wordRect.left - containerRect.left + container.scrollLeft;

      const targetScrollTop =
        relativeTop - containerRect.height / 2 + wordRect.height / 2;
      const targetScrollLeft =
        relativeLeft - containerRect.width / 2 + wordRect.width / 2;

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
      style={{
        padding: "20px",
        fontSize: "1.5rem",
        lineHeight: "2.2rem",
        width: `${width}px`,
        height: `${height}px`,
        textAlign: "justify",
        border: "2px solid #cfd8dc",
        borderRadius: "12px",
        backgroundColor: "#fafafa",
        color: "#333",
        overflow: "auto",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
        userSelect: "none",
        cursor: "default",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        wordWrap: "break-word",
        display: "block",
      }}
      tabIndex={0}
    >
      {words.map((word, index) => {
        const isActive = index === currentIndex;
        return (
          <div
            key={index}
            ref={(el) => (wordRefs.current[index] = el)}
            style={{
              position: "relative",
              margin: "0 4px 4px 0",
              padding: "2px 4px",
              transition: "all 0.3s ease",
              whiteSpace: "nowrap",
              display: "inline-block",
            }}
          >
            {isActive && (
              <div
                style={{
                  position: "absolute",
                  bottom: "0",
                  left: "0",
                  right: "0",
                  height: "3px",
                  backgroundColor: "#1565c0",
                  borderRadius: "2px",
                  animation: "pulse 1.5s infinite",
                }}
              />
            )}
            <span
              style={{
                position: "relative",
                color: isActive ? "#0d47a1" : "#555",
                fontWeight: isActive ? "600" : "400",
                zIndex: 1,
              }}
            >
              {word}
            </span>
          </div>
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
