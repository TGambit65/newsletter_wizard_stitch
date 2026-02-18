import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useWhiteLabel } from '@/contexts/WhiteLabelContext';
import { useTheme } from '@/hooks/useTheme';
import { ThemeSwitcher } from '@/components/ui/ThemeSwitcher';
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
  Building2
} from 'lucide-react';
import clsx from 'clsx';
import { Breadcrumbs, MobileBreadcrumb } from '@/components/ui/Breadcrumbs';
import { MobileNavigation } from '@/components/ui/MobileNavigation';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Knowledge Base', href: '/knowledge-base', icon: Database },
  { name: 'Newsletters', href: '/newsletters', icon: Mail },
  { name: 'Create', href: '/wizard', icon: Wand2 },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
  { name: 'Partner Portal', href: '/partner', icon: Building2 },
];

export function DashboardLayout() {
  const { profile, signOut } = useAuth();
  const { config: whiteLabel } = useWhiteLabel();
  const { mode } = useTheme();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

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
      <aside className={clsx(
        'fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white dark:bg-neutral-800 border-r border-neutral-200 dark:border-neutral-700 transform transition-transform duration-250 ease-out lg:translate-x-0',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
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
              className="lg:hidden p-1 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5 text-neutral-500" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href || 
                (item.href !== '/dashboard' && location.pathname.startsWith(item.href));
              return (
                <Link
                  key={item.name}
                  to={item.href}
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
                    onClick={signOut}
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
    </div>
  );
}
