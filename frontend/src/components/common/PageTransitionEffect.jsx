import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Activity, ShieldCheck, Stethoscope, Globe } from 'lucide-react';

const SECTOR_INFO = {
  public: {
    title: 'MediKiosk Smart Hospital AI',
    badge: 'Public Portal',
    icon: Globe,
    textColor: 'text-[#0EA5A8]',
    borderColor: 'border-[#0EA5A8]/30',
    bgColor: 'bg-[#E6F7F7]',
  },
  patient: {
    title: 'Patient Hospital Workspace',
    badge: 'OPD Token Active',
    icon: Activity,
    textColor: 'text-[#0EA5A8]',
    borderColor: 'border-[#0EA5A8]/30',
    bgColor: 'bg-[#E6F7F7]',
  },
  doctor: {
    title: 'Clinical Physician Station',
    badge: 'NMC Verified',
    icon: Stethoscope,
    textColor: 'text-[#0284C7]',
    borderColor: 'border-[#0284C7]/30',
    bgColor: 'bg-[#E0F2FE]',
  },
  'ai-checkup': {
    title: 'AI Clinical Pre-Consultation',
    badge: 'Multi-lingual Triage',
    icon: Sparkles,
    textColor: 'text-[#8B5CF6]',
    borderColor: 'border-[#8B5CF6]/30',
    bgColor: 'bg-[#F5F3FF]',
  },
  integrations: {
    title: 'ABDM & Hospital Systems Hub',
    badge: 'HL7 / FHIR Standards',
    icon: ShieldCheck,
    textColor: 'text-[#0EA5A8]',
    borderColor: 'border-[#0EA5A8]/30',
    bgColor: 'bg-[#E6F7F7]',
  },
};

export const PageTransitionEffect = ({ currentView }) => {
  const [showNotification, setShowNotification] = useState(false);
  const [beamKey, setBeamKey] = useState(0);

  useEffect(() => {
    // Retrigger laser sweep beam and floating HUD badge on view change
    setBeamKey((prev) => prev + 1);
    setShowNotification(true);

    const timer = setTimeout(() => {
      setShowNotification(false);
    }, 1800);

    return () => clearTimeout(timer);
  }, [currentView]);

  const currentSector = SECTOR_INFO[currentView] || SECTOR_INFO.public;
  const SectorIcon = currentSector.icon;

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {/* 1. KINETIC LASER SWEEP BEAM AT TOP */}
      <motion.div
        key={`beam-${beamKey}`}
        initial={{ x: '-100%', opacity: 0.95 }}
        animate={{ x: '100%', opacity: 0 }}
        transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
        className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-[#0EA5A8] to-[#0284C7] shadow-[0_0_16px_#0ea5a8,0_0_30px_#0284c7]"
      />

      {/* 2. AMBIENT ETHEREAL HALO BURST */}
      <motion.div
        key={`halo-${beamKey}`}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: [0, 0.35, 0], scale: [0.8, 1.25, 1.6] }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] rounded-full blur-3xl"
        style={{
          background:
            'radial-gradient(ellipse at 50% 0%, rgba(14, 165, 168, 0.22) 0%, rgba(2, 132, 199, 0.12) 40%, transparent 75%)',
        }}
      />

      {/* 3. CLINICAL HUD SECTOR ANNOUNCEMENT PILL */}
      <AnimatePresence>
        {showNotification && (
          <motion.div
            initial={{ opacity: 0, y: -24, scale: 0.95, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -16, scale: 0.96, filter: 'blur(3px)' }}
            transition={{ type: 'spring', stiffness: 450, damping: 32 }}
            className="absolute top-20 left-1/2 -translate-x-1/2 flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/95 backdrop-blur-md border border-[#D9E4E5] shadow-lg text-xs font-semibold text-[#172033]"
          >
            <div className={`w-6 h-6 rounded-lg ${currentSector.bgColor} border ${currentSector.borderColor} flex items-center justify-center shrink-0`}>
              <SectorIcon className={`w-3.5 h-3.5 ${currentSector.textColor}`} />
            </div>

            <div className="flex items-center gap-2">
              <span className="font-bold text-[#172033] tracking-tight">
                {currentSector.title}
              </span>
              <span className="inline-block w-1 h-1 rounded-full bg-[#94A3B8]" />
              <span className={`text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-full ${currentSector.bgColor} ${currentSector.textColor} border ${currentSector.borderColor}`}>
                {currentSector.badge}
              </span>
            </div>

            <div className="flex items-center pl-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0EA5A8] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0EA5A8]"></span>
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
