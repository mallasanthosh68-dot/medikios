import React, { useState } from 'react';
import {
  Bot,
  User,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Mic,
  FileText,
  Maximize2,
  Minimize2,
} from 'lucide-react';

export const AIBotSummaryAssistant = ({ summary }) => {
  if (!summary) return null;

  const interviewResponses = (summary.interviewResponses && summary.interviewResponses.length > 0)
    ? summary.interviewResponses
    : (summary.responses && summary.responses.length > 0)
    ? summary.responses
    : [];

  const [isFullView, setIsFullView] = useState(true);
  const [isExpanded, setIsExpanded] = useState(true);

  if (interviewResponses.length === 0) {
    return null;
  }

  return (
    <div className="bg-white border-2 border-[#0EA5A8] rounded-3xl p-5 sm:p-7 shadow-sm space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#D9E4E5]">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#0EA5A8] text-white flex items-center justify-center shrink-0 shadow-sm">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#0EA5A8] bg-[#E6F7F7] px-2.5 py-0.5 rounded-full border border-[#0EA5A8]/20">
                Full Intake Conversation Dialogue
              </span>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                {interviewResponses.length} Q&amp;A Turns Logged
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-black text-[#172033] mt-0.5">
              AI Bot &amp; Patient Intake Conversation
            </h3>
            <p className="text-xs text-[#64748B]">
              Complete dialogue showing every question asked by the AI Bot and the exact answer replied by the patient.
            </p>
          </div>
        </div>

        {/* View Controls */}
        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
          {interviewResponses.length > 3 && isExpanded && (
            <button
              type="button"
              onClick={() => setIsFullView(!isFullView)}
              className="px-3 py-1.5 rounded-xl bg-[#F8FAFC] hover:bg-[#E6F7F7] border border-[#D9E4E5] hover:border-[#0EA5A8]/40 text-[#172033] hover:text-[#0EA5A8] text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
              title={isFullView ? 'Switch to compact scroll view' : 'Show all turns at once'}
            >
              {isFullView ? <Minimize2 className="w-3.5 h-3.5 text-[#0EA5A8]" /> : <Maximize2 className="w-3.5 h-3.5 text-[#0EA5A8]" />}
              <span>{isFullView ? 'Compact Scroll' : 'Show All Turns'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-3 py-1.5 rounded-xl bg-[#F8FAFC] hover:bg-[#E6F7F7] border border-[#0EA5A8]/30 text-[#0EA5A8] text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4" />
                <span>Collapse</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                <span>View Full Conversation</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Turn-by-Turn Conversational Exchanges */}
      {isExpanded && (
        <div className={`space-y-3.5 pt-1 ${!isFullView ? 'max-h-[520px] overflow-y-auto pr-1 custom-scrollbar' : ''}`}>
          {interviewResponses.map((qa, idx) => (
            <div
              key={idx}
              className="p-4 sm:p-5 rounded-2xl bg-[#F8FAFC] border-2 border-[#D9E4E5] hover:border-[#0EA5A8]/40 shadow-2xs space-y-3 transition-all"
            >
              {/* Turn Header */}
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-200/60 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-lg bg-[#E6F7F7] text-[#0EA5A8] border border-[#0EA5A8]/30 font-mono text-xs font-black tracking-wider">
                    Turn {idx + 1}
                  </span>
                  <span className="text-xs font-bold text-[#172033] flex items-center gap-1.5">
                    <Bot className="w-4 h-4 text-[#0EA5A8]" />
                    <span>AI Bot &amp; Patient Exchange</span>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {qa.inputMode === 'voice' ? (
                    <span className="text-[10px] font-bold text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200 flex items-center gap-1">
                      <Mic className="w-3 h-3" /> Voice Intake
                    </span>
                  ) : qa.inputMode === 'document' || /uploaded|report|document/i.test(qa.question || '') ? (
                    <span className="text-[10px] font-bold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200 flex items-center gap-1">
                      <FileText className="w-3 h-3" /> Hospital Document
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-slate-700 bg-white px-2.5 py-0.5 rounded-full border border-slate-200 flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" /> Text Reply
                    </span>
                  )}
                  {qa.timestamp && (
                    <span className="text-[10px] font-mono text-[#94A3B8]">
                      {(() => {
                        try {
                          const d = new Date(qa.timestamp);
                          return !isNaN(d.getTime()) ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
                        } catch (e) {
                          return '';
                        }
                      })()}
                    </span>
                  )}
                </div>
              </div>

              {/* AI Question Box */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-[#0EA5A8]">
                  <Bot className="w-3.5 h-3.5 text-[#0EA5A8] shrink-0" />
                  <span>AI Clinical Bot Question Asked:</span>
                </div>
                <div className="p-3.5 rounded-xl bg-white border border-[#D9E4E5] text-xs sm:text-sm text-[#172033] font-medium leading-relaxed shadow-2xs">
                  {qa.question}
                </div>
              </div>

              {/* Patient Answer Box */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-teal-800">
                  <User className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                  <span>Patient Answer Given:</span>
                </div>
                <div className="p-3.5 rounded-xl bg-gradient-to-r from-[#E6F7F7]/70 via-[#F0FDFA]/50 to-white border border-[#0EA5A8]/30 text-xs sm:text-sm text-[#0F172A] font-semibold leading-relaxed shadow-2xs">
                  "{qa.answer}"
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
