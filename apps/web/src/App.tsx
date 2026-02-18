import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { WhiteLabelProvider } from '@/contexts/WhiteLabelContext';
import { ThemeProvider } from '@/hooks/useTheme';
import { ToastProvider } from '@/components/ui/Toast';
import { DashboardLayout } from '@/layouts/DashboardLayout';

// Lazy load pages for better performance
const LoginPage = lazy(() => import('@/pages/auth/LoginPage').then(m => ({ default: m.LoginPage })));
const SignUpPage = lazy(() => import('@/pages/auth/SignUpPage').then(m => ({ default: m.SignUpPage })));
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage').then(m => ({ default: m.ForgotPasswordPage })));
const AuthCallbackPage = lazy(() => import('@/pages/auth/AuthCallbackPage').then(m => ({ default: m.AuthCallbackPage })));
const DashboardPage = lazy(() => import('@/pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const KnowledgeBasePage = lazy(() => import('@/pages/KnowledgeBasePage').then(m => ({ default: m.KnowledgeBasePage })));
const WizardPage = lazy(() => import('@/pages/WizardPage').then(m => ({ default: m.WizardPage })));
const AnalyticsPage = lazy(() => import('@/pages/AnalyticsPage').then(m => ({ default: m.AnalyticsPage })));
const SettingsPage = lazy(() => import('@/pages/SettingsPage').then(m => ({ default: m.SettingsPage })));
const NewslettersPage = lazy(() => import('@/pages/NewslettersPage').then(m => ({ default: m.NewslettersPage })));
const NewsletterEditorPage = lazy(() => import('@/pages/NewsletterEditorPage').then(m => ({ default: m.NewsletterEditorPage })));
const ABTestPage = lazy(() => import('@/pages/ABTestPage').then(m => ({ default: m.ABTestPage })));
const ApiKeysPage = lazy(() => import('@/pages/ApiKeysPage').then(m => ({ default: m.ApiKeysPage })));
const WebhooksPage = lazy(() => import('@/pages/WebhooksPage').then(m => ({ default: m.WebhooksPage })));
const PartnerPortalPage = lazy(() => import('@/pages/PartnerPortalPage').then(m => ({ default: m.PartnerPortalPage })));
const EmbedWizardPage = lazy(() => import('@/pages/EmbedWizardPage').then(m => ({ default: m.EmbedWizardPage })));
const EmbedKnowledgeBasePage = lazy(() => import('@/pages/EmbedKnowledgeBasePage').then(m => ({ default: m.EmbedKnowledgeBasePage })));
const SocialMediaPage = lazy(() => import('@/pages/SocialMediaPage').then(m => ({ default: m.SocialMediaPage })));

function LoadingSpinner() {
  return (
    <div className="flex h-screen items-center justify-center bg-neutral-50">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        {/* Auth routes */}
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/signup" element={<PublicRoute><SignUpPage /></PublicRoute>} />
        <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        
        {/* Embeddable wizard (public) */}
        <Route path="/embed" element={<EmbedWizardPage />} />
        <Route path="/embed/knowledge-base" element={<EmbedKnowledgeBasePage />} />
        
        {/* Protected routes */}
        <Route path="/" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="knowledge-base" element={<KnowledgeBasePage />} />
          <Route path="newsletters" element={<NewslettersPage />} />
          <Route path="newsletters/:id/edit" element={<NewsletterEditorPage />} />
          <Route path="newsletters/:id/ab-test" element={<ABTestPage />} />
          <Route path="newsletters/:id/social" element={<SocialMediaPage />} />
          <Route path="wizard" element={<WizardPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="settings/api-keys" element={<ApiKeysPage />} />
          <Route path="settings/webhooks" element={<WebhooksPage />} />
          <Route path="partner" element={<PartnerPortalPage />} />
        </Route>
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <WhiteLabelProvider>
            <ToastProvider>
              <AppRoutes />
            </ToastProvider>
          </WhiteLabelProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
