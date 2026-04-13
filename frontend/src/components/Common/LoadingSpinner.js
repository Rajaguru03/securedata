import React, { useState, useEffect } from 'react';

const FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

const LoadingSpinner = ({ size = 'md', text = '' }) => {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setFrame((f) => (f + 1) % FRAMES.length);
    }, 80);
    return () => clearInterval(interval);
  }, []);

  const sizeClass = size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-2xl' : 'text-lg';

  return (
    <div className="flex items-center gap-2">
      <span className={`text-primary font-mono ${sizeClass}`}>{FRAMES[frame]}</span>
      {text && <span className="text-term-subtle font-mono text-sm">{text}</span>}
    </div>
  );
};

export default LoadingSpinner;
