'use client';

import { useEffect, useState } from 'react';

export function BackgroundMoneyWave() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  const symbols = Array.from({ length: 20 });

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      {symbols.map((_, i) => {
        const style = {
          left: `${Math.random() * 100}vw`,
          animationDuration: `${Math.random() * 5 + 5}s`, // 5s to 10s
          animationDelay: `${Math.random() * 5}s`,
        };
        const size = Math.random() * 0.75 + 0.5; // 0.5rem to 1.25rem
        
        return (
          <span
            key={i}
            className="absolute text-primary/10 animate-money-flow"
            style={style}
          >
            <span style={{ fontSize: `${size}rem`, textShadow: '0 0 10px hsl(var(--primary) / 0.5)' }}>
              ₦
            </span>
          </span>
        );
      })}
    </div>
  );
}
