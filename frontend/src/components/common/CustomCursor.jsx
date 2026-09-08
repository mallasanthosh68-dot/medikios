import React, { useEffect, useState, useRef } from 'react';

/**
 * CustomCursor
 * Sophisticated, calm custom healthcare cursor system:
 * - Small central dot (5px) in medical cyan (#0EA5A8)
 * - Soft outer ring (32px) with smooth spring/lerp trailing (magnetic delay feeling)
 * - Extremely subtle 3-particle fading trail
 * - Soft radial ambient glow (medical blue/cyan, low opacity)
 * - Context-aware hover states (buttons, links, cards, 3D elements)
 * - Automatically disabled on touch devices and if prefers-reduced-motion is active.
 * - Optimized with requestAnimationFrame for 60+ FPS without layout thrashing.
 */
export const CustomCursor = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isHoveringButton, setIsHoveringButton] = useState(false);
  const [isHoveringCard, setIsHoveringCard] = useState(false);
  const [isHovering3D, setIsHovering3D] = useState(false);
  const [isClicking, setIsClicking] = useState(false);
  const [isEnabled, setIsEnabled] = useState(true);

  // Mouse coordinates (actual position)
  const mouseRef = useRef({ x: -100, y: -100 });
  // Ring coordinates (smoothed position)
  const ringRef = useRef({ x: -100, y: -100 });
  // Glow coordinates (slower smoothed position)
  const glowRef = useRef({ x: -100, y: -100 });
  // Trail particles history (x, y, opacity)
  const trailRef = useRef([
    { x: -100, y: -100 },
    { x: -100, y: -100 },
    { x: -100, y: -100 },
  ]);

  const dotElRef = useRef(null);
  const ringElRef = useRef(null);
  const glowElRef = useRef(null);
  const trailElsRef = useRef([]);

  useEffect(() => {
    // 1. Accessibility & Device Detection:
    // Check for touch device or prefers-reduced-motion
    const isTouch = window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (isTouch || prefersReducedMotion) {
      setIsEnabled(false);
      return;
    }

    const onMouseMove = (e) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
      if (!isVisible) setIsVisible(true);

      // Check hovered element
      const target = e.target;
      if (!target) return;

      const buttonOrLink = target.closest('button, a, [role="button"], input, select, textarea');
      const card = target.closest('[data-cursor="card"]');
      const threeD = target.closest('[data-cursor="3d"], #hero-3d-container, #anatomy-3d-canvas');

      setIsHoveringButton(!!buttonOrLink);
      setIsHoveringCard(!!card);
      setIsHovering3D(!!threeD);
    };

    const onMouseDown = () => setIsClicking(true);
    const onMouseUp = () => setIsClicking(false);
    const onMouseLeave = () => setIsVisible(false);
    const onMouseEnter = () => setIsVisible(true);

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    document.addEventListener('mouseleave', onMouseLeave);
    document.addEventListener('mouseenter', onMouseEnter);

    // Smooth RAF loop for lerping ring, glow, and trail
    let animId;
    const lerp = (a, b, n) => (1 - n) * a + n * b;

    const tick = () => {
      const { x: targetX, y: targetY } = mouseRef.current;

      // 1. Direct Dot Position
      if (dotElRef.current) {
        dotElRef.current.style.transform = `translate3d(${targetX}px, ${targetY}px, 0)`;
      }

      // 2. Smooth Ring Position (spring factor ~0.2)
      ringRef.current.x = lerp(ringRef.current.x, targetX, 0.22);
      ringRef.current.y = lerp(ringRef.current.y, targetY, 0.22);

      if (ringElRef.current) {
        ringElRef.current.style.transform = `translate3d(${ringRef.current.x}px, ${ringRef.current.y}px, 0)`;
      }

      // 3. Smooth Ambient Radial Glow (spring factor ~0.08)
      glowRef.current.x = lerp(glowRef.current.x, targetX, 0.08);
      glowRef.current.y = lerp(glowRef.current.y, targetY, 0.08);

      if (glowElRef.current) {
        glowElRef.current.style.transform = `translate3d(${glowRef.current.x}px, ${glowRef.current.y}px, 0)`;
      }

      // 4. Subtle Trail Particles
      let prevX = targetX;
      let prevY = targetY;
      for (let i = 0; i < trailRef.current.length; i++) {
        trailRef.current[i].x = lerp(trailRef.current[i].x, prevX, 0.35 - i * 0.06);
        trailRef.current[i].y = lerp(trailRef.current[i].y, prevY, 0.35 - i * 0.06);
        prevX = trailRef.current[i].x;
        prevY = trailRef.current[i].y;

        const pEl = trailElsRef.current[i];
        if (pEl) {
          pEl.style.transform = `translate3d(${trailRef.current[i].x}px, ${trailRef.current[i].y}px, 0)`;
        }
      }

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('mouseleave', onMouseLeave);
      document.removeEventListener('mouseenter', onMouseEnter);
    };
  }, [isVisible]);

  if (!isEnabled) return null;

  // Determine outer ring class based on state
  let ringClasses = 'w-8 h-8 -ml-4 -mt-4 border border-[#0EA5A8]/50 rounded-full';
  if (isClicking) {
    ringClasses = 'w-6 h-6 -ml-3 -mt-3 border-2 border-[#0EA5A8] bg-[#0EA5A8]/10 rounded-full scale-90';
  } else if (isHoveringButton) {
    ringClasses = 'w-11 h-11 -ml-[22px] -mt-[22px] border border-[#0EA5A8] bg-[#0EA5A8]/10 rounded-full scale-105';
  } else if (isHoveringCard) {
    ringClasses = 'w-14 h-14 -ml-7 -mt-7 border border-[#0284C7]/60 bg-[#0284C7]/5 rounded-full scale-100';
  } else if (isHovering3D) {
    ringClasses = 'w-16 h-16 -ml-8 -mt-8 border border-cyan-400/80 bg-cyan-400/10 rounded-full animate-pulse';
  }

  return (
    <div
      className={`pointer-events-none fixed inset-0 z-[999999] transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      aria-hidden="true"
    >
      {/* 1. Very Subtle Ambient Radial Light (Medical Cyan/Blue) */}
      <div
        ref={glowElRef}
        className="absolute top-0 left-0 -ml-40 -mt-40 w-80 h-80 rounded-full bg-gradient-to-r from-[#0EA5A8]/5 via-[#0284C7]/4 to-transparent blur-3xl will-change-transform"
      />

      {/* 2. Trail Particles (2-3 small fading dots) */}
      {[0.25, 0.15, 0.08].map((op, idx) => (
        <div
          key={idx}
          ref={(el) => (trailElsRef.current[idx] = el)}
          className="absolute top-0 left-0 w-1.5 h-1.5 -ml-[3px] -mt-[3px] rounded-full bg-[#0EA5A8] will-change-transform"
          style={{ opacity: op }}
        />
      ))}

      {/* 3. Soft Outer Ring (Smooth Lag) */}
      <div
        ref={ringElRef}
        className={`absolute top-0 left-0 transition-[width,height,border-color,background-color,transform] duration-200 ease-out will-change-transform ${ringClasses}`}
      />

      {/* 4. Small Central Dot (Immediate) */}
      <div
        ref={dotElRef}
        className={`absolute top-0 left-0 w-1.5 h-1.5 -ml-[3px] -mt-[3px] rounded-full bg-[#0EA5A8] shadow-xs will-change-transform transition-transform duration-75 ${
          isClicking ? 'scale-75 bg-[#0284C7]' : ''
        }`}
      />
    </div>
  );
};
