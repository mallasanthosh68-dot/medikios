import React, { useRef, useState, useEffect } from 'react';

/**
 * MagneticButton
 * Subtle magnetic attraction effect for important healthcare CTA buttons.
 * Specification:
 * - When cursor approaches button, button moves slightly toward cursor (max 4-8px).
 * - Smoothly returns to original position on mouse leave.
 * - Micro-scale on click (1 -> 0.97 -> 1).
 * - Disabled on touch devices and prefers-reduced-motion.
 */
export const MagneticButton = ({
  children,
  className = '',
  maxOffset = 6,
  onClick,
  ...props
}) => {
  const btnRef = useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isPressed, setIsPressed] = useState(false);
  const [isEnabled, setIsEnabled] = useState(true);

  useEffect(() => {
    const isTouch = window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (isTouch || prefersReducedMotion) {
      setIsEnabled(false);
    }
  }, []);

  const handleMouseMove = (e) => {
    if (!isEnabled || !btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const deltaX = e.clientX - centerX;
    const deltaY = e.clientY - centerY;

    // Dampen movement to maxOffset (4-8px)
    const moveX = Math.max(Math.min(deltaX * 0.18, maxOffset), -maxOffset);
    const moveY = Math.max(Math.min(deltaY * 0.18, maxOffset), -maxOffset);

    setPosition({ x: moveX, y: moveY });
  };

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 });
    setIsPressed(false);
  };

  const handleMouseDown = () => setIsPressed(true);
  const handleMouseUp = () => setIsPressed(false);

  return (
    <div
      ref={btnRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onClick={onClick}
      style={{
        transform: isEnabled
          ? `translate3d(${position.x}px, ${position.y}px, 0) scale(${isPressed ? 0.97 : 1})`
          : undefined,
        transition: isPressed
          ? 'transform 0.08s ease-out'
          : position.x === 0 && position.y === 0
          ? 'transform 0.45s cubic-bezier(0.25, 1, 0.5, 1)'
          : 'transform 0.12s ease-out',
      }}
      className={`inline-block will-change-transform ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
