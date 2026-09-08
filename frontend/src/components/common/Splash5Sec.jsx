import React, { useState, useEffect } from 'react';
import { MediKioskLogo } from './MediKioskLogo';
import { Activity, ShieldCheck, Sparkles } from 'lucide-react';

/**
 * 5-Second Calm & Premium Healthcare Splash Screen
 * 0.0s – 1.0s: Logo smoothly appears (scale + soft glow)
 * 1.0s – 2.0s: MEDIKIOSK text appears
 * 2.0s – 3.0s: Tagline & Supporting subtitle appear
 * 3.0s – 4.5s: Subtle medical AI loading pulse ("Preparing your experience...")
 * 4.5s – 5.0s: Smooth fade-out
 * 5.0s: Main website appears
 */
export const Splash5Sec = ({ onComplete }) => {
  const [phase, setPhase] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Exact timing phases per specification
    const t1 = setTimeout(() => setPhase(1), 1000);
    const t2 = setTimeout(() => setPhase(2), 2000);
    const t3 = setTimeout(() => setPhase(3), 3000);
    const t4 = setTimeout(() => setPhase(4), 4500);
    const t5 = setTimeout(() => {
      onComplete();
    }, 5000);

    // Smooth progress counter for phase 3
    const interval = setInterval(() => {
      setProgress((prev) => (prev < 100 ? prev + 3 : 100));
    }, 45);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
      clearInterval(interval);
    };
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#F3F8F8] text-[#172033] select-none transition-opacity duration-500 ${
        phase === 4 ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Calm ambient background gradients */}
      <div className="absolute w-[600px] h-[600px] bg-[#0EA5A8]/6 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute w-[400px] h-[400px] bg-[#0284C7]/6 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative flex flex-col items-center max-w-lg px-6 text-center z-10">
        
        {/* Phase 0 (0.0s – 1.0s): Logo smoothly appears */}
        <div
          className={`transition-all duration-700 ease-out transform ${
            phase >= 0 ? 'scale-100 opacity-100' : 'scale-75 opacity-0'
          }`}
        >
          <div className="relative p-3.5 rounded-3xl bg-white border border-[#D9E4E5] shadow-xl shadow-[#0EA5A8]/10 mb-6">
            <MediKioskLogo size={84} variant="icon" animated={phase >= 3} />
            {/* Subtle medical breathing ring */}
            <div className="absolute -inset-2.5 rounded-[32px] border border-[#0EA5A8]/20 animate-pulse pointer-events-none" />
          </div>
        </div>

        {/* Phase 1 (1.0s – 2.0s): MEDIKIOSK text appears */}
        <div
          className={`transition-all duration-700 ease-out transform ${
            phase >= 1 ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          }`}
        >
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-[#172033]">
            MEDI<span className="bg-gradient-to-r from-[#0EA5A8] to-[#0284C7] bg-clip-text text-transparent">KIOSK</span>
          </h1>
        </div>

        {/* Phase 2 (2.0s – 3.0s): Tagline & Subtitle */}
        <div
          className={`mt-3 space-y-2 transition-all duration-700 ease-out transform ${
            phase >= 2 ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          }`}
        >
          <p className="text-base sm:text-lg font-semibold text-[#0EA5A8] tracking-wide">
            Your Smart Hospital Assistant
          </p>
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white border border-[#D9E4E5] text-xs font-semibold text-[#64748B] shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-[#0EA5A8]" />
            <span>AI-Powered Healthcare</span>
          </div>
        </div>

        {/* Phase 3 (3.0s – 4.5s): Subtle medical AI loading animation */}
        <div
          className={`mt-8 w-72 transition-all duration-500 ease-out ${
            phase >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-[#64748B] mb-2 font-medium">
            <span className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-[#0EA5A8] animate-pulse" />
              <span>Preparing your experience...</span>
            </span>
            <span className="text-[#0EA5A8] font-mono font-bold">{Math.min(100, Math.round(progress))}%</span>
          </div>
          <div className="h-1.5 w-full bg-[#EAF3F3] rounded-full overflow-hidden p-0.5 border border-[#D9E4E5]">
            <div
              className="h-full bg-gradient-to-r from-[#0EA5A8] to-[#0284C7] rounded-full transition-all duration-75"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Skip button for repeat testing */}
        <button
          onClick={onComplete}
          className="mt-6 text-xs text-[#64748B] hover:text-[#172033] font-medium transition-colors hover:underline"
        >
          Skip preview
        </button>

      </div>
    </div>
  );
};
