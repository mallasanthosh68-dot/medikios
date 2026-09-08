import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import {
  HeartPulse,
  LogIn,
  UserPlus,
  LogOut,
  Globe,
  ChevronDown,
  Stethoscope,
  User,
  Search,
  Check,
  X,
  Menu,
  LayoutDashboard,
  MessageSquareHeart,
  FileText,
  FileCheck,
  FileCheck2,
  Clock,
  UserCheck,
  Pill,
  Inbox,
  Users,
  Home,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { MediKioskLogo } from './MediKioskLogo';
import { ScrollProgressBar } from './ScrollProgressBar';

export const Navbar = ({
  activeSection,
  setActiveSection,
  onOpenLogin,
  onOpenRegister,
  currentView,
  setCurrentView,
  activeDashboardTab,
  onNavigateDashboardTab,
  sidebarOpen = true,
  onToggleSidebar,
}) => {
  const { role, logout, isAuthenticated, user } = useAuth();
  const { currentLanguage, setLanguage, languages, currentLanguageInfo, t } = useLanguage();

  const [langModalOpen, setLangModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const isDashboardView = isAuthenticated && (currentView === 'patient' || currentView === 'doctor');

  const publicNavLinks = useMemo(() => [
    { id: 'home', label: t('Home', 'Home'), icon: Home },
    { id: 'how-it-works', label: t('How It Works', 'How It Works') },
    { id: 'features', label: t('Features', 'Features') },
    { id: 'team', label: t('Team', 'Team') },
    { id: 'about', label: t('About', 'About') },
  ], [t]);

  const patientNavLinks = useMemo(() => [
    { id: 'dashboard', label: t('Dashboard', 'Dashboard'), icon: LayoutDashboard },
    { id: 'interview', label: t('AI Health Check-Up', 'AI Health Check-Up'), icon: Sparkles },
    { id: 'records', label: t('Medical Records', 'Medical Records'), icon: FileText },
    { id: 'summary', label: t('Health Summary', 'Health Summary'), icon: FileCheck },
    { id: 'prescriptions', label: t('Prescriptions', 'Prescriptions'), icon: Pill },
    { id: 'timeline', label: t('Timeline', 'Timeline'), icon: Clock },
    { id: 'doctors', label: t('Doctors', 'Doctors'), icon: UserCheck },
    { id: 'home', label: t('Public Site', 'Public Site'), icon: Home },
  ], [t]);

  const doctorNavLinks = useMemo(() => [
    { id: 'dashboard', label: t('Dashboard', 'Dashboard'), icon: LayoutDashboard },
    { id: 'requests', label: t('Patient Queue', 'Patient Queue'), icon: Inbox },
    { id: 'patients', label: t('Patients', 'Patients'), icon: Users },
    { id: 'summaries', label: t('Clinical Summaries', 'Clinical Summaries'), icon: FileCheck2 },
    { id: 'medicines', label: t('Medicine Search', 'Medicine Search'), icon: Search },
    { id: 'prescriptions', label: t('Prescriptions', 'Prescriptions'), icon: Pill },
    { id: 'home', label: t('Public Site', 'Public Site'), icon: Home },
  ], [t]);

  const displayedLinks = useMemo(() => {
    if (!isAuthenticated) return publicNavLinks;
    if (role === 'doctor') return doctorNavLinks;
    return patientNavLinks;
  }, [isAuthenticated, role, publicNavLinks, doctorNavLinks, patientNavLinks]);

  const isLinkActive = (id) => {
    if (!isAuthenticated) {
      return activeSection === id && currentView === 'public';
    }
    if (id === 'home') {
      return currentView === 'public';
    }
    if (id === 'interview') {
      return currentView === 'ai-checkup' || (currentView === 'patient' && activeDashboardTab === 'interview');
    }
    return currentView === role && activeDashboardTab === id;
  };

  const handleNavClick = (id) => {
    if (!isAuthenticated) {
      if (id === 'integrations') {
        setCurrentView('integrations');
        return;
      }
      setCurrentView('public');
      setActiveSection(id);
      const elem = document.getElementById(id);
      if (elem) {
        elem.scrollIntoView({ behavior: 'smooth' });
      }
      return;
    }

    // Authenticated Sector Navigation
    if (onNavigateDashboardTab) {
      onNavigateDashboardTab(id);
    } else {
      if (id === 'home') {
        setCurrentView('public');
        setActiveSection('home');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setCurrentView(role);
      }
    }
  };

  const categories = [
    { id: 'all', label: `All (${languages.length})` },
    { id: 'popular', label: 'Popular (12)' },
    { id: 'north', label: 'North & Central' },
    { id: 'south', label: 'South' },
    { id: 'east', label: 'East' },
    { id: 'northeast', label: 'North-East & Tribal' },
    { id: 'classical', label: 'Classical / Sanskrit' },
  ];

  const filteredLanguages = useMemo(() => {
    let list = languages;

    if (categoryFilter === 'popular') {
      list = list.filter((l) => l.popular);
    } else if (categoryFilter === 'north') {
      const codes = ['hi', 'pa', 'mai', 'ks', 'ne', 'doi', 'dhn', 'kru', 'kfq', 'hlb', 'sd', 'ur', 'gu'];
      list = list.filter((l) => codes.includes(l.code));
    } else if (categoryFilter === 'south') {
      const codes = ['te', 'ta', 'kn', 'ml', 'kff', 'gon'];
      list = list.filter((l) => codes.includes(l.code));
    } else if (categoryFilter === 'east') {
      const codes = ['bn', 'as', 'or', 'sat', 'bho', 'mag'];
      list = list.filter((l) => codes.includes(l.code));
    } else if (categoryFilter === 'northeast') {
      const codes = ['mni', 'brx', 'lus', 'ao', 'kha', 'grt', 'njz', 'lep', 'sit'];
      list = list.filter((l) => codes.includes(l.code));
    } else if (categoryFilter === 'classical') {
      const codes = ['sa', 'pali', 'pra'];
      list = list.filter((l) => codes.includes(l.code));
    }

    if (!searchQuery.trim()) return list;

    const query = searchQuery.toLowerCase().trim();
    return list.filter(
      (lang) =>
        lang.name.toLowerCase().includes(query) ||
        lang.nativeName.toLowerCase().includes(query) ||
        lang.code.toLowerCase().includes(query) ||
        (lang.region && lang.region.toLowerCase().includes(query))
    );
  }, [languages, categoryFilter, searchQuery]);

  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      key={currentLanguage}
      data-no-dom-translate="true"
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        isDashboardView
          ? 'bg-white border-b border-[#D9E4E5] shadow-xs'
          : isScrolled
          ? 'bg-white/90 backdrop-blur-md shadow-xs border-b border-[#D9E4E5]/80 py-0'
          : 'bg-white/70 backdrop-blur-xs border-b border-transparent py-1'
      }`}
    >
      {!isDashboardView && <ScrollProgressBar />}
      <div className={`w-full flex items-center justify-between transition-all duration-300 ${
        isDashboardView
          ? 'h-16 px-4 sm:px-6'
          : `max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 xl:px-8 gap-1.5 sm:gap-2.5 ${isScrolled ? 'h-16 sm:h-17' : 'h-18 sm:h-20'}`
      }`}>
        {/* LEFT: Side Menu Bar Toggle Icon (In Dashboard) + Application Logo & Name */}
        <div className="flex items-center gap-3 shrink-0">
          {isDashboardView && (
            <button
              onClick={onToggleSidebar}
              className="p-2 rounded-xl bg-white hover:bg-[#F3F8F8] text-[#172033] border border-[#D9E4E5] hover:border-[#0EA5A8] transition-all shadow-xs flex items-center justify-center cursor-pointer"
              title={sidebarOpen ? t('Close sidebar', 'Close sidebar') : t('Open sidebar', 'Open sidebar')}
              aria-label="Toggle navigation sidebar"
            >
              <Menu className="w-5 h-5 text-[#0EA5A8]" />
            </button>
          )}

          <div
            onClick={() => {
              if (isDashboardView) {
                if (onNavigateDashboardTab) onNavigateDashboardTab('dashboard');
              } else {
                setCurrentView('public');
                setActiveSection('home');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
            className="cursor-pointer group select-none shrink-0 flex items-center gap-2.5"
          >
            <MediKioskLogo size={34} variant="full" />
          </div>
        </div>

        {/* CENTER: Marketing links on public view ONLY. Completely removed in dashboard view per user request. */}
        {!isDashboardView ? (
          <div className="hidden lg:flex flex-1 min-w-0 items-center justify-center px-1">
            <nav className="flex items-center gap-0.5 xl:gap-1 bg-[#F3F8F8] p-1 rounded-full border border-[#D9E4E5] overflow-x-auto scrollbar-none max-w-full">
              {publicNavLinks.map((link) => {
                const Icon = link.icon;
                const active = isLinkActive(link.id);
                return (
                  <button
                    key={`${currentLanguage}-${link.id}`}
                    onClick={() => handleNavClick(link.id)}
                    className={`relative flex items-center gap-1 xl:gap-1.5 px-2.5 xl:px-3 py-1.5 rounded-full text-[11px] xl:text-xs font-semibold whitespace-nowrap transition-colors shrink-0 cursor-pointer ${
                      active
                        ? 'text-white font-bold'
                        : 'text-[#64748B] hover:text-[#172033] hover:bg-white'
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="public-navbar-active-pill"
                        className="absolute inset-0 bg-[#0EA5A8] rounded-full shadow-xs -z-10"
                        transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-1 xl:gap-1.5">
                      {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
                      <span>{link.label}</span>
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>
        ) : (
          <div className="flex-1" />
        )}

        {/* RIGHT: 51-Language Selector + User Profile Name & Logout */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 justify-end">
          {/* Direct 51-Language Selector Trigger Button */}
          <div className="relative">
            <button
              onClick={() => setLangModalOpen(true)}
              className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-xl bg-white border border-[#D9E4E5] text-xs font-medium text-[#172033] hover:border-[#0EA5A8] hover:bg-[#E6F7F7]/60 transition-all shadow-xs max-w-[115px] sm:max-w-[145px] shrink-0 cursor-pointer"
              title="Select from 51 Indian Languages"
            >
              <Globe className="w-3.5 h-3.5 text-[#0EA5A8] shrink-0" />
              <span className="font-bold text-[#0EA5A8] truncate">
                {currentLanguageInfo.nativeName}
              </span>
              <ChevronDown className="w-3 h-3 text-[#64748B] shrink-0" />
            </button>
          </div>

          {/* If Authenticated: User Profile (With User Name, NOT OP ID) & Logout */}
          {isAuthenticated ? (
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <button
                onClick={() => {
                  if (isDashboardView) {
                    if (onNavigateDashboardTab) onNavigateDashboardTab('profile');
                  } else {
                    setCurrentView(role === 'doctor' ? 'doctor' : 'patient');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                }}
                className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-white hover:bg-[#F3F8F8] border border-[#D9E4E5] hover:border-[#0EA5A8] text-xs font-semibold text-[#172033] shadow-xs transition-all cursor-pointer shrink-0 max-w-[160px] sm:max-w-[190px]"
                title={t('User Profile', 'User Profile')}
              >
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0 ${
                  role === 'doctor' ? 'bg-[#0284C7]' : 'bg-[#0EA5A8]'
                }`}>
                  {user?.name ? user.name.charAt(0).toUpperCase() : (role === 'doctor' ? 'D' : 'P')}
                </div>
                <span className="truncate font-bold text-[#172033]">
                  {user?.name || user?.username || (role === 'doctor' ? 'Dr. Physician' : 'Patient')}
                </span>
              </button>

              <button
                onClick={logout}
                title={t('Logout', 'Logout')}
                className="p-1.5 sm:p-2 rounded-xl bg-white border border-[#D9E4E5] text-[#64748B] hover:text-[#DC2626] hover:border-[#DC2626]/40 transition-colors shrink-0 shadow-xs cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            /* TOP-RIGHT ONLY: Login and Create Account Buttons for unauthenticated users */
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <button
                onClick={onOpenLogin}
                className="flex items-center gap-1 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-white hover:bg-[#F3F8F8] text-[#172033] border border-[#D9E4E5] text-xs font-semibold transition-all whitespace-nowrap shrink-0 shadow-xs cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5 text-[#0EA5A8] shrink-0" />
                <span key={`login-${currentLanguage}`}>{t('Login', 'Login')}</span>
              </button>

              <button
                onClick={onOpenRegister}
                className="flex items-center gap-1 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-[#0EA5A8] hover:bg-[#0C8F92] text-white text-xs font-semibold shadow-sm hover:shadow transition-all whitespace-nowrap shrink-0 cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5 shrink-0" />
                <span key={`register-${currentLanguage}`} className="hidden sm:inline">{t('Create Account', 'Create Account')}</span>
                <span key={`register-short-${currentLanguage}`} className="sm:hidden">{t('Register', 'Register')}</span>
              </button>
            </div>
          )}

          {/* Mobile Menu Hamburger Toggle (ONLY visible on public marketing view for mobile) */}
          {!isDashboardView && (
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl bg-white border border-[#D9E4E5] text-[#172033] hover:border-[#0EA5A8] transition-colors shrink-0 shadow-xs cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Mobile Navigation Drawer (strictly for public marketing view) */}
      {!isDashboardView && mobileMenuOpen && (
        <div className="lg:hidden border-t border-[#D9E4E5] bg-white px-4 py-3 space-y-1 animate-in slide-in-from-top-2 duration-150 shadow-md max-h-[70vh] overflow-y-auto">
          {publicNavLinks.map((link) => {
            const Icon = link.icon;
            const active = isLinkActive(link.id);
            return (
              <button
                key={`mob-${currentLanguage}-${link.id}`}
                onClick={() => {
                  handleNavClick(link.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-2.5 text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  active
                    ? 'bg-[#E6F7F7] text-[#0EA5A8] font-bold'
                    : 'text-[#64748B] hover:bg-[#F3F8F8] hover:text-[#172033]'
                }`}
              >
                {Icon && <Icon className="w-4 h-4 shrink-0" />}
                <span>{link.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* 51-LANGUAGE COMPREHENSIVE SEARCHABLE MODAL (Rendered to body via createPortal) */}
      {langModalOpen && createPortal(
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-6 bg-slate-900/40 backdrop-blur-sm overflow-y-auto"
          onClick={() => setLangModalOpen(false)}
        >
          <div
            className="relative w-full max-w-3xl bg-white border border-[#D9E4E5] rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[85vh] animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-[#D9E4E5] flex items-center justify-between bg-[#F3F8F8] shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#E6F7F7] border border-[#0EA5A8]/20 flex items-center justify-center text-[#0EA5A8] shrink-0">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-[#172033] flex items-center gap-2 flex-wrap">
                    <span>{t('Select Website & AI Voice Language', 'Select Website & AI Voice Language')}</span>
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#E6F7F7] text-[#0EA5A8] font-bold border border-[#0EA5A8]/20">
                      51 Languages
                    </span>
                  </h3>
                  <p className="text-[11px] sm:text-xs text-[#64748B]">
                    The entire website interface, clinical questions, and voice AI will turn into your chosen language.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setLangModalOpen(false)}
                className="p-2 rounded-xl text-[#64748B] hover:text-[#172033] hover:bg-slate-100 transition-colors shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Dropdown & Search Bar */}
            <div className="p-3 sm:p-4 border-b border-[#D9E4E5] bg-white space-y-3 shrink-0">
              {/* Instant Native Select Dropdown */}
              <div className="flex items-center gap-2">
                <label htmlFor="modal-lang-select" className="text-xs font-semibold text-[#172033] shrink-0">
                  {t('Quick Jump:', 'Quick Jump:')}
                </label>
                <select
                  id="modal-lang-select"
                  value={currentLanguage}
                  onChange={(e) => {
                    setLanguage(e.target.value);
                    setLangModalOpen(false);
                  }}
                  className="flex-1 px-3 py-2 rounded-xl bg-[#F3F8F8] border border-[#D9E4E5] text-xs font-medium text-[#0EA5A8] focus:outline-none focus:border-[#0EA5A8] transition-colors cursor-pointer"
                >
                  {languages.map((l, idx) => (
                    <option key={l.code} value={l.code}>
                      {idx + 1}. {l.nativeName} ({l.name}) — {l.region}
                    </option>
                  ))}
                </select>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('Search from 51 languages...', 'Search 51 languages (e.g. Tamil, Marathi, বাংলা, తెలుగు, Sanskrit, Gondi...)')}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#F3F8F8] border border-[#D9E4E5] text-xs sm:text-sm text-[#172033] placeholder-[#64748B] focus:outline-none focus:border-[#0EA5A8] transition-colors"
                  autoFocus
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#172033]"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Category Filter Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
                {categories.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setCategoryFilter(c.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                      categoryFilter === c.id
                        ? 'bg-[#0EA5A8] text-white shadow-xs'
                        : 'bg-[#F3F8F8] text-[#64748B] hover:text-[#172033] border border-[#D9E4E5]'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 51 Languages Scrollable Grid */}
            <div className="p-3 sm:p-4 overflow-y-auto flex-1 min-h-0 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {filteredLanguages.map((lang, idx) => {
                const isSelected = currentLanguage === lang.code;
                return (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setLanguage(lang.code);
                      setLangModalOpen(false);
                    }}
                    className={`flex items-center justify-between p-3 rounded-2xl border text-left transition-all group ${
                      isSelected
                        ? 'bg-[#E6F7F7] border-[#0EA5A8] shadow-xs'
                        : 'bg-white border-[#D9E4E5] hover:bg-[#F3F8F8] hover:border-[#CBD5E1]'
                    }`}
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-[#64748B] font-mono">
                          {idx + 1}.
                        </span>
                        <span className={`text-sm font-bold truncate ${isSelected ? 'text-[#0EA5A8]' : 'text-[#172033] group-hover:text-[#0EA5A8]'}`}>
                          {lang.nativeName}
                        </span>
                      </div>
                      <div className="text-xs text-[#64748B] truncate">
                        {lang.name}
                      </div>
                      <div className="text-[10px] text-[#94A3B8] mt-0.5 truncate">
                        {lang.region}
                      </div>
                    </div>

                    {isSelected ? (
                      <div className="w-6 h-6 rounded-full bg-[#0EA5A8] text-white flex items-center justify-center shrink-0">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-[#F3F8F8] border border-[#D9E4E5] text-[#64748B] group-hover:text-[#172033] flex items-center justify-center shrink-0 text-[10px] font-mono">
                        {lang.code.toUpperCase()}
                      </div>
                    )}
                  </button>
                );
              })}

              {filteredLanguages.length === 0 && (
                <div className="col-span-full py-8 text-center text-[#64748B] text-xs">
                  No language found matching "{searchQuery}".
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 border-t border-[#D9E4E5] bg-[#F3F8F8] flex items-center justify-between text-xs text-[#64748B] flex-wrap gap-2 shrink-0">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#0EA5A8]"></span>
                Active: <strong className="text-[#172033]">{currentLanguageInfo.nativeName} ({currentLanguageInfo.name})</strong>
              </span>
              <span className="text-[11px] text-[#64748B]">
                Showing {filteredLanguages.length} of {languages.length} Available
              </span>
            </div>
          </div>
        </div>,
        document.body
      )}
    </header>
  );
};

