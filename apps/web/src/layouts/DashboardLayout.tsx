import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useWhiteLabel } from '@/contexts/WhiteLabelContext';
import { useTheme } from '@/hooks/useTheme';
import { ThemeSwitcher } from '@/components/ui/ThemeSwitcher';
import { CommandPalette } from '@/components/ui/CommandPalette';
import { NetworkErrorBanner } from '@/components/NetworkErrorBanner';
import { SessionSummary } from '@/components/SessionSummary';
import { useSessionMetrics } from '@/contexts/SessionMetricsContext';
import type { SessionMetrics } from '@/contexts/SessionMetricsContext';
import {
  LayoutDashboard,
  Database,
  Mail,
  BarChart3,
  Settings,
  Wand2,
  LogOut,
  Menu,
  X,
  ChevronDown,
  User,
  BookOpen,
  Calendar,
  Plus,
  Mic,
  Users,
  Search,
  FlaskConical,
  MessageSquarePlus,
  Sparkles,
  Gift,
} from 'lucide-react';
import clsx from 'clsx';
import { Breadcrumbs, MobileBreadcrumb } from '@/components/ui/Breadcrumbs';
import { MobileNavigation } from '@/components/ui/MobileNavigation';

const WHATS_NEW_KEY = 'whats-new-last-read';
const LATEST_ENTRY_DATE = '2026-02-19'; // bump when new entries added

function getWhatsNewUnreadCount(): number {
  const lastRead = localStorage.getItem(WHATS_NEW_KEY) || '';
  return lastRead < LATEST_ENTRY_DATE ? 1 : 0;
}

const primaryNav = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Knowledge Base', href: '/knowledge-base', icon: Database },
  { name: 'Newsletters', href: '/newsletters', icon: Mail },
  { name: 'Templates', href: '/templates', icon: BookOpen },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
];

const secondaryNav = [
  { name: 'Brand Voice', href: '/brand-voice', icon: Mic },
  { name: 'Scheduling', href: '/scheduling', icon: Calendar },
  { name: 'Team', href: '/team', icon: Users },
  { name: 'Beta Lab', href: '/beta', icon: FlaskConical },
  { name: 'Feedback', href: '/feedback', icon: MessageSquarePlus },
  { name: 'Referrals', href: '/referral', icon: Gift },
  { name: "What's New", href: '/whats-new', icon: Sparkles, showBadge: true },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function DashboardLayout() {
  const { profile, signOut } = useAuth();
  const { config: whiteLabel } = useWhiteLabel();
  const { mode } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const { getMetrics } = useSessionMetrics();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [showSessionSummary, setShowSessionSummary] = useState(false);
  const [pendingSignOutMetrics, setPendingSignOutMetrics] = useState<SessionMetrics | null>(null);
  const [whatsNewUnread] = useState(getWhatsNewUnreadCount);

  function handleSignOutClick() {
    const metrics = getMetrics();
    setPendingSignOutMetrics(metrics);
    setShowSessionSummary(true);
    setUserMenuOpen(false);
  }

  function handleConfirmSignOut() {
    setShowSessionSummary(false);
    signOut();
  }

  function handleDismissSessionSummary() {
    setShowSessionSummary(false);
    setPendingSignOutMetrics(null);
  }

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(prev => !prev);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="flex h-screen bg-neutral-50 dark:bg-neutral-900 transition-colors duration-150">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        aria-label="Sidebar navigation"
        className={clsx(
          'fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white dark:bg-neutral-800 border-r border-neutral-200 dark:border-neutral-700 transform transition-transform duration-250 ease-out lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-neutral-200 dark:border-neutral-700">
            <Link to="/dashboard" className="flex items-center gap-2">
              {whiteLabel.logo_url ? (
                <img src={whiteLabel.logo_url} alt={whiteLabel.brand_name} className="w-8 h-8 rounded-lg object-contain" />
              ) : (
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: whiteLabel.primary_color }}>
                  <Wand2 className="w-5 h-5 text-white" />
                </div>
              )}
              <span className="font-semibold text-lg text-neutral-900 dark:text-white">{whiteLabel.brand_name}</span>
            </Link>
            <button
              aria-label="Close sidebar"
              className="lg:hidden p-1 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5 text-neutral-500" />
            </button>
          </div>

          {/* Navigation */}
          <nav aria-label="Main navigation" className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto">
            {/* Create Newsletter prominent button */}
            <Link
              to="/wizard"
              aria-label="Create newsletter with AI"
              className="flex items-center gap-2 px-3 py-2.5 mb-3 rounded-lg bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold transition-colors"
              onClick={() => setSidebarOpen(false)}
            >
              <Plus className="w-4 h-4" />
              Create Newsletter
            </Link>

            {/* Primary nav */}
            {primaryNav.map((item) => {
              const isActive = location.pathname === item.href ||
                (item.href !== '/dashboard' && location.pathname.startsWith(item.href));
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  aria-current={isActive ? 'page' : undefined}
                  className={clsx(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400'
                      : 'text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-700'
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className={clsx('w-5 h-5', isActive ? 'text-primary-500' : 'text-neutral-500')} />
                  {item.name}
                </Link>
              );
            })}

            {/* Divider */}
            <div className="my-2 border-t border-neutral-200 dark:border-neutral-700" />

            {/* Secondary nav */}
            {secondaryNav.map((item) => {
              const isActive = location.pathname === item.href ||
                (item.href !== '/dashboard' && location.pathname.startsWith(item.href));
              const hasBadge = item.showBadge && whatsNewUnread > 0;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  aria-current={isActive ? 'page' : undefined}
                  className={clsx(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400'
                      : 'text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-700'
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className={clsx('w-5 h-5 flex-shrink-0', isActive ? 'text-primary-500' : 'text-neutral-500')} />
                  <span className="flex-1">{item.name}</span>
                  {hasBadge && (
                    <span className="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0" aria-label="New updates" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Theme switcher in sidebar */}
          <div className="px-4 pb-2">
            <ThemeSwitcher variant="segmented" size="sm" className="w-full" />
          </div>

          {/* User section */}
          <div className="p-4 border-t border-neutral-200 dark:border-neutral-700">
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
              >
                <div className="w-9 h-9 bg-primary-100 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-primary-600" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">
                    {profile?.full_name || profile?.email}
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                    {profile?.email}
                  </p>
                </div>
                <ChevronDown className={clsx(
                  'w-4 h-4 text-neutral-500 transition-transform',
                  userMenuOpen && 'rotate-180'
                )} />
              </button>

              {userMenuOpen && (
                <div className="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-neutral-800 rounded-lg shadow-lg border border-neutral-200 dark:border-neutral-700 py-1">
                  <div className="px-4 py-2 border-b border-neutral-100 dark:border-neutral-700">
                    <p className="text-xs text-neutral-500">Theme: {mode === 'system' ? 'System' : mode === 'dark' ? 'Dark' : 'Light'}</p>
                  </div>
                  <button
                    onClick={handleSignOutClick}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-error hover:bg-error/10"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-16 bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 flex items-center px-4 lg:px-8 transition-colors duration-150">
          <button
            aria-label="Open navigation menu"
            className="lg:hidden p-2 -ml-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5 text-neutral-700 dark:text-neutral-300" />
          </button>
          
          {/* Breadcrumbs - desktop */}
          <div className="hidden lg:block ml-2">
            <Breadcrumbs />
          </div>
          
          {/* Breadcrumbs - mobile */}
          <div className="lg:hidden ml-2">
            <MobileBreadcrumb />
          </div>
          
          {/* Spacer */}
          <div className="flex-1" />

          {/* Search / Command Palette trigger */}
          <button
            onClick={() => setCommandPaletteOpen(true)}
            aria-label="Open search (Cmd+K)"
            className="hidden lg:flex items-center gap-2 px-3 py-1.5 text-sm text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors mr-3"
          >
            <Search className="w-4 h-4" />
            <span>Search</span>
            <kbd className="ml-1 text-xs text-neutral-400 border border-neutral-300 dark:border-neutral-500 rounded px-1">⌘K</kbd>
          </button>
          <button
            onClick={() => navigate('/search')}
            aria-label="Search"
            className="lg:hidden p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg mr-1"
          >
            <Search className="w-5 h-5 text-neutral-500 dark:text-neutral-400" />
          </button>

          {/* Theme switcher in header (icon variant for desktop) */}
          <div className="hidden lg:block">
            <ThemeSwitcher variant="dropdown" />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-4 lg:p-8 pb-20 lg:pb-8 transition-colors duration-150">
          <Outlet />
        </main>
        
        {/* Mobile bottom navigation */}
        <MobileNavigation />
      </div>

      {/* Command Palette */}
      <CommandPalette open={commandPaletteOpen} onClose={() => setCommandPaletteOpen(false)} />

      {/* Network error banner (fixed bottom) */}
      <NetworkErrorBanner />

      {/* Session summary shown before sign-out */}
      {showSessionSummary && pendingSignOutMetrics && (
        <SessionSummary
          metrics={pendingSignOutMetrics}
          onConfirmSignOut={handleConfirmSignOut}
          onDismiss={handleDismissSessionSummary}
        />
      )}
    </div>
  );
}
