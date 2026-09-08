import React from 'react';
import { ExternalLink } from 'lucide-react';
import { MediKioskLogo } from './MediKioskLogo';

export const Footer = ({ onNavigateSection, onOpenIntegrations }) => {
  const linkClass =
    "relative after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[1.5px] after:bg-[#0EA5A8] hover:after:w-full after:transition-all after:duration-250 pb-0.5 hover:text-[#172033] transition-colors cursor-pointer";

  return (
    <footer className="border-t border-[#D9E4E5] bg-white text-[#64748B] text-xs py-10 relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
        
        <div className="flex items-center gap-3">
          <MediKioskLogo size={32} />
          <div>
            <span className="font-bold text-[#172033] text-sm">
              Medi<span className="text-[#0EA5A8]">Kiosk</span>
            </span>
            <span className="block text-[10px] text-[#64748B]">Your Smart Hospital Assistant</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 text-[#64748B] font-medium">
          <button onClick={() => onNavigateSection('home')} className={linkClass}>
            Home
          </button>
          <button onClick={() => onNavigateSection('how-it-works')} className={linkClass}>
            How It Works
          </button>
          <button onClick={() => onNavigateSection('features')} className={linkClass}>
            Features
          </button>
          <button onClick={() => onNavigateSection('team')} className={linkClass}>
            Team
          </button>
          <button
            onClick={onOpenIntegrations}
            className="text-[#0EA5A8] hover:text-[#0C8F92] transition-colors flex items-center gap-1 font-semibold relative after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[1.5px] after:bg-[#0EA5A8] hover:after:w-full after:transition-all after:duration-250 pb-0.5 cursor-pointer"
          >
            <span>ABDM / FHIR Hub</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>

        <div className="text-center md:text-right text-[11px] text-[#64748B]">
          <p>© {new Date().getFullYear()} MediKiosk. Built with Apple-inspired medical simplicity.</p>
          <p className="mt-0.5">Dual Role Separation • Zero-Trust OP Verification</p>
        </div>

      </div>
    </footer>
  );
};
