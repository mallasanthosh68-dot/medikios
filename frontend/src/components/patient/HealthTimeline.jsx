import React, { useState, useEffect } from 'react';
import {
  Clock,
  FileText,
  Pill,
  Stethoscope,
  Bot,
  Activity,
  Calendar,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { api } from '../../services/api';

export const HealthTimeline = () => {
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTimeline();
  }, []);

  const fetchTimeline = async () => {
    setLoading(true);
    try {
      const res = await api.get('/patients/timeline');
      if (res.success) {
        setTimeline(res.timeline);
      }
    } catch (err) {
      console.error('Failed to load timeline:', err);
    } finally {
      setLoading(false);
    }
  };

  const getEventIcon = (type) => {
    switch (type) {
      case 'LAB_TEST':
        return <FileText className="w-4 h-4 text-emerald-600" />;
      case 'PRESCRIPTION':
        return <Pill className="w-4 h-4 text-[#0EA5A8]" />;
      case 'CONSULTATION':
        return <Stethoscope className="w-4 h-4 text-[#0284C7]" />;
      case 'AI_CHECKUP':
        return <Bot className="w-4 h-4 text-purple-600" />;
      default:
        return <Activity className="w-4 h-4 text-[#64748B]" />;
    }
  };

  const getBadgeColor = (type) => {
    switch (type) {
      case 'LAB_TEST':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'PRESCRIPTION':
        return 'bg-[#E6F7F7] text-[#0EA5A8] border-[#0EA5A8]/20';
      case 'CONSULTATION':
        return 'bg-[#E0F2FE] text-[#0284C7] border-[#0284C7]/20';
      case 'AI_CHECKUP':
        return 'bg-purple-50 text-purple-800 border-purple-200';
      default:
        return 'bg-[#F8FAFC] text-[#64748B] border-[#D9E4E5]';
    }
  };

  return (
    <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#D9E4E5] shadow-sm">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#D9E4E5] gap-3 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E6F7F7] border border-[#0EA5A8]/20 text-xs font-semibold text-[#0EA5A8] mb-2">
            <Clock className="w-3.5 h-3.5" />
            <span>Chronological Care History</span>
          </div>
          <h2 className="text-2xl font-bold text-[#172033] tracking-tight">My Health Timeline</h2>
          <p className="text-xs text-[#64748B] mt-1">
            Complete longitudinal overview of your previous diagnostic tests, prescriptions, and consultations.
          </p>
        </div>
        <span className="text-xs font-mono text-[#172033] bg-[#F8FAFC] px-3 py-1.5 rounded-xl border border-[#D9E4E5] self-start sm:self-auto">
          {timeline.length} Milestones Recorded
        </span>
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs text-[#64748B]">Loading your medical timeline...</div>
      ) : timeline.length === 0 ? (
        <div className="py-12 text-center text-xs text-[#64748B]">
          No medical history records found. Start an AI Health Check-up to add your first timeline milestone.
        </div>
      ) : (
        <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-[#D9E4E5]">
          {timeline.map((item, idx) => (
            <div key={item._id || idx} className="relative group">
              
              {/* Milestone Bullet */}
              <div className="absolute -left-6 sm:-left-8 top-1.5 w-6 h-6 rounded-full bg-white border-2 border-[#0EA5A8] flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
                <span className="w-2 h-2 rounded-full bg-[#0EA5A8]" />
              </div>

              {/* Card */}
              <div className="bg-[#F8FAFC] p-5 rounded-2xl border border-[#D9E4E5] ml-2 shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black font-mono text-[#0EA5A8] bg-[#E6F7F7] px-2 py-0.5 rounded">
                      {item.year || new Date(item.eventDate).getFullYear()}
                    </span>
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md border ${getBadgeColor(item.eventType)}`}>
                      {item.eventType.replace('_', ' ')}
                    </span>
                  </div>

                  <span className="text-[11px] text-[#64748B] font-mono">
                    {new Date(item.eventDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-[#172033] mb-1.5 flex items-center gap-2">
                  {getEventIcon(item.eventType)}
                  <span>{item.title}</span>
                </h4>

                <p className="text-xs text-[#64748B] leading-relaxed">{item.summary}</p>

                <div className="mt-3 pt-3 border-t border-[#D9E4E5] flex flex-wrap items-center justify-between text-[11px] text-[#64748B] gap-2">
                  <span>Facility / Physician: <strong className="text-[#172033]">{item.doctorOrFacility}</strong></span>
                  
                  {item.keyMetrics && item.keyMetrics.length > 0 && (
                    <div className="flex items-center gap-2">
                      {item.keyMetrics.map((m, mi) => (
                        <span key={mi} className="px-2 py-0.5 rounded bg-white border border-[#D9E4E5] text-[10px] font-mono text-[#0EA5A8]">
                          {m.label}: {m.value}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
};
