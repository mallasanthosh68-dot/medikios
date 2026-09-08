import React, { useState, useEffect } from 'react';
import {
  Layers,
  ShieldCheck,
  Building2,
  Code,
  Download,
  Copy,
  Check,
  AlertCircle,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { api } from '../../services/api';

export const IntegrationsHub = () => {
  const [activeTab, setActiveTab] = useState('abdm');
  const [abdmStatus, setAbdmStatus] = useState(null);
  const [hisStatus, setHisStatus] = useState(null);
  const [fhirBundle, setFhirBundle] = useState(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchIntegrationData();
  }, []);

  const fetchIntegrationData = async () => {
    setLoading(true);
    try {
      const [abdm, his, fhir] = await Promise.all([
        api.get('/integrations/abdm/status').catch(() => null),
        api.get('/integrations/his/status').catch(() => null),
        api.get('/integrations/fhir/bundle').catch(() => null),
      ]);

      if (abdm) setAbdmStatus(abdm);
      if (his) setHisStatus(his);
      if (fhir?.bundle) setFhirBundle(fhir.bundle);
    } catch (err) {
      console.error('Error fetching integration data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyJson = () => {
    if (!fhirBundle) return;
    navigator.clipboard.writeText(JSON.stringify(fhirBundle, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="pt-24 pb-16 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
      
      {/* Top Banner */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/25 text-xs font-semibold text-teal-400 mb-2">
              <Layers className="w-3.5 h-3.5" />
              <span>Standards & Interoperability Architecture</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              MediKiosk Health Network Integration Hub
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              Demonstrating architectural compliance with ABDM, HL7 FHIR R4, and Hospital EMR specifications.
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs self-start sm:self-auto max-w-xs">
            <strong className="block font-semibold">Hackathon Transparency:</strong>
            All external network operations operate in <em>Demo / Simulation Mode</em>. No live government credentials claimed.
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="mt-6 flex flex-wrap gap-2">
          {[
            { id: 'abdm', label: 'ABDM Integration (M1 / M2 / M3)', icon: ShieldCheck },
            { id: 'fhir', label: 'HL7 FHIR R4 Live Bundle', icon: Code },
            { id: 'his', label: 'Hospital HIS / EMR Bridge', icon: Building2 },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-glow'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: ABDM INTEGRATION ARCHITECTURE */}
      {activeTab === 'abdm' && (
        <div className="space-y-6">
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">Ayushman Bharat Digital Mission (ABDM)</h3>
                <span className="text-xs text-teal-400 font-mono">Status: Prototype / Demo Mode</span>
              </div>
              <span className="px-3 py-1 rounded-full bg-slate-950 border border-slate-800 text-slate-400 font-mono text-xs">
                Sandbox Node: SBX_DEMO_00129
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                <span className="text-[10px] uppercase font-bold text-emerald-400 font-mono">Milestone 1 (M1)</span>
                <h4 className="text-sm font-bold text-white">ABHA ID Creation & Auth</h4>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Allows citizen registration using Demo OTP simulation to generate an ABHA Address (e.g. patient@abdm) without collecting raw Aadhaar identifiers.
                </p>
                <div className="pt-2 text-emerald-400 font-medium">✓ Architecture Implemented</div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                <span className="text-[10px] uppercase font-bold text-teal-400 font-mono">Milestone 2 (M2)</span>
                <h4 className="text-sm font-bold text-white">HIP: Health Records Sharing</h4>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Hospital acts as Health Information Provider, transforming OPD summaries, lab extractions, and prescriptions into FHIR bundles ready for encrypted gateway dispatch.
                </p>
                <div className="pt-2 text-teal-400 font-medium">✓ Architecture Implemented</div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                <span className="text-[10px] uppercase font-bold text-cyan-400 font-mono">Milestone 3 (M3)</span>
                <h4 className="text-sm font-bold text-white">HIU: Consent Manager</h4>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Captures informed patient consent artifacts before sharing summaries with doctors or pulling historical EMR reports via National Health Authority protocols.
                </p>
                <div className="pt-2 text-cyan-400 font-medium">✓ Architecture Implemented</div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-300">
              <strong className="text-white block mb-1">Production Deployment Roadmap:</strong>
              When deploying to a live hospital with Ministry of Health & Family Welfare approvals, this service interface (<code className="text-emerald-400">abdmService.js</code>) seamlessly connects to NHA Gateway APIs using TLS client certificates without altering the core triage engine.
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: HL7 FHIR R4 BUNDLE VIEWER */}
      {activeTab === 'fhir' && (
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
            <div>
              <h3 className="text-lg font-bold text-white">HL7 FHIR Release 4 JSON Bundle</h3>
              <p className="text-xs text-slate-400">
                Live structured data export mapping Patient, Condition, Observation, and MedicationRequest resources.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyJson}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy FHIR JSON'}</span>
              </button>

              <button
                onClick={() => {
                  const blob = new Blob([JSON.stringify(fhirBundle, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'medikiosk-fhir-bundle.json';
                  a.click();
                }}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-glow flex items-center gap-1.5 transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Bundle</span>
              </button>
            </div>
          </div>

          <div className="relative rounded-2xl bg-slate-950 border border-slate-800 p-4 font-mono text-xs text-emerald-300 max-h-[500px] overflow-y-auto">
            <pre className="whitespace-pre-wrap">
              {fhirBundle ? JSON.stringify(fhirBundle, null, 2) : '// Loading FHIR bundle...'}
            </pre>
          </div>
        </div>
      )}

      {/* TAB 3: HOSPITAL HIS EMR BRIDGE */}
      {activeTab === 'his' && (
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">Hospital Information System (HIS) Integration</h3>
              <span className="text-xs text-teal-400 font-mono">Status: Demo Mode</span>
            </div>
            <span className="px-3 py-1 rounded-full bg-slate-950 border border-slate-800 text-slate-400 font-mono text-xs">
              OpenEMR / Epic / Cerner Adapter
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-3">
              <h4 className="font-bold text-white text-sm">OPD Queue Dispatch Ticket</h4>
              <p className="text-slate-400 text-[11px]">
                When an AI triage summary is completed, an admission ticket is staged for the hospital's central queue system:
              </p>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 font-mono text-[11px] text-emerald-300 space-y-1">
                <div>OPD Token: OPD-TOKEN-842</div>
                <div>Queue Priority: STANDARD_QUEUE</div>
                <div>Department: General Medicine (Ground Floor Block C)</div>
                <div>Status: Queued for Doctor Assessment</div>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-3">
              <h4 className="font-bold text-white text-sm">EMR Historical Records Fetch</h4>
              <p className="text-slate-400 text-[11px]">
                Demonstrates pulling previous hospital admission encounters and lab test records based on phone number lookups:
              </p>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 font-mono text-[11px] text-cyan-300 space-y-1">
                <div>ENC-2024-891: Acute Gastritis (Dr. A. Sharma)</div>
                <div>ENC-2023-412: Annual Wellness Screening (Dr. P. Menon)</div>
                <div>Records Source: MediKiosk Apex Hospital EMR Core</div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
