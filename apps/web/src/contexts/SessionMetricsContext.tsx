import { createContext, useContext, useRef, useCallback } from 'react';

export interface SessionMetrics {
  newslettersCreated: number;
  newslettersEdited: number;
  sourcesAdded: number;
  aiGenerations: number;
  sessionStart: Date;
}

interface SessionMetricsContextValue {
  getMetrics: () => SessionMetrics;
  incrementNewsletterCreated: () => void;
  incrementNewsletterEdited: () => void;
  incrementSourceAdded: () => void;
  incrementAiGeneration: () => void;
}

const SessionMetricsContext = createContext<SessionMetricsContextValue | null>(null);

export function SessionMetricsProvider({ children }: { children: React.ReactNode }) {
  // Use a ref so increments don't cause re-renders
  const metricsRef = useRef<SessionMetrics>({
    newslettersCreated: 0,
    newslettersEdited: 0,
    sourcesAdded: 0,
    aiGenerations: 0,
    sessionStart: new Date(),
  });

  const getMetrics = useCallback(() => ({ ...metricsRef.current }), []);

  const incrementNewsletterCreated = useCallback(() => {
    metricsRef.current.newslettersCreated += 1;
  }, []);

  const incrementNewsletterEdited = useCallback(() => {
    metricsRef.current.newslettersEdited += 1;
  }, []);

  const incrementSourceAdded = useCallback(() => {
    metricsRef.current.sourcesAdded += 1;
  }, []);

  const incrementAiGeneration = useCallback(() => {
    metricsRef.current.aiGenerations += 1;
  }, []);

  return (
    <SessionMetricsContext.Provider value={{
      getMetrics,
      incrementNewsletterCreated,
      incrementNewsletterEdited,
      incrementSourceAdded,
      incrementAiGeneration,
    }}>
      {children}
    </SessionMetricsContext.Provider>
  );
}

export function useSessionMetrics() {
  const ctx = useContext(SessionMetricsContext);
  if (!ctx) throw new Error('useSessionMetrics must be used within SessionMetricsProvider');
  return ctx;
}
