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

  // Sync role to view on login or URL check
  useEffect(() => {
    if (window.location.pathname === '/patient/ai-checkup') {
      if (isAuthenticated && role === 'patient') {
        setCurrentView('ai-checkup');
      } else if (!isAuthenticated) {
        setLoginRole('patient');
        setIsLoginOpen(true);
      }
    } else if (isAuthenticated && role && currentView === 'public') {
      setCurrentView(role);
    }
  }, [isAuthenticated, role]);

  const handleSplashComplete = () => {
    sessionStorage.setItem('medikiosk_splash_shown', 'true');
    setShowSplash(false);
  };

  const handleOpenLogin = (prefRole = 'patient') => {
    setLoginRole(prefRole || 'patient');
    setIsLoginOpen(true);
  };

  const handleOpenRegister = () => {
    setIsRegisterOpen(true);
  };

  const handleLoginSuccess = (userRole) => {
    setCurrentView(userRole);
    if (userRole === 'patient') setPatientTab('dashboard');
    if (userRole === 'doctor') setDoctorTab('dashboard');
  };

  const handleRegisterSuccess = (userRole) => {
    setCurrentView(userRole);
    if (userRole === 'patient') setPatientTab('dashboard');
    if (userRole === 'doctor') setDoctorTab('dashboard');
  };

  const handleLogout = () => {
    logout();
    setCurrentView('public');
    setActiveSection('home');
    setPatientTab('dashboard');
    setDoctorTab('dashboard');
  };

  const handleNavigateDashboardTab = (tabId) => {
    if (tabId === 'home' || tabId === 'public') {
      setCurrentView('public');
      setActiveSection('home');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (role === 'patient') {
      if (tabId === 'interview' || tabId === 'ai-checkup') {
        window.history.pushState({}, '', '/patient/ai-checkup');
        setCurrentView('ai-checkup');
      } else {
        setPatientTab(tabId);
        setCurrentView('patient');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else if (role === 'doctor') {
      setDoctorTab(tabId);
      setCurrentView('doctor');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const activeDashboardTab =
    currentView === 'public'
      ? 'home'
      : currentView === 'ai-checkup'
      ? 'interview'
      : role === 'patient'
      ? patientTab
      : doctorTab;

  return (
    <div className={`bg-[#F3F8F8] text-[#172033] flex flex-col font-sans relative ${
      currentView === 'patient' || currentView === 'doctor'
        ? 'h-screen overflow-hidden'
        : 'min-h-screen overflow-x-hidden'
    }`}>
      

      {/* 5-Second Startup Splash Screen */}
      {showSplash && <Splash5Sec onComplete={handleSplashComplete} />}

      {/* Public / Global Navbar (Hidden during full-screen AI Health Check-Up) */}
      {currentView !== 'ai-checkup' && (
        <Navbar
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          onOpenLogin={() => handleOpenLogin('patient')}
          onOpenRegister={handleOpenRegister}
          currentView={currentView}
          setCurrentView={setCurrentView}
          activeDashboardTab={activeDashboardTab}
          onNavigateDashboardTab={handleNavigateDashboardTab}
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
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
            {currentView === 'ai-checkup' && isAuthenticated && role === 'patient' ? (
              <AICheckupPage
                onExit={() => {
                  window.history.pushState({}, '', '/');
                  setCurrentView('patient');
                }}
                onNavigateDoctor={(summary) => {
                  window.history.pushState({}, '', '/');
                  setActivePatientSummary(summary);
                  setPatientTab('doctors');
                  setCurrentView('patient');
                }}
              />
            ) : currentView === 'patient' && isAuthenticated && role === 'patient' ? (
              <PatientDashboard
                onLogout={handleLogout}
                onOpenAICheckup={() => {
                  window.history.pushState({}, '', '/patient/ai-checkup');
                  setCurrentView('ai-checkup');
                }}
                initialSummary={activePatientSummary}
                activeTab={patientTab}
                setActiveTab={setPatientTab}
                sidebarOpen={sidebarOpen}
                onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
              />
            ) : currentView === 'doctor' && isAuthenticated && role === 'doctor' ? (
              <DoctorDashboard
                onLogout={handleLogout}
                activeTab={doctorTab}
                setActiveTab={setDoctorTab}
                sidebarOpen={sidebarOpen}
                onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
              />
            ) : currentView === 'integrations' ? (
              <IntegrationsHub />
            ) : (
              <HomePage
                onOpenLogin={handleOpenLogin}
                onOpenRegister={handleOpenRegister}
                onOpenIntegrations={() => setCurrentView('integrations')}
                onOpenAICheckup={() => {
                  if (isAuthenticated && role === 'patient') {
                    window.history.pushState({}, '', '/patient/ai-checkup');
                    setCurrentView('ai-checkup');
                  } else {
                    handleOpenLogin('patient');
                  }
                }}
                onNavigatePortal={(targetRole) => {
                  if (isAuthenticated && role === targetRole) {
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
