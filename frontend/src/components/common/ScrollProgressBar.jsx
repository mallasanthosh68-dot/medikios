import React, { useState, useEffect } from 'react';

/**
 * ScrollProgressBar
 * Ultra-thin, elegant scroll progress indicator for MediKiosk.
 * Specification:
 * - Extremely thin and elegant (2.5px).
 * - Fixed at the top edge of the window.
 * - Gradient from clinical cyan (#0EA5A8) to ocean blue (#0284C7).
 * - Tracks exact page scroll percentage smoothly.
 */
export const ScrollProgressBar = () => {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      if (scrollHeight > 0) {
        const progress = Math.min(Math.max((scrollTop / scrollHeight) * 100, 0), 100);
        setScrollProgress(progress);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div
      className="fixed top-0 left-0 right-0 h-[2.5px] z-[99999] bg-transparent pointer-events-none"
      aria-hidden="true"
    >
      <div
        className="h-full bg-gradient-to-r from-[#0EA5A8] via-[#0284C7] to-[#0EA5A8] transition-all duration-75 ease-out rounded-r-full shadow-[0_0_8px_rgba(14,165,168,0.5)]"
        style={{ width: `${scrollProgress}%` }}
      />
    </div>
  );
};
