import React from 'react';

/**
 * Official MediKiosk Brand Logo
 * Core components per official brand specification:
 * 1. Red / Coral Heart (#FF7676 to #EF4444)
 * 2. Crisp White ECG Waveform pulsing across the heart
 * 3. Deep Blue / Healthcare Teal Medical Cross (#00A8B3 / #004F57 / #0284C7)
 */
export const MediKioskLogo = ({
  size = 38,
  variant = 'full', // 'full' | 'icon' | 'mark'
  className = '',
  textColor = 'text-[#1A1F36]',
  animated = false,
}) => {
  const iconSize = typeof size === 'number' ? size : parseInt(size, 10) || 38;

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Official Brand SVG Emblem: Red Heart + White ECG Waveform + Blue Cross */}
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
            {/* Red / Coral Heart Gradient */}
            <linearGradient id="mk-heart-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FF7676" />
              <stop offset="60%" stopColor="#EF4444" />
              <stop offset="100%" stopColor="#DC2626" />
            </linearGradient>

            {/* Blue Medical Cross Gradient */}
            <linearGradient id="mk-cross-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00A8B3" />
              <stop offset="60%" stopColor="#0284C7" />
              <stop offset="100%" stopColor="#004F57" />
            </linearGradient>

            {/* Soft Ambient Glow */}
            <filter id="mk-glow" x="-15%" y="-15%" width="130%" height="130%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#FF7676" floodOpacity="0.28" />
            </filter>
          </defs>

          {/* Background Soft Disc for Clean Visual Contrast */}
          <circle cx="50" cy="50" r="46" fill="#F0F8FF" stroke="#E8EFF5" strokeWidth="1.5" />

          {/* Blue Medical Cross (Layered in the healthcare foundation) */}
          <g id="mk-blue-cross">
            {/* Vertical Bar */}
            <rect
              x="62"
              y="12"
              width="14"
              height="36"
              rx="4"
              fill="url(#mk-cross-grad)"
              stroke="#FFFFFF"
              strokeWidth="2"
            />
            {/* Horizontal Bar */}
            <rect
              x="51"
              y="23"
              width="36"
              height="14"
              rx="4"
              fill="url(#mk-cross-grad)"
              stroke="#FFFFFF"
              strokeWidth="2"
            />
          </g>

          {/* Red/Coral Heart Silhouette */}
          <path
            id="mk-coral-heart"
            d="M50 86 C47 83 20 62 14 44 C8 26 22 14 36 18 C43 20 48 26 50 30 C52 26 57 20 64 18 C70 16 76 18 80 22 C78 24 76 27 75 30 C72 38 68 45 62 50 C58 53 54 56 50 86 Z"
            fill="url(#mk-heart-grad)"
            filter="url(#mk-glow)"
          />

          {/* Primary Coral Heart Shape (Curved anatomical base) */}
          <path
            d="M48 84 C45 81 21 61 15 44 C9 27 23 15 36 19 C43 21 47 27 49 31 C51 27 55 21 62 19 C74 15 88 27 82 44 C76 61 52 81 48 84 Z"
            fill="url(#mk-heart-grad)"
          />

          {/* Secondary Integrated Healthcare Cross Badge */}
          <g transform="translate(62, 14)">
            <rect x="7" y="0" width="8" height="22" rx="3" fill="#00A8B3" stroke="#FFFFFF" strokeWidth="1.5" />
            <rect x="0" y="7" width="22" height="8" rx="3" fill="#00A8B3" stroke="#FFFFFF" strokeWidth="1.5" />
          </g>

          {/* Crisp White ECG Waveform Running Horizontally across the Heart */}
          <path
            d="M17 48 L31 48 L35 40 L40 58 L46 32 L51 62 L55 45 L59 50 L63 48 L79 48"
            stroke="#FFFFFF"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Pulse Node Spark */}
          <circle cx="46" cy="32" r="2.2" fill="#FFFFFF" />
        </svg>
      </div>

      {/* Typography: Official MediKiosk Brand Name */}
      {variant === 'full' && (
        <div className="flex flex-col leading-none">
          <div className="flex items-center tracking-tight">
            <span className={`text-lg sm:text-xl font-extrabold ${textColor}`}>
              Medi
            </span>
            <span className="text-lg sm:text-xl font-extrabold text-[#00A8B3]">
              Kiosk
            </span>
          </div>
          <span className="text-[9px] font-bold tracking-wider text-[#004F57] uppercase mt-0.5 font-sans">
            AI Patient Case-Taking
          </span>
        </div>
      )}
    </div>
  );
};
