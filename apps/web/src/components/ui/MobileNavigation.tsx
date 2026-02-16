import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Database, Mail, Wand2, Settings } from 'lucide-react';
import clsx from 'clsx';

const mobileNavItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Sources', href: '/knowledge-base', icon: Database },
  { name: 'Create', href: '/wizard', icon: Wand2, primary: true },
  { name: 'Newsletters', href: '/newsletters', icon: Mail },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function MobileNavigation() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-neutral-800 border-t border-neutral-200 dark:border-neutral-700 lg:hidden z-40 safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {mobileNavItems.map((item) => {
          const isActive = location.pathname === item.href || 
            (item.href !== '/dashboard' && location.pathname.startsWith(item.href));
          
          if (item.primary) {
            return (
              <Link
                key={item.name}
                to={item.href}
                className="flex flex-col items-center justify-center -mt-6"
              >
                <div className={clsx(
                  'w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform',
                  isActive 
                    ? 'bg-primary-600 scale-110' 
                    : 'bg-primary-500 hover:bg-primary-600'
                )}>
                  <item.icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-xs font-medium mt-1 text-primary-600 dark:text-primary-400">
                  {item.name}
                </span>
              </Link>
            );
          }
          
          return (
            <Link
              key={item.name}
              to={item.href}
              className={clsx(
                'flex flex-col items-center justify-center py-2 px-3 min-w-[64px] transition-colors',
                isActive 
                  ? 'text-primary-600 dark:text-primary-400' 
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300'
              )}
            >
              <item.icon className={clsx(
                'w-6 h-6 mb-1',
                isActive && 'scale-110'
              )} />
              <span className={clsx(
                'text-xs',
                isActive ? 'font-medium' : 'font-normal'
              )}>
                {item.name}
              </span>
              {isActive && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary-500 rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
