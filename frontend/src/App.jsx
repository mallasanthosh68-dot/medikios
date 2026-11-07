import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Splash5Sec } from './components/common/Splash5Sec';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { HomePage } from './pages/HomePage';
import { LoginModal } from './components/modals/LoginModal';
import { RegisterModal } from './components/modals/RegisterModal';
import { PatientDashboard } from './components/patient/PatientDashboard';
import { DoctorDashboard } from './components/doctor/DoctorDashboard';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { IntegrationsHub } from './components/integrations/IntegrationsHub';
import { AICheckupPage } from './pages/AICheckupPage';
import { motion, AnimatePresence } from 'framer-motion';
import { PageTransitionEffect } from './components/common/PageTransitionEffect';

function MainApp() {
  const { user, role, isAuthenticated, logout } = useAuth();

  // 5-Second Splash screen (displays on initial app start)
  const [showSplash, setShowSplash] = useState(() => {
    return !sessionStorage.getItem('medikiosk_splash_shown');
  });

  // Current view: 'public' | 'patient' | 'doctor' | 'integrations' | 'ai-checkup'
  const [currentView, setCurrentView] = useState(() => {
    if (typeof window !== 'undefined' && window.location.pathname === '/patient/ai-checkup') {
      return 'ai-checkup';
    }
    return 'public';
  });
  const [activeSection, setActiveSection] = useState('home');
  const [activePatientSummary, setActivePatientSummary] = useState(null);

  // Sector Dashboard Active Tabs
  const [patientTab, setPatientTab] = useState('dashboard');
  const [doctorTab, setDoctorTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Modals state
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [loginRole, setLoginRole] = useState('patient');
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  // In-app navigation history stack for back button support
  const [navHistory, setNavHistory] = useState([]);

  const recordNavStep = (overrideState = {}) => {
    setNavHistory((prev) => [
      ...prev,
      {
        view: currentView,
        patientTab,
        doctorTab,
        activeSection,
        ...overrideState,
      },
    ]);
  };

  // Sync role to view on login or URL check & Listen to browser popstate (native back/forward)
  useEffect(() => {
    const handlePopState = (event) => {
      if (event.state && event.state.view) {
        setCurrentView(event.state.view);
        if (event.state.patientTab) setPatientTab(event.state.patientTab);
        if (event.state.doctorTab) setDoctorTab(event.state.doctorTab);
        if (event.state.activeSection) setActiveSection(event.state.activeSection);
      } else {
        const path = window.location.pathname;
        if (path === '/patient/ai-checkup' || path === '/checkup') {
          setCurrentView('ai-checkup');
        } else if (path === '/integrations') {
          setCurrentView('integrations');
        } else if (isAuthenticated && role) {
          setCurrentView(role);
        } else {
          setCurrentView('public');
          setActiveSection('home');
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isAuthenticated, role]);

  useEffect(() => {
    if (window.location.pathname === '/patient/ai-checkup' || window.location.pathname === '/checkup') {
      setCurrentView('ai-checkup');
    } else if (isAuthenticated && role && currentView === 'public') {
      setCurrentView(role);
    }
  }, [isAuthenticated, role]);

  const handleSplashComplete = () => {
    sessionStorage.setItem('medikiosk_splash_shown', 'true');
    setShowSplash(false);
  };

  const handleOpenLogin = (prefRole = 'doctor') => {
    setLoginRole(prefRole || 'doctor');
    setIsLoginOpen(true);
  };

  const handleOpenRegister = () => {
    setIsRegisterOpen(true);
  };

  const handleLoginSuccess = (userRole) => {
    recordNavStep();
    setCurrentView(userRole);
    if (userRole === 'patient') setPatientTab('dashboard');
    if (userRole === 'doctor') setDoctorTab('dashboard');
    try {
      window.history.pushState({ view: userRole, patientTab: 'dashboard', doctorTab: 'dashboard' }, '', `/${userRole}`);
    } catch (e) { }
  };

  const handleRegisterSuccess = (userRole) => {
    recordNavStep();
    setCurrentView(userRole);
    if (userRole === 'patient') setPatientTab('dashboard');
    if (userRole === 'doctor') setDoctorTab('dashboard');
    try {
      window.history.pushState({ view: userRole, patientTab: 'dashboard', doctorTab: 'dashboard' }, '', `/${userRole}`);
    } catch (e) { }
  };

  const handleLogout = () => {
    recordNavStep();
    logout();
    setCurrentView('public');
    setActiveSection('home');
    setPatientTab('dashboard');
    setDoctorTab('dashboard');
    try {
      window.history.pushState({ view: 'public', section: 'home' }, '', '/');
    } catch (e) { }
  };

  const handleNavigateDashboardTab = (tabId) => {
    recordNavStep();
    if (tabId === 'home' || tabId === 'public') {
      try {
        window.history.pushState({ view: 'public', section: 'home' }, '', '/');
      } catch (e) { }
      setCurrentView('public');
      setActiveSection('home');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (role === 'patient') {
      if (tabId === 'interview' || tabId === 'ai-checkup') {
        try {
          window.history.pushState({ view: 'ai-checkup' }, '', '/patient/ai-checkup');
        } catch (e) { }
        setCurrentView('ai-checkup');
      } else {
        try {
          window.history.pushState({ view: 'patient', patientTab: tabId }, '', `/patient/${tabId}`);
        } catch (e) { }
        setPatientTab(tabId);
        setCurrentView('patient');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else if (role === 'doctor') {
      try {
        window.history.pushState({ view: 'doctor', doctorTab: tabId }, '', `/doctor/${tabId}`);
      } catch (e) { }
      setDoctorTab(tabId);
      setCurrentView('doctor');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Unified Back Navigation Handler
  const handleGoBack = () => {
    // 1. If entries exist in our internal navigation stack:
    if (navHistory.length > 0) {
      const prev = navHistory[navHistory.length - 1];
      setNavHistory((hist) => hist.slice(0, -1));

      setCurrentView(prev.view);
      if (prev.patientTab) setPatientTab(prev.patientTab);
      if (prev.doctorTab) setDoctorTab(prev.doctorTab);
      if (prev.activeSection) setActiveSection(prev.activeSection);

      let path = '/';
      if (prev.view === 'ai-checkup') path = '/patient/ai-checkup';
      else if (prev.view === 'patient') path = `/patient/${prev.patientTab || 'dashboard'}`;
      else if (prev.view === 'doctor') path = `/doctor/${prev.doctorTab || 'dashboard'}`;
      else if (prev.view === 'integrations') path = '/integrations';
      else if (prev.activeSection && prev.activeSection !== 'home') path = `/#${prev.activeSection}`;

      try {
        window.history.replaceState({ ...prev }, '', path);
      } catch (e) { }

      if (prev.view === 'public' && prev.activeSection && prev.activeSection !== 'home') {
        const el = document.getElementById(prev.activeSection);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      } else if (prev.view === 'public') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return;
    }

    // 2. Intelligent fallbacks when history stack is empty:
    if (currentView === 'ai-checkup') {
      try {
        window.history.pushState({ view: isAuthenticated && role === 'patient' ? 'patient' : 'public' }, '', '/');
      } catch (e) { }
      setCurrentView(isAuthenticated && role === 'patient' ? 'patient' : 'public');
      return;
    }

    if (currentView === 'integrations') {
      try {
        window.history.pushState({ view: 'public' }, '', '/');
      } catch (e) { }
      setCurrentView('public');
      setActiveSection('home');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (currentView === 'patient') {
      if (patientTab !== 'dashboard') {
        setPatientTab('dashboard');
      } else {
        setCurrentView('public');
        setActiveSection('home');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return;
    }

    if (currentView === 'doctor') {
      if (doctorTab !== 'dashboard') {
        setDoctorTab('dashboard');
      } else {
        setCurrentView('public');
        setActiveSection('home');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return;
    }

    if (currentView === 'admin') {
      setCurrentView('public');
      setActiveSection('home');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (currentView === 'public' && activeSection !== 'home') {
      setActiveSection('home');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // 3. Fallback to native browser back if available
    if (typeof window !== 'undefined' && window.history.length > 1) {
      window.history.back();
    }
  };

  // Keyboard Shortcut: Alt + ArrowLeft to navigate back
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.altKey && e.key === 'ArrowLeft') {
        e.preventDefault();
        handleGoBack();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navHistory, currentView, patientTab, doctorTab, activeSection]);

  const isInnerPage =
    currentView !== 'public' ||
    (currentView === 'public' && activeSection !== 'home') ||
    navHistory.length > 0;

  const backTooltip = (() => {
    if (navHistory.length > 0) {
      const prev = navHistory[navHistory.length - 1];
      if (prev.view === 'public') return 'Back to Home (Alt + ←)';
      if (prev.view === 'patient') {
        const tabName = prev.patientTab === 'dashboard' ? 'Patient Portal' : prev.patientTab;
        return `Back to ${tabName} (Alt + ←)`;
      }
      if (prev.view === 'doctor') {
        const tabName = prev.doctorTab === 'dashboard' ? 'Doctor Portal' : prev.doctorTab;
        return `Back to ${tabName} (Alt + ←)`;
      }
      if (prev.view === 'integrations') return 'Back to Integrations Hub (Alt + ←)';
      if (prev.view === 'admin') return 'Back to Admin (Alt + ←)';
      return 'Back to Previous View (Alt + ←)';
    }
    if (currentView === 'patient' && patientTab !== 'dashboard') return 'Back to Dashboard (Alt + ←)';
    if (currentView === 'doctor' && doctorTab !== 'dashboard') return 'Back to Dashboard (Alt + ←)';
    if (currentView === 'integrations') return 'Back to Home (Alt + ←)';
    if (currentView === 'ai-checkup') return 'Back to Home (Alt + ←)';
    if (currentView === 'admin') return 'Back to Home (Alt + ←)';
    return 'Back to Home (Alt + ←)';
  })();

  const activeDashboardTab =
    currentView === 'public'
      ? 'home'
      : currentView === 'ai-checkup'
        ? 'interview'
        : role === 'patient'
          ? patientTab
          : doctorTab;

  return (
    <div className={`bg-[#F3F8F8] text-[#172033] flex flex-col font-sans relative ${currentView === 'patient' || currentView === 'doctor'
        ? 'h-screen overflow-hidden'
        : 'min-h-screen overflow-x-hidden'
      }`}>


      {/* 5-Second Startup Splash Screen */}
      {showSplash && <Splash5Sec onComplete={handleSplashComplete} />}

      {/* Public / Global Navbar (Hidden during full-screen AI Health Check-Up) */}
      {currentView !== 'ai-checkup' && (
        <Navbar
          activeSection={activeSection}
          setActiveSection={(sec) => {
            recordNavStep();
            setActiveSection(sec);
          }}
          onOpenLogin={() => handleOpenLogin('doctor')}
          onOpenRegister={handleOpenRegister}
          onOpenAICheckup={() => {
            recordNavStep();
            try {
              window.history.pushState({ view: 'ai-checkup' }, '', '/patient/ai-checkup');
            } catch (e) { }
            setCurrentView('ai-checkup');
          }}
          onOpenDoctorLogin={() => handleOpenLogin('doctor')}
          currentView={currentView}
          setCurrentView={(v) => {
            recordNavStep();
            setCurrentView(v);
          }}
          activeDashboardTab={activeDashboardTab}
          onNavigateDashboardTab={handleNavigateDashboardTab}
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
          onGoBack={handleGoBack}
          showBackButton={isInnerPage}
          backTooltip={backTooltip}
        />
      )}

      {/* Dynamic Futuristic Page Transition System */}
      <PageTransitionEffect currentView={currentView} />

      {/* Main View Router */}
      <div className={`flex-1 min-h-0 ${currentView === 'patient' || currentView === 'doctor' ? 'overflow-hidden flex flex-col' : ''}`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 8, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -6, filter: 'blur(3px)' }}
            transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
            className={`w-full ${currentView === 'patient' || currentView === 'doctor' ? 'h-full flex flex-col overflow-hidden' : ''}`}
          >
            {currentView === 'ai-checkup' ? (
              <AICheckupPage
                onExit={handleGoBack}
                onNavigateDoctor={(summary) => {
                  recordNavStep();
                  try {
                    window.history.pushState({}, '', '/');
                  } catch (e) { }
                  setActivePatientSummary(summary);
                  if (isAuthenticated && role === 'patient') {
                    setPatientTab('doctors');
                    setCurrentView('patient');
                  } else {
                    setCurrentView('public');
                  }
                }}
              />
            ) : currentView === 'patient' && isAuthenticated && role === 'patient' ? (
              <PatientDashboard
                onLogout={handleLogout}
                onOpenAICheckup={() => {
                  recordNavStep();
                  try {
                    window.history.pushState({ view: 'ai-checkup' }, '', '/patient/ai-checkup');
                  } catch (e) { }
                  setCurrentView('ai-checkup');
                }}
                initialSummary={activePatientSummary}
                activeTab={patientTab}
                setActiveTab={setPatientTab}
                sidebarOpen={sidebarOpen}
                onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
              />
            ) : currentView === 'doctor' && (role === 'doctor' || (user && user.role === 'doctor') || isAuthenticated) ? (
              <DoctorDashboard
                onLogout={handleLogout}
                activeTab={doctorTab}
                setActiveTab={setDoctorTab}
                sidebarOpen={sidebarOpen}
                onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
              />
            ) : currentView === 'admin' && (role === 'admin' || (user && user.role === 'admin') || isAuthenticated) ? (
              <AdminDashboard onLogout={handleLogout} />
            ) : currentView === 'integrations' ? (
              <IntegrationsHub onGoBack={handleGoBack} />
            ) : (
              <HomePage
                onOpenLogin={handleOpenLogin}
                onOpenRegister={handleOpenRegister}
                onOpenIntegrations={() => {
                  recordNavStep();
                  try {
                    window.history.pushState({ view: 'integrations' }, '', '/integrations');
                  } catch (e) { }
                  setCurrentView('integrations');
                }}
                onOpenAICheckup={() => {
                  recordNavStep();
                  try {
                    window.history.pushState({ view: 'ai-checkup' }, '', '/patient/ai-checkup');
                  } catch (e) { }
                  setCurrentView('ai-checkup');
                }}
                onNavigatePortal={(targetRole) => {
                  recordNavStep();
                  if (targetRole === 'patient') {
                    try {
                      window.history.pushState({ view: 'ai-checkup' }, '', '/patient/ai-checkup');
                    } catch (e) { }
                    setCurrentView('ai-checkup');
                  } else if (isAuthenticated && role === targetRole) {
                    try {
                      window.history.pushState({ view: targetRole }, '', `/${targetRole}`);
                    } catch (e) { }
                    setCurrentView(targetRole);
                  } else {
                    handleOpenLogin(targetRole);
                  }
                }}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Public Footer (Rendered STRICTLY on public marketing website only) */}
      {currentView === 'public' && (
        <Footer
          onNavigateSection={(sec) => {
            setCurrentView('public');
            setActiveSection(sec);
            const elem = document.getElementById(sec);
            if (elem) elem.scrollIntoView({ behavior: 'smooth' });
          }}
          onOpenIntegrations={() => setCurrentView('integrations')}
        />
      )}

      {/* Authentication Modals */}
      <LoginModal
        isOpen={isLoginOpen}
        defaultRole={loginRole}
        onClose={() => setIsLoginOpen(false)}
        onOpenAICheckup={() => {
          setIsLoginOpen(false);
          window.history.pushState({}, '', '/patient/ai-checkup');
          setCurrentView('ai-checkup');
        }}
        onSwitchToRegister={() => {
          setIsLoginOpen(false);
          setIsRegisterOpen(true);
        }}
        onLoginSuccess={handleLoginSuccess}
      />

      <RegisterModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onSwitchToLogin={() => {
          setIsRegisterOpen(false);
          setIsLoginOpen(true);
        }}
        onRegisterSuccess={handleRegisterSuccess}
      />

    </div>
  );
}

import { LanguageProvider } from './context/LanguageContext';

export default function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <MainApp />
      </LanguageProvider>
    </AuthProvider>
  );
}
