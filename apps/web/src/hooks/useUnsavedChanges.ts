import { useEffect } from 'react';
import { useBlocker } from 'react-router-dom';

/**
 * Prevents accidental navigation away from a page with unsaved changes.
 * - Blocks React Router navigation and returns the blocker so the caller
 *   can show a confirmation dialog.
 * - Adds a beforeunload handler to catch browser close / tab refresh.
 *
 * Usage:
 *   const { blocker } = useUnsavedChanges(isDirty);
 *   // Render a ConfirmDialog when blocker.state === 'blocked'
 */
export function useUnsavedChanges(hasChanges: boolean) {
  const blocker = useBlocker(hasChanges);

  // Block browser close / refresh
  useEffect(() => {
    if (!hasChanges) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [hasChanges]);

  return { blocker };
}
