import React from 'react';

/**
 * MediKiosk Unified Brand Logo
 * Combines:
 * 1. The letter 'M' in clean modern geometric curves
 * 2. An integrated Medical Cross / Healthcare Plus symbol at the central junction
 * 3. Subtle AI / digital nodes and circuit endpoints
 * 4. Harmonic medical gradient: Medical Cyan (#0EA5A8) to Deep Medical Blue (#0284C7)
 */
export const MediKioskLogo = ({
  size = 36,
  variant = 'full', // 'full' | 'icon' | 'mark'
  className = '',
  textColor = 'text-[#172033]',
  animated = false,
}) => {
  const iconSize = typeof size === 'number' ? size : parseInt(size, 10) || 36;

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* SVG Emblem: M + Medical Cross + AI Nodes */}
      <div
        className="relative flex items-center justify-center shrink-0"
        style={{ width: iconSize, height: iconSize }}
      >
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`w-full h-full ${animated ? 'animate-pulse' : ''}`}
        >
          <defs>
            {/* Medical Cyan to Trust Blue Gradient */}
            <linearGradient id="medikiosk-grad-primary" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0EA5A8" />
              <stop offset="50%" stopColor="#0284C7" />
              <stop offset="100%" stopColor="#0369A1" />
            </linearGradient>

            {/* Soft Ambient Cross Glow */}
            <linearGradient id="medikiosk-grad-cross" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="100%" stopColor="#0EA5A8" />
            </linearGradient>

            {/* Shield / Outer Base Gradient */}
            <linearGradient id="medikiosk-grad-base" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#E6F7F7" />
              <stop offset="100%" stopColor="#E0F2FE" />
            </linearGradient>

            <filter id="soft-shadow" x="-10%" y="-10%" width="130%" height="130%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#0EA5A8" floodOpacity="0.2" />
            </filter>
          </defs>

          {/* Rounded Hexagonal / Shield Base Container */}
          <rect
            x="6"
            y="6"
            width="88"
            height="88"
            rx="24"
            fill="url(#medikiosk-grad-base)"
            stroke="#D9E4E5"
            strokeWidth="2"
          />

          {/* Geometric Letter 'M' Outer Arches */}
          <path
            d="M24 74 V36 C24 30 29 25 35 25 C41 25 46 30 50 36 C54 30 59 25 65 25 C71 25 76 30 76 36 V74"
            stroke="url(#medikiosk-grad-primary)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#soft-shadow)"
          />

          {/* Center Healthcare Cross Symbol */}
          {/* Vertical Cross Bar */}
          <rect
            x="46"
            y="44"
            width="8"
            height="24"
            rx="4"
            fill="url(#medikiosk-grad-cross)"
          />
          {/* Horizontal Cross Bar */}
          <rect
            x="38"
            y="52"
            width="24"
            height="8"
            rx="4"
            fill="url(#medikiosk-grad-cross)"
          />

          {/* AI Digital Neural Nodes (Points of intelligence) */}
          <circle cx="24" cy="74" r="4.5" fill="#0EA5A8" />
          <circle cx="76" cy="74" r="4.5" fill="#0284C7" />
          <circle cx="50" cy="24" r="3.5" fill="#38BDF8" />
          <circle cx="50" cy="56" r="2.5" fill="#FFFFFF" />
        </svg>
      </div>

      {/* Typography: Brand Name + Optional Subtitle */}
      {variant === 'full' && (
        <div className="flex flex-col leading-none">
          <div className="flex items-center tracking-tight">
            <span className={`text-lg sm:text-xl font-extrabold ${textColor}`}>
              Medi
            </span>
            <span className="text-lg sm:text-xl font-extrabold bg-gradient-to-r from-[#0EA5A8] to-[#0284C7] bg-clip-text text-transparent">
              Kiosk
            </span>
          </div>
          <span className="text-[9px] font-bold tracking-widest text-[#0EA5A8] uppercase mt-0.5 font-mono">
            Smart Hospital AI
          </span>
        </div>
      )}
    </div>
  );
};
