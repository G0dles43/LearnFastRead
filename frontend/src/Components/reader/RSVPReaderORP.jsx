import React, { useMemo } from "react";

const getSpreederORPIndex = (length) => {
  if (length <= 1) return 0;  
  if (length <= 5) return 1;  
  if (length <= 9) return 2;  
  if (length <= 13) return 3; 
  return 4;                   
};

const RSVPReaderPro = React.memo(({ currentWord }) => {
  
  const { leftPart, orpChar, rightPart } = useMemo(() => {
    const word = currentWord || "Start";
    const length = word.length;
    const orpIndex = getSpreederORPIndex(length);
    
    return {
      leftPart: word.slice(0, orpIndex),
      orpChar: word[orpIndex] || "",
      rightPart: word.slice(orpIndex + 1)
    };
  }, [currentWord]);

  return (
    <div className="w-full h-[400px] flex flex-col items-center justify-center relative overflow-hidden select-none">
      
      <div className="absolute flex flex-col items-center gap-[1.2em] opacity-20 pointer-events-none z-0">
        <div className="w-[200px] h-[2px] bg-text-primary" />
        <div className="w-[200px] h-[2px] bg-text-primary" />
      </div>

      <div className="relative z-1 w-full max-w-6xl grid grid-cols-[1fr_auto_1fr] items-baseline gap-0">
        
        <span 
          className="text-right text-text-primary font-medium tracking-normal whitespace-nowrap"
          style={{ 
            fontFamily: '"Inter", "Roboto", sans-serif',
            fontSize: '5rem',
          }}
        >
          {leftPart}
        </span>

        <div className="flex justify-center w-[1.2ch]">
          <span 
            className="text-red-500 font-bold block text-center"
            style={{ 
              fontFamily: '"Inter", "Roboto", sans-serif',
              fontSize: '5rem',
              transform: 'scale(1.05)',
            }}
          >
            {orpChar}
          </span>
        </div>

        <span 
          className="text-left text-text-primary font-medium tracking-normal whitespace-nowrap"
          style={{ 
            fontFamily: '"Inter", "Roboto", sans-serif',
            fontSize: '5rem',
          }}
        >
          {rightPart}
        </span>

      </div>


    </div>
  );
});

export default RSVPReaderPro;