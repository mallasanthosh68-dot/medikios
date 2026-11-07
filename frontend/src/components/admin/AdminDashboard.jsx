import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  Users,
  Stethoscope,
  FileText,
  TrendingUp,
  Activity,
  Sparkles,
  RefreshCw,
  LogOut,
  Clock,
  ArrowUpRight,
  BarChart3,
  Layers,
  HeartPulse,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';

export const AdminDashboard = ({ onLogout }) => {
  const { user } = useAuth();

  // Three Core Administrative Metrics
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalDoctors: 0,
    totalSummaries: 0,
  });

  // AI Dynamic Graph & Auto-Detected Telemetry
  const [aiGraph, setAiGraph] = useState({
    timeline7d: [],
    timeline14d: [],
    timeline30d: [],
    insights: {
      aiGrowthRate: '+0%',
      peakHour: '10:00 - 12:00',
      avgCheckupTime: '2.8 mins',
      triageAccuracy: '99.4%',
      specialtyDistribution: [],
      totalTriageRuns: 0,
      redFlagsDetected: 0,
    },
  });

  // Graph Controls: Timeframe ('7d' | '14d' | '30d') and Metric
  const [timeframe, setTimeframe] = useState('7d');
  const [selectedMetric, setSelectedMetric] = useState('checkups'); // 'checkups' | 'patients' | 'triage'
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // Live Auto-Detection & Sync State
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(new Date());
  const [syncCountdown, setSyncCountdown] = useState(10);
  const [notification, setNotification] = useState('');

  // Fetch Live Metrics & Auto-Detected Trends
  const loadAdminData = useCallback(async (isManual = false) => {
    try {
      if (isManual) setIsSyncing(true);
      const res = await api.get('/admin/overview');
      if (res.success) {
        if (res.counts) {
          setStats({
            totalPatients: res.counts.totalPatients ?? 0,
            totalDoctors: res.counts.totalDoctors ?? 0,
            totalSummaries: res.counts.totalSummaries ?? 0,
          });
        }
        if (res.aiGraph) {
          setAiGraph(res.aiGraph);
        }
        setLastSyncTime(new Date());
        setSyncCountdown(10);
        if (isManual) {
          setNotification('AI Data Engine Synced with Live Hospital Grid');
          setTimeout(() => setNotification(''), 3500);
        }
      }
    } catch (err) {
      console.warn('[AdminDashboard] Live sync warning:', err?.message);
    } finally {
      if (isManual) setIsSyncing(false);
    }
  }, []);

  // 10-Second Auto-Refresh Loop
  useEffect(() => {
    loadAdminData(true);
    const pollInterval = setInterval(() => {
      loadAdminData(false);
    }, 10000);

    return () => clearInterval(pollInterval);
  }, [loadAdminData]);

  // 1-Second Countdown Ticker for Live AI Sync
  useEffect(() => {
    const countdownTimer = setInterval(() => {
      setSyncCountdown((prev) => (prev <= 1 ? 10 : prev - 1));
    }, 1000);

    return () => clearInterval(countdownTimer);
  }, []);

  // Current active timeline data based on selected timeframe
  const currentTimeline =
    timeframe === '30d'
      ? aiGraph.timeline30d
      : timeframe === '14d'
      ? aiGraph.timeline14d
      : aiGraph.timeline7d;

  // Extract metric values for the graph
  const getMetricValue = (item) => {
    if (!item) return 0;
    if (selectedMetric === 'patients') return item.totalUsers || item.newPatients || 0;
    if (selectedMetric === 'triage') return item.aiTriageRuns || item.checkins || 0;
    return item.checkins || 0;
  };

  const metricValues = currentTimeline.map((item) => getMetricValue(item));
  const maxMetricVal = Math.max(...metricValues, 5);
  const peakIndex = metricValues.indexOf(Math.max(...metricValues));

  // Compute SVG coordinate points
  const svgWidth = 800;
  const svgHeight = 240;
  const padLeft = 40;
  const padRight = 40;
  const padTop = 30;
  const padBottom = 30;
  const innerWidth = svgWidth - padLeft - padRight;
  const innerHeight = svgHeight - padTop - padBottom;

  const points = currentTimeline.map((item, idx) => {
    const val = getMetricValue(item);
    const x = padLeft + (currentTimeline.length > 1 ? (idx / (currentTimeline.length - 1)) * innerWidth : innerWidth / 2);
    const y = padTop + innerHeight - (val / maxMetricVal) * innerHeight;
    return { x, y, val, item, idx };
  });

  const pathD = points.length > 0
    ? points.reduce((acc, pt, i) => {
        if (i === 0) return `M ${pt.x} ${pt.y}`;
        const prev = points[i - 1];
        const cx1 = prev.x + (pt.x - prev.x) / 2;
        const cy1 = prev.y;
        const cx2 = prev.x + (pt.x - prev.x) / 2;
        const cy2 = pt.y;
        return `${acc} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${pt.x} ${pt.y}`;
      }, '')
    : '';

  const areaD = points.length > 0
    ? `${pathD} L ${points[points.length - 1].x} ${padTop + innerHeight} L ${points[0].x} ${padTop + innerHeight} Z`
    : '';

  return (
    <div className="flex-1 flex flex-col bg-[#F3F8F8] text-[#172033] min-h-screen">
      {/* Dynamic Toast Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 right-6 z-50 bg-[#7C3AED] text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-semibold border border-purple-300"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
            <span>{notification}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Header Bar */}
      <header className="bg-white border-b border-[#D9E4E5] px-6 py-4 shadow-xs sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#7C3AED] to-[#6366F1] flex items-center justify-center text-white shadow-md shadow-purple-500/20 shrink-0">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold text-[#172033] tracking-tight">
                  MediKiosk Admin Portal
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-[#7C3AED] border border-purple-200">
                  Super Admin
                </span>
              </div>
              <p className="text-xs text-[#64748B]">
                Hospital Governance & Real-Time AI Telemetry
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Live Auto-Detection Pill */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>AI Auto-Detect Active</span>
              <span className="text-[10px] font-mono bg-emerald-200/60 text-emerald-900 px-1.5 py-0.2 rounded font-bold">
                {syncCountdown}s
              </span>
            </div>

            {/* Manual Sync Button */}
            <button
              onClick={() => loadAdminData(true)}
              disabled={isSyncing}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors cursor-pointer disabled:opacity-60"
              title="Force AI Refresh Now"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-[#7C3AED]' : ''}`} />
              <span className="hidden md:inline">AI Sync Now</span>
            </button>

            {/* Logout Button */}
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-semibold border border-rose-200 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Administrative View */}
      <main className="max-w-7xl mx-auto w-full p-6 space-y-6 flex-1">
        
        {/* ========================================================================= */}
        {/* ROW 1: THE THREE CORE METRICS                                            */}
        {/* 1. Number of Patients Used                                                */}
        {/* 2. Number of Doctors                                                      */}
        {/* 3. Number of Health Summaries                                             */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          
          {/* METRIC 1: NUMBER OF PATIENTS USED */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white border border-[#D9E4E5] hover:border-[#0EA5A8] rounded-3xl p-6 shadow-xs transition-all relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none" />
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block">
                  Number of Patients Used
                </span>
                <div className="text-3xl sm:text-4xl font-black text-[#172033] mt-2 tracking-tight">
                  {stats.totalPatients}
                </div>
              </div>
              <div className="w-13 h-13 rounded-2xl bg-teal-50 text-[#0EA5A8] border border-teal-100 flex items-center justify-center shadow-xs shrink-0 group-hover:scale-105 transition-transform">
                <Users className="w-7 h-7" />
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-[#64748B] font-medium flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Total unique patients served
              </span>
              <span className="px-2 py-0.5 rounded-full bg-teal-50 text-[#0EA5A8] text-[10px] font-bold border border-teal-200">
                Live Auto-Detected
              </span>
            </div>
          </motion.div>

          {/* METRIC 2: NUMBER OF DOCTORS */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05 }}
            className="bg-white border border-[#D9E4E5] hover:border-[#0284C7] rounded-3xl p-6 shadow-xs transition-all relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/5 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none" />
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block">
                  Number of Doctors
                </span>
                <div className="text-3xl sm:text-4xl font-black text-[#172033] mt-2 tracking-tight">
                  {stats.totalDoctors}
                </div>
              </div>
              <div className="w-13 h-13 rounded-2xl bg-sky-50 text-[#0284C7] border border-sky-100 flex items-center justify-center shadow-xs shrink-0 group-hover:scale-105 transition-transform">
                <Stethoscope className="w-7 h-7" />
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-[#64748B] font-medium flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-sky-500" />
                Active Medical Staff & Specialists
              </span>
              <span className="px-2 py-0.5 rounded-full bg-sky-50 text-[#0284C7] text-[10px] font-bold border border-sky-200">
                Verified On-Duty
              </span>
            </div>
          </motion.div>

          {/* METRIC 3: NUMBER OF HEALTH SUMMARIES */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="bg-white border border-[#D9E4E5] hover:border-[#7C3AED] rounded-3xl p-6 shadow-xs transition-all relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none" />
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block">
                  Number of Health Summaries
                </span>
                <div className="text-3xl sm:text-4xl font-black text-[#172033] mt-2 tracking-tight">
                  {stats.totalSummaries}
                </div>
              </div>
              <div className="w-13 h-13 rounded-2xl bg-purple-50 text-[#7C3AED] border border-purple-100 flex items-center justify-center shadow-xs shrink-0 group-hover:scale-105 transition-transform">
                <FileText className="w-7 h-7" />
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-[#64748B] font-medium flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-500" />
                AI Triage & Clinical Summaries
              </span>
              <span className="px-2 py-0.5 rounded-full bg-purple-50 text-[#7C3AED] text-[10px] font-bold border border-purple-200">
                OP Tickets Generated
              </span>
            </div>
          </motion.div>

        </div>

        {/* ========================================================================= */}
        {/* ROW 2: AI DYNAMIC GRAPH (AUTO-DETECTING & SELF-UPDATING)                 */}
        {/* Automatically detects user check-ins, summaries & changes graph over time */}
        {/* ========================================================================= */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="bg-white border border-[#D9E4E5] rounded-3xl p-6 sm:p-8 shadow-xs space-y-6"
        >
          {/* Graph Header with Controls */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-[#D9E4E5]">
            <div>
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-[#7C3AED] border border-purple-200 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  AI Self-Updating Graph
                </span>
                <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  {aiGraph.insights.aiGrowthRate} Auto-Detected Trajectory
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#172033] tracking-tight">
                AI Auto-Detect User & Health Summary Analytics
              </h2>
              <p className="text-xs text-[#64748B] mt-1 max-w-2xl">
                The neural analytics engine continuously monitors incoming patient check-ins, OP tokens, and clinical summaries, dynamically re-rendering growth curves in real-time.
              </p>
            </div>

            {/* Timeframe & Metric Selectors */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Metric Selector Toggle */}
              <div className="flex items-center p-1 bg-[#F8FAFC] rounded-xl border border-[#D9E4E5] text-xs">
                <button
                  onClick={() => setSelectedMetric('checkups')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                    selectedMetric === 'checkups'
                      ? 'bg-[#7C3AED] text-white shadow-xs'
                      : 'text-[#64748B] hover:text-[#172033]'
                  }`}
                >
                  Checkups & Summaries
                </button>
                <button
                  onClick={() => setSelectedMetric('patients')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                    selectedMetric === 'patients'
                      ? 'bg-[#0EA5A8] text-white shadow-xs'
                      : 'text-[#64748B] hover:text-[#172033]'
                  }`}
                >
                  Total Patients
                </button>
                <button
                  onClick={() => setSelectedMetric('triage')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                    selectedMetric === 'triage'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-[#64748B] hover:text-[#172033]'
                  }`}
                >
                  AI Triage Runs
                </button>
              </div>

              {/* Timeframe Range Toggle */}
              <div className="flex items-center p-1 bg-[#F8FAFC] rounded-xl border border-[#D9E4E5] text-xs">
                <button
                  onClick={() => setTimeframe('7d')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                    timeframe === '7d'
                      ? 'bg-slate-800 text-white shadow-xs'
                      : 'text-[#64748B] hover:text-[#172033]'
                  }`}
                >
                  7 Days
                </button>
                <button
                  onClick={() => setTimeframe('14d')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                    timeframe === '14d'
                      ? 'bg-slate-800 text-white shadow-xs'
                      : 'text-[#64748B] hover:text-[#172033]'
                  }`}
                >
                  14 Days
                </button>
                <button
                  onClick={() => setTimeframe('30d')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                    timeframe === '30d'
                      ? 'bg-slate-800 text-white shadow-xs'
                      : 'text-[#64748B] hover:text-[#172033]'
                  }`}
                >
                  30 Days
                </button>
              </div>
            </div>
          </div>

          {/* Graph Legend & Status Sub-Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#64748B]">
            <div className="flex items-center gap-4 flex-wrap">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#7C3AED]" />
                <span className="font-semibold text-slate-700">Daily Summaries & Checkups</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#0EA5A8]" />
                <span className="font-semibold text-slate-700">Patient Registrations</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="font-semibold text-slate-700">Auto-Detected Peak Day</span>
              </span>
            </div>

            <div className="text-[11px] font-mono text-purple-700 font-bold bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-100 flex items-center gap-1.5 self-start sm:self-auto">
              <Clock className="w-3 h-3 text-purple-600" />
              <span>Peak Triage Window: {aiGraph.insights.peakHour}</span>
            </div>
          </div>

          {/* DYNAMIC SVG VECTOR GRAPH CONTAINER */}
          <div className="relative w-full bg-gradient-to-b from-[#FAF5FF]/30 to-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-4 sm:p-6 overflow-hidden">
            
            {/* Subtle Grid Lines */}
            <div className="absolute inset-0 flex flex-col justify-between p-6 pointer-events-none opacity-30">
              <div className="border-b border-dashed border-slate-300 w-full" />
              <div className="border-b border-dashed border-slate-300 w-full" />
              <div className="border-b border-dashed border-slate-300 w-full" />
              <div className="border-b border-dashed border-slate-300 w-full" />
            </div>

            {/* SVG Graph Render */}
            <div className="w-full overflow-x-auto">
              <svg
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                className="w-full h-56 sm:h-72 min-w-[550px] overflow-visible"
              >
                <defs>
                  {/* Purple/Violet Gradient for Summaries */}
                  <linearGradient id="aiGraphGradPurple" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#7C3AED" stopOpacity="0.0" />
                  </linearGradient>

                  {/* Teal Gradient for Patients */}
                  <linearGradient id="aiGraphGradTeal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0EA5A8" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#0EA5A8" stopOpacity="0.0" />
                  </linearGradient>

                  {/* Emerald Gradient for Triage */}
                  <linearGradient id="aiGraphGradEmerald" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                  </linearGradient>

                  <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>

                {/* Shaded Area Under Curve */}
                {areaD && (
                  <path
                    d={areaD}
                    fill={
                      selectedMetric === 'patients'
                        ? 'url(#aiGraphGradTeal)'
                        : selectedMetric === 'triage'
                        ? 'url(#aiGraphGradEmerald)'
                        : 'url(#aiGraphGradPurple)'
                    }
                  />
                )}

                {/* Main Dynamic Vector Curve */}
                {pathD && (
                  <path
                    d={pathD}
                    fill="none"
                    stroke={
                      selectedMetric === 'patients'
                        ? '#0EA5A8'
                        : selectedMetric === 'triage'
                        ? '#10B981'
                        : '#7C3AED'
                    }
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    filter="url(#glow)"
                  />
                )}

                {/* Vertical Bar Columns & Interactive Points */}
                {points.map((pt, i) => {
                  const isPeak = i === peakIndex && pt.val > 0;
                  const isHovered = hoveredPoint?.idx === i;
                  const colColor =
                    selectedMetric === 'patients'
                      ? '#0EA5A8'
                      : selectedMetric === 'triage'
                      ? '#10B981'
                      : '#7C3AED';

                  return (
                    <g key={i} className="cursor-pointer">
                      {/* Interactive Column Hover Hitbox */}
                      <rect
                        x={pt.x - 18}
                        y={padTop}
                        width={36}
                        height={innerHeight}
                        fill="transparent"
                        onMouseEnter={() => setHoveredPoint(pt)}
                        onMouseLeave={() => setHoveredPoint(null)}
                      />

                      {/* Translucent Guide Line on Hover */}
                      {isHovered && (
                        <line
                          x1={pt.x}
                          y1={padTop}
                          x2={pt.x}
                          y2={padTop + innerHeight}
                          stroke={colColor}
                          strokeWidth="1.5"
                          strokeDasharray="3 3"
                        />
                      )}

                      {/* Column Bar Base */}
                      <rect
                        x={pt.x - 6}
                        y={pt.y}
                        width={12}
                        height={padTop + innerHeight - pt.y}
                        rx={4}
                        fill={isPeak ? '#10B981' : colColor}
                        opacity={isHovered ? 0.9 : 0.25}
                        className="transition-all duration-200"
                        onMouseEnter={() => setHoveredPoint(pt)}
                        onMouseLeave={() => setHoveredPoint(null)}
                      />

                      {/* Data Point Dot */}
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={isHovered ? 6 : isPeak ? 5 : 3.5}
                        fill="#FFFFFF"
                        stroke={isPeak ? '#10B981' : colColor}
                        strokeWidth={isHovered ? 3.5 : 2.5}
                        className="transition-all duration-200 pointer-events-none"
                      />

                      {/* Peak Badge Label */}
                      {isPeak && (
                        <g className="pointer-events-none">
                          <rect
                            x={pt.x - 22}
                            y={pt.y - 24}
                            width={44}
                            height={16}
                            rx={8}
                            fill="#10B981"
                          />
                          <text
                            x={pt.x}
                            y={pt.y - 12}
                            fill="#FFFFFF"
                            fontSize="9"
                            fontWeight="bold"
                            textAnchor="middle"
                          >
                            PEAK
                          </text>
                        </g>
                      )}

                      {/* Bottom X-Axis Label */}
                      <text
                        x={pt.x}
                        y={padTop + innerHeight + 18}
                        fill="#64748B"
                        fontSize="10"
                        fontWeight="600"
                        textAnchor="middle"
                        className="pointer-events-none"
                      >
                        {pt.item.date || pt.item.day?.split(' ')[0] || `D${i+1}`}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Hover Tooltip Overlay */}
            <AnimatePresence>
              {hoveredPoint && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-4 left-6 z-20 bg-slate-900/95 backdrop-blur-md text-white px-4 py-3 rounded-xl shadow-2xl border border-slate-700 text-xs pointer-events-none"
                >
                  <div className="font-bold text-slate-200 border-b border-slate-700/80 pb-1 mb-1.5 flex items-center justify-between gap-3">
                    <span>{hoveredPoint.item.day}</span>
                    <span className="text-[10px] font-mono text-emerald-400">AI Verified Record</span>
                  </div>
                  <div className="space-y-1 text-slate-300">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-slate-400">Checkups & Summaries:</span>
                      <b className="text-white">{hoveredPoint.item.checkins}</b>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-slate-400">Cumulative Patients:</span>
                      <b className="text-teal-400">{hoveredPoint.item.totalUsers}</b>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-slate-400">AI Triage Runs:</span>
                      <b className="text-purple-400">{hoveredPoint.item.aiTriageRuns}</b>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </div>

          {/* ========================================================================= */}
          {/* AI AUTO-DETECTED NARRATIVE INSIGHTS PANEL                                */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            
            {/* Insight 1: Dynamic Growth Acceleration */}
            <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200/80 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#7C3AED] uppercase tracking-wide">
                    AI Growth Acceleration
                  </span>
                  <ArrowUpRight className="w-4 h-4 text-[#7C3AED]" />
                </div>
                <div className="text-2xl font-black text-purple-950 mt-1">
                  {aiGraph.insights.aiGrowthRate}
                </div>
              </div>
              <p className="text-[11px] text-purple-800 mt-2">
                Auto-calculated patient velocity based on kiosk OPD and digital summary submissions.
              </p>
            </div>

            {/* Insight 2: Peak Hospital Load Window */}
            <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-200/80 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#0EA5A8] uppercase tracking-wide">
                    Peak Triage Window
                  </span>
                  <Clock className="w-4 h-4 text-[#0EA5A8]" />
                </div>
                <div className="text-2xl font-black text-teal-950 mt-1">
                  {aiGraph.insights.peakHour}
                </div>
              </div>
              <p className="text-[11px] text-teal-800 mt-2">
                Derived from database timestamps of patient symptom intake and doctor review dispatches.
              </p>
            </div>

            {/* Insight 3: Top Auto-Detected Specialties */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                    Top Clinical Specialties
                  </span>
                  <HeartPulse className="w-4 h-4 text-slate-600" />
                </div>
                <div className="mt-2 space-y-1.5">
                  {aiGraph.insights.specialtyDistribution?.slice(0, 2).map((spec, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <span className="text-slate-600 truncate max-w-[170px]">{spec.name}</span>
                      <span className="font-bold text-slate-800">{spec.percentage}%</span>
                    </div>
                  )) || (
                    <span className="text-xs text-slate-400">General Medicine (100%)</span>
                  )}
                </div>
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                Auto-classified from chief complaints and diagnostic AI summaries.
              </p>
            </div>

          </div>

          {/* Footer Telemetry Ticker */}
          <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-[#64748B]">
            <div className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Last detected: {lastSyncTime.toLocaleTimeString()}</span>
              <span>•</span>
              <span>Next automatic AI poll in {syncCountdown}s</span>
            </div>
            <div className="text-[#64748B] font-medium">
              MediKiosk Autonomous Clinical AI Engine • SIH 2026
            </div>
          </div>

        </motion.div>

      </main>
    </div>
  );
};
