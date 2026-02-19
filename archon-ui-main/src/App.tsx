import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from './features/shared/config/queryClient';
import { KnowledgeBasePage } from './pages/KnowledgeBasePage';
import { SettingsPage } from './pages/SettingsPage';
import { MCPPage } from './pages/MCPPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { TeamPage } from './pages/TeamPage';
import { InviteAcceptPage } from './pages/InviteAcceptPage';
import { SignUpPage } from './pages/SignUpPage';
import { LoginPage } from './pages/LoginPage';
import { EmailVerifyPage } from './pages/EmailVerifyPage';
import { DashboardPage } from './pages/DashboardPage';
import { AIPage } from './pages/AIPage';
import { AuthGuard } from './components/auth/AuthGuard';
import { useAuth } from './contexts/AuthContext';
import { MainLayout } from './components/layout/MainLayout';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './features/ui/components/ToastProvider';
import { SettingsProvider, useSettings } from './contexts/SettingsContext';
import { TooltipProvider } from './features/ui/primitives/tooltip';
import { ProjectPage } from './pages/ProjectPage';
import StyleGuidePage from './pages/StyleGuidePage';
import { DisconnectScreenOverlay } from './components/DisconnectScreenOverlay';
import { ErrorBoundaryWithBugReport } from './components/bug-report/ErrorBoundaryWithBugReport';
import { MigrationBanner } from './components/ui/MigrationBanner';
import { serverHealthService } from './services/serverHealthService';
import { useMigrationStatus } from './hooks/useMigrationStatus';


const AppRoutes = () => {
  const { projectsEnabled, styleGuideEnabled } = useSettings();

  return (
    <AuthGuard>
      <Routes>
        <Route path="/verify-email" element={<EmailVerifyPage />} />
        <Route path="/" element={<KnowledgeBasePage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/invite/:token" element={<InviteAcceptPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/mcp" element={<MCPPage />} />
        <Route path="/team" element={<TeamPage />} />
        <Route path="/ai" element={<AIPage />} />
      {styleGuideEnabled ? (
        <Route path="/style-guide" element={<StyleGuidePage />} />
      ) : (
        <Route path="/style-guide" element={<Navigate to="/" replace />} />
      )}
      {projectsEnabled ? (
        <>
          <Route path="/projects" element={<ProjectPage />} />
          <Route path="/projects/:projectId" element={<ProjectPage />} />
        </>
      ) : (
        <Route path="/projects" element={<Navigate to="/" replace />} />
      )}
    </Routes>
    </AuthGuard>
  );
};

function EmailVerificationBanner() {
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<{ text: string; ok: boolean } | null>(null);

  if (!user || user.email_verified || dismissed) return null;

  const resend = async () => {
    setResending(true);
    setResendMessage(null);
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email }),
      });
      if (res.ok) {
        setResendMessage({ text: "Verification email sent!", ok: true });
      } else {
        const data = await res.json().catch(() => ({}));
        setResendMessage({ text: data.detail || "Failed to resend. Try again.", ok: false });
      }
    } catch {
      setResendMessage({ text: "Network error. Please try again.", ok: false });
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] bg-amber-500 text-white px-4 py-2 flex items-center justify-center gap-3 text-sm shadow-md">
      <span>Please verify your email to unlock all features.</span>
      {resendMessage ? (
        <span className={resendMessage.ok ? "font-medium" : "font-medium opacity-90"}>
          {resendMessage.text}
        </span>
      ) : (
        <button
          type="button"
          onClick={resend}
          disabled={resending}
          className="underline font-medium hover:no-underline disabled:opacity-60"
        >
          {resending ? "Sending..." : "Resend verification email"}
        </button>
      )}
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="ml-2 opacity-70 hover:opacity-100"
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>
  );
}

const AppContent = () => {
  const [disconnectScreenActive, setDisconnectScreenActive] = useState(false);
  const [disconnectScreenDismissed, setDisconnectScreenDismissed] = useState(false);
  const [disconnectScreenSettings, setDisconnectScreenSettings] = useState({
    enabled: true,
    delay: 10000
  });
  const [migrationBannerDismissed, setMigrationBannerDismissed] = useState(false);
  const migrationStatus = useMigrationStatus();

  useEffect(() => {
    // Load initial settings
    const settings = serverHealthService.getSettings();
    setDisconnectScreenSettings(settings);

    // Stop any existing monitoring before starting new one to prevent multiple intervals
    serverHealthService.stopMonitoring();

    // Start health monitoring
    serverHealthService.startMonitoring({
      onDisconnected: () => {
        if (!disconnectScreenDismissed) {
          setDisconnectScreenActive(true);
        }
      },
      onReconnected: () => {
        setDisconnectScreenActive(false);
        setDisconnectScreenDismissed(false);
        // Refresh the page to ensure all data is fresh
        window.location.reload();
      }
    });

    return () => {
      serverHealthService.stopMonitoring();
    };
  }, [disconnectScreenDismissed]);

  const handleDismissDisconnectScreen = () => {
    setDisconnectScreenActive(false);
    setDisconnectScreenDismissed(true);
  };

  return (
    <>
      <Router>
        <EmailVerificationBanner />
        <ErrorBoundaryWithBugReport>
          <MainLayout>
            {/* Migration Banner - shows when backend is up but DB schema needs work */}
            {migrationStatus.migrationRequired && !migrationBannerDismissed && (
              <MigrationBanner
                message={migrationStatus.message || "Database migration required"}
                onDismiss={() => setMigrationBannerDismissed(true)}
              />
            )}
            <AppRoutes />
          </MainLayout>
        </ErrorBoundaryWithBugReport>
      </Router>
      <DisconnectScreenOverlay
        isActive={disconnectScreenActive && disconnectScreenSettings.enabled}
        onDismiss={handleDismissDisconnectScreen}
      />
    </>
  );
};

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <ToastProvider>
            <TooltipProvider>
              <SettingsProvider>
                <AppContent />
              </SettingsProvider>
            </TooltipProvider>
          </ToastProvider>
        </ThemeProvider>
      </AuthProvider>
      {import.meta.env.VITE_SHOW_DEVTOOLS === 'true' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}