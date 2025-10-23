import React from 'react';

interface ShinyTextProps {
  text: string;
  disabled?: boolean;
  speed?: number;
  className?: string;
}

const ShinyText: React.FC<ShinyTextProps> = ({ text, disabled = false, speed = 5, className = '' }) => {
  const animationDuration = `${speed}s`;

  // Define the keyframes as a string
  const keyframes = `
    @keyframes shine {
      0% { background-position: 100%; }
      100% { background-position: -100%; }
    }
  `;

  return (
    <>
      {/* This style tag injects the animation keyframes directly into the page.
        This makes the component self-contained and removes the need
        to edit tailwind.config.ts.
      */}
      <style>{keyframes}</style>
      
      <div
        // We remove 'animate-shine' from className
        className={`text-[#b5b5b5a4] bg-clip-text inline-block ${className}`}
        style={{
          backgroundImage:
            'linear-gradient(120deg, rgba(255, 255, 255, 0) 40%, rgba(255, 255, 255, 0.8) 50%, rgba(255, 255, 255, 0) 60%)',
          backgroundSize: '200% 100%',
          WebkitBackgroundClip: 'text',
          // We add the animation properties directly here
          animationName: disabled ? 'none' : 'shine',
          animationDuration: animationDuration,
          animationTimingFunction: 'linear',
          animationIterationCount: 'infinite',
        }}
      >
        {text}
      </div>
    </>
  );
};

export default ShinyText;
