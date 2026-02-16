import { useState, useEffect, createContext, useContext, useCallback, ReactNode } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X, Undo2 } from 'lucide-react';
import clsx from 'clsx';

// Toast types
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => string;
  removeToast: (id: string) => void;
  // Convenience methods
  success: (title: string, description?: string) => string;
  error: (title: string, description?: string) => string;
  warning: (title: string, description?: string) => string;
  info: (title: string, description?: string) => string;
  // Special undo toast
  undoToast: (title: string, onUndo: () => void, duration?: number) => string;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

interface ToastProviderProps {
  children: ReactNode;
  maxToasts?: number;
}

export function ToastProvider({ children, maxToasts = 3 }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const addToast = useCallback((toast: Omit<Toast, 'id'>): string => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newToast: Toast = { ...toast, id };
    
    setToasts(prev => {
      const updated = [newToast, ...prev];
      // Limit number of visible toasts
      return updated.slice(0, maxToasts);
    });

    // Auto-dismiss (longer for undo actions)
    const duration = toast.duration ?? (toast.action ? 10000 : 5000);
    if (duration > 0) {
      setTimeout(() => removeToast(id), duration);
    }

    return id;
  }, [maxToasts, removeToast]);

  // Convenience methods
  const success = useCallback((title: string, description?: string) => {
    return addToast({ type: 'success', title, description });
  }, [addToast]);

  const error = useCallback((title: string, description?: string) => {
    return addToast({ type: 'error', title, description, duration: 8000 });
  }, [addToast]);

  const warning = useCallback((title: string, description?: string) => {
    return addToast({ type: 'warning', title, description });
  }, [addToast]);

  const info = useCallback((title: string, description?: string) => {
    return addToast({ type: 'info', title, description });
  }, [addToast]);

  const undoToast = useCallback((title: string, onUndo: () => void, duration = 10000) => {
    return addToast({
      type: 'info',
      title,
      duration,
      action: {
        label: 'Undo',
        onClick: onUndo,
      },
    });
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, success, error, warning, info, undoToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

// Toast container component
function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: string) => void }) {
  // Respect reduced motion preference
  const prefersReducedMotion = typeof window !== 'undefined' 
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <div 
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
      role="region"
      aria-label="Notifications"
    >
      {toasts.map((toast) => (
        <ToastItem 
          key={toast.id} 
          toast={toast} 
          onRemove={onRemove}
          animate={!prefersReducedMotion}
        />
      ))}
    </div>
  );
}

// Individual toast component
function ToastItem({ toast, onRemove, animate }: { toast: Toast; onRemove: (id: string) => void; animate: boolean }) {
  const [isExiting, setIsExiting] = useState(false);

  const handleRemove = () => {
    if (animate) {
      setIsExiting(true);
      setTimeout(() => onRemove(toast.id), 200);
    } else {
      onRemove(toast.id);
    }
  };

  const handleAction = () => {
    toast.action?.onClick();
    handleRemove();
  };

  const icons: Record<ToastType, ReactNode> = {
    success: <CheckCircle className="w-5 h-5 text-green-500" />,
    error: <XCircle className="w-5 h-5 text-red-500" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />,
  };

  const bgColors: Record<ToastType, string> = {
    success: 'border-l-green-500',
    error: 'border-l-red-500',
    warning: 'border-l-amber-500',
    info: 'border-l-blue-500',
  };

  return (
    <div
      className={clsx(
        'pointer-events-auto bg-white dark:bg-neutral-800 rounded-lg shadow-lg border border-neutral-200 dark:border-neutral-700 border-l-4 p-4',
        bgColors[toast.type],
        animate && 'transition-all duration-200',
        animate && !isExiting && 'animate-slide-in-right',
        isExiting && 'opacity-0 translate-x-4'
      )}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {icons[toast.type]}
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-neutral-900 dark:text-white">
            {toast.title}
          </p>
          {toast.description && (
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              {toast.description}
            </p>
          )}
          {toast.action && (
            <button
              onClick={handleAction}
              className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
            >
              <Undo2 className="w-4 h-4" />
              {toast.action.label}
            </button>
          )}
        </div>
        
        <button
          onClick={handleRemove}
          className="flex-shrink-0 p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 rounded transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
