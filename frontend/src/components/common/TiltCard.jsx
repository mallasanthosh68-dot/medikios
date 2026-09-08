import React, { useRef, useState, useEffect } from 'react';

/**
 * TiltCard
 * Sophisticated 3D tilt interaction wrapper for healthcare cards.
 * Specification:
 * - When cursor moves over card:
 *   Rotates slightly based on cursor position.
 *   Strict maximum limit: rotateX: 3-5deg, rotateY: 3-5deg. Never exceeds this range.
 * - On hover: lifts upward 4-8px (translateY: -6px), shadow becomes deeper, subtle border highlight.
 * - Smoothly returns to normal when cursor leaves.
 * - Automatically disabled on touch devices and prefers-reduced-motion.
 */
export const TiltCard = ({
  children,
  className = '',
  maxTilt = 4, // strictly capped at 3-5deg
  lift = 6, // lifts 4-8px
  dataCursor = 'card',
  ...props
}) => {
  const cardRef = useRef(null);
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0, isHovered: false });
  const [isEnabled, setIsEnabled] = useState(true);

  useEffect(() => {
    const isTouch = window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (isTouch || prefersReducedMotion) {
      setIsEnabled(false);
    }
  }, []);

  const handleMouseMove = (e) => {
    if (!isEnabled || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Normalize from -1 to 1
    const normX = (x - centerX) / centerX;
    const normY = (y - centerY) / centerY;

    // Calculate rotation:
    // Moving mouse to right tilts around Y axis (positive)
    // Moving mouse down tilts around X axis (negative)
    const rotY = Math.max(Math.min(normX * maxTilt, maxTilt), -maxTilt);
    const rotX = Math.max(Math.min(-normY * maxTilt, maxTilt), -maxTilt);

    setTilt({ rotateX: rotX, rotateY: rotY, isHovered: true });
  };

  const handleMouseLeave = () => {
    setTilt({ rotateX: 0, rotateY: 0, isHovered: false });
  };

  return (
    <div
      style={{ perspective: '1000px' }}
      className="inline-block w-full"
      data-cursor={dataCursor}
    >
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          transform: isEnabled
            ? `rotateX(${tilt.rotateX.toFixed(2)}deg) rotateY(${tilt.rotateY.toFixed(2)}deg) translate3d(0, ${
                tilt.isHovered ? -lift : 0
              }px, 0)`
            : undefined,
          transition:
            tilt.rotateX === 0 && tilt.rotateY === 0 && !tilt.isHovered
              ? 'transform 0.5s cubic-bezier(0.25, 1, 0.5, 1), box-shadow 0.5s ease'
              : 'transform 0.12s ease-out, box-shadow 0.15s ease',
        }}
        className={`transition-shadow will-change-transform ${
          tilt.isHovered
            ? 'shadow-xl border-[#0EA5A8]/30'
            : 'shadow-xs border-[#D9E4E5]'
        } ${className}`}
        {...props}
      >
        {children}
      </div>
    </div>
  );
};
