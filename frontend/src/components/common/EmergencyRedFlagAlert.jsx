import React, { useState } from 'react';
import {
  AlertTriangle,
  PhoneCall,
  Siren,
  Ambulance,
  Hospital,
  ChevronDown,
  ChevronUp,
  X,
  ShieldAlert,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const EmergencyRedFlagAlert = ({
  redFlag,
  onAcknowledge,
  isModalOpen = false,
  onCloseModal,
  onOpenModal,
}) => {
  const [showFirstAid, setShowFirstAid] = useState(false);
  const [triageNotified, setTriageNotified] = useState(false);

  if (!redFlag || !redFlag.isRedFlag) return null;

  const categories = redFlag.matchedCategories || [];
  const primary = redFlag.primaryCategory || categories[0] || {
    emoji: '🚨',
    category: 'Emergency Medical Condition',
    name: 'High-Priority Emergency Symptoms',
    symptoms: redFlag.message || 'Critical symptoms detected requiring urgent clinical care.',
    alert: 'Some symptoms described may require urgent medical attention. Inform triage nursing staff immediately.',
    immediateAction: 'Seek immediate evaluation at the nearest emergency department. Call 112 / 108.',
  };

  const handleNotifyTriage = () => {
    setTriageNotified(true);
    setTimeout(() => setTriageNotified(false), 5000);
  };

  return (
    <>
      {/* ------------------------------------------------------------- */}
      {/* 1. TOP PINNED HIGH-IMPACT EMERGENCY BANNER                     */}
      {/* ------------------------------------------------------------- */}
      <div className="relative overflow-hidden bg-gradient-to-r from-rose-950 via-rose-900 to-red-900 text-white border-b-2 border-rose-500 shadow-xl px-4 py-3 sm:px-6 sm:py-3.5 animate-fadeIn">
        {/* Pulsing Emergency Accent Glow */}
        <div className="absolute inset-0 bg-rose-500/15 animate-pulse pointer-events-none" />

        <div className="relative max-w-6xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          
          {/* Left: Category Badge & Message */}
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-2xl bg-rose-600/60 border border-rose-400 flex items-center justify-center shrink-0 shadow-md">
              <Siren className="w-5 h-5 text-white animate-bounce" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="bg-rose-600 text-white text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border border-rose-400/40 shadow-xs flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                  RED FLAG EMERGENCY ALERT
                </span>
                <span className="text-xs sm:text-sm font-bold text-rose-100 flex items-center gap-1.5">
                  <span className="text-base">{primary.emoji}</span>
                  <span>{primary.category}</span>
                </span>
              </div>

              <p className="text-xs text-rose-200/95 mt-1 line-clamp-2 leading-relaxed">
                <strong>Symptoms detected:</strong> {primary.symptoms}
              </p>
            </div>
          </div>

          {/* Right: Emergency Quick Actions */}
          <div className="flex items-center gap-2 flex-wrap w-full md:w-auto justify-end shrink-0">
            {/* Call 112 National Emergency */}
            <a
              href="tel:112"
              className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-rose-50 text-rose-900 text-xs font-bold flex items-center gap-1.5 shadow-md hover:shadow-lg transition-all cursor-pointer transform active:scale-95"
              title="Call National Emergency (112)"
            >
              <PhoneCall className="w-3.5 h-3.5 text-rose-600" />
              <span>Call 112</span>
            </a>

            {/* Call 108 Ambulance */}
            <a
              href="tel:108"
              className="px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-md hover:shadow-lg transition-all cursor-pointer transform active:scale-95"
              title="Call Ambulance (108)"
            >
              <Ambulance className="w-3.5 h-3.5 text-slate-950" />
              <span>Ambulance (108)</span>
            </a>

            {/* View Full Protocol / Guidance Modal */}
            {onOpenModal && (
              <button
                type="button"
                onClick={onOpenModal}
                className="px-3 py-1.5 rounded-xl bg-rose-800/80 hover:bg-rose-800 border border-rose-400/30 text-rose-100 text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-rose-300" />
                <span>View Protocol</span>
              </button>
            )}

            {/* Dismiss / Acknowledge Banner */}
            {onAcknowledge && (
              <button
                type="button"
                onClick={onAcknowledge}
                className="p-1.5 rounded-lg text-rose-300 hover:text-white hover:bg-rose-800/50 transition-colors cursor-pointer"
                title="Acknowledge alert"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. FULL CLINICAL EMERGENCY MODAL DIALOG                        */}
      {/* ------------------------------------------------------------- */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border-2 border-rose-500 overflow-hidden text-slate-900"
            >
              {/* Header */}
              <div className="p-5 sm:p-6 bg-gradient-to-r from-rose-700 via-rose-600 to-red-600 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center shrink-0">
                    <span className="text-2xl">{primary.emoji}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest bg-white text-rose-700 px-2 py-0.5 rounded-full">
                      HIGH-PRIORITY RED FLAG
                    </span>
                    <h3 className="text-lg sm:text-xl font-bold mt-1 text-white">
                      {primary.category} Emergency
                    </h3>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onCloseModal}
                  className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-5 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                
                {/* Clinical Urgency Warning */}
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start gap-3">
                  <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
                  <div className="text-xs sm:text-sm leading-relaxed">
                    <strong className="block font-bold text-rose-950 mb-1">
                      Urgent Emergency Attention Required
                    </strong>
                    <p>{primary.alert}</p>
                  </div>
                </div>

                {/* Detected Symptoms List */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                    Reported Symptoms Triggering Red Flag
                  </span>
                  <div className="space-y-2">
                    {categories.length > 0 ? (
                      categories.map((c, idx) => (
                        <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-800">
                          <span className="text-base">{c.emoji}</span>
                          <div>
                            <strong className="text-slate-900 font-semibold">{c.category}: </strong>
                            <span>{c.symptoms}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-700">{primary.symptoms}</p>
                    )}
                  </div>
                </div>

                {/* First-Aid & Immediate Actions Accordion */}
                <div className="border border-slate-200 rounded-2xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setShowFirstAid(!showFirstAid)}
                    className="w-full p-3.5 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-left transition-colors cursor-pointer"
                  >
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-[#0EA5A8]" />
                      Immediate Action & First-Aid Instructions
                    </span>
                    {showFirstAid ? (
                      <ChevronUp className="w-4 h-4 text-slate-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-500" />
                    )}
                  </button>

                  {showFirstAid && (
                    <div className="p-4 bg-white text-xs text-slate-700 leading-relaxed border-t border-slate-200 space-y-2">
                      <p className="font-semibold text-slate-900">{primary.immediateAction}</p>
                      <ul className="list-disc pl-5 space-y-1 text-slate-600">
                        <li>Do not attempt to drive or travel alone if dizzy, short of breath, or in severe pain.</li>
                        <li>Inform a family member, caregiver, or hospital staff immediately.</li>
                        <li>Keep your medical documents, current medications, and ID ready for the physician.</li>
                      </ul>
                    </div>
                  )}
                </div>

                {/* Quick One-Tap Emergency Hotlines */}
                <div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                    Direct Emergency Hotlines
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <a
                      href="tel:112"
                      className="p-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-between shadow-sm hover:shadow-md transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                          <PhoneCall className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <span className="text-xs font-bold block">112 Emergency</span>
                          <span className="text-[10px] text-rose-100">National Emergency Support</span>
                        </div>
                      </div>
                      <ExternalLink className="w-4 h-4 text-rose-200" />
                    </a>

                    <a
                      href="tel:108"
                      className="p-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 flex items-center justify-between shadow-sm hover:shadow-md transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-slate-950/15 flex items-center justify-center">
                          <Ambulance className="w-4 h-4 text-slate-950" />
                        </div>
                        <div>
                          <span className="text-xs font-black block">108 Ambulance</span>
                          <span className="text-[10px] text-slate-800">Direct Medical Transport</span>
                        </div>
                      </div>
                      <ExternalLink className="w-4 h-4 text-slate-700" />
                    </a>
                  </div>
                </div>

                {/* Notify Hospital Triage Button */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleNotifyTriage}
                    disabled={triageNotified}
                    className={`w-full py-3 px-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer ${
                      triageNotified
                        ? 'bg-emerald-600 text-white'
                        : 'bg-[#0EA5A8] hover:bg-[#0c8f91] text-white'
                    }`}
                  >
                    {triageNotified ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>✓ Alert Dispatched to Hospital Nursing Station!</span>
                      </>
                    ) : (
                      <>
                        <Hospital className="w-4 h-4" />
                        <span>Dispatch Priority Alert to Hospital Triage Station</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between flex-wrap gap-2">
                <span className="text-[11px] text-slate-500">
                  AI Triage Assistant • Always evaluated by attending physician
                </span>
                <button
                  type="button"
                  onClick={onCloseModal}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  I Understand, Continue Consultation
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
