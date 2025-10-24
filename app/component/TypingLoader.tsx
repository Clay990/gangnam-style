
import React from 'react';

const TypingLoader = () => {
  const text = "AI is future";
  const steps = text.length;
  const animationDuration = `${steps * 0.1}s`;

  const keyframes = `
    @keyframes typing {
      from { width: 0; }
      to { width: ${steps}ch; }
    }
    @keyframes blink-caret {
      from, to { border-color: transparent; }
      50% { border-color: white; }
    }
  `;

  return (
    <>
      <style>{keyframes}</style>
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 overflow-hidden relative">
        <div
          className="text-3xl md:text-5xl font-mono overflow-hidden whitespace-nowrap border-r-4 border-r-white"
          style={{
            width: `${steps}ch`,
            animation: `typing ${animationDuration} steps(${steps}, end) 1s 1 normal both,
                        blink-caret .75s step-end infinite`,
          }}
        >
          {text}
        </div>
      </div>
    </>
  );
};

export default TypingLoader;
