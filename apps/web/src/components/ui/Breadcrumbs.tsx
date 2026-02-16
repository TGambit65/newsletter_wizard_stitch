import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import clsx from 'clsx';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
  className?: string;
}

// Route to label mapping
const routeLabels: Record<string, string> = {
  'dashboard': 'Dashboard',
  'knowledge-base': 'Knowledge Base',
  'newsletters': 'Newsletters',
  'wizard': 'Create Newsletter',
  'analytics': 'Analytics',
  'settings': 'Settings',
  'partner': 'Partner Portal',
  'ab-test': 'A/B Test',
  'social': 'Social Media',
  'edit': 'Edit',
};

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  const location = useLocation();
  
  // Auto-generate breadcrumbs from current path if items not provided
  const breadcrumbItems = items || generateBreadcrumbs(location.pathname);

  if (breadcrumbItems.length <= 1) {
    return null;
  }

  return (
    <nav aria-label="Breadcrumb" className={clsx('flex items-center', className)}>
      <ol className="flex items-center gap-1 text-sm">
        <li>
          <Link
            to="/dashboard"
            className="p-1 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
            aria-label="Home"
          >
            <Home className="w-4 h-4" />
          </Link>
        </li>
        
        {breadcrumbItems.map((item, index) => (
          <li key={index} className="flex items-center">
            <ChevronRight className="w-4 h-4 text-neutral-400 mx-1" />
            {item.href && index < breadcrumbItems.length - 1 ? (
              <Link
                to={item.href}
                className="text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-neutral-900 dark:text-white font-medium">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

function generateBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split('/').filter(Boolean);
  const items: BreadcrumbItem[] = [];
  
  let currentPath = '';
  
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    currentPath += `/${segment}`;
    
    // Skip UUID-like segments in the label, but keep in path
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment);
    
    if (isUUID) {
      // For UUIDs, use a generic label based on context
      const prevSegment = segments[i - 1];
      if (prevSegment === 'newsletters') {
        items.push({ label: 'Newsletter', href: currentPath });
      } else {
        items.push({ label: 'Details', href: currentPath });
      }
    } else {
      const label = routeLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
      items.push({ label, href: currentPath });
    }
  }
  
  return items;
}

// Compact breadcrumb for mobile
export function MobileBreadcrumb({ className }: { className?: string }) {
  const location = useLocation();
  const segments = location.pathname.split('/').filter(Boolean);
  
  if (segments.length <= 1) return null;
  
  // Only show parent for mobile
  const parentSegment = segments[segments.length - 2];
  const parentPath = '/' + segments.slice(0, -1).join('/');
  const parentLabel = routeLabels[parentSegment] || parentSegment;
  
  return (
    <Link
      to={parentPath}
      className={clsx(
        'inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300',
        className
      )}
    >
      <ChevronRight className="w-4 h-4 rotate-180" />
      {parentLabel}
    </Link>
  );
}
