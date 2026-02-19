import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

let cache: { tenantId: string; flags: Record<string, boolean> } | null = null;

export function useBetaFeatures() {
  const { tenant } = useAuth();
  const [flags, setFlags] = useState<Record<string, boolean>>(
    cache?.tenantId === tenant?.id ? cache.flags : {}
  );
  const [loading, setLoading] = useState(
    cache?.tenantId !== tenant?.id
  );

  useEffect(() => {
    if (!tenant?.id) return;
    if (cache?.tenantId === tenant.id) {
      setFlags(cache.flags);
      setLoading(false);
      return;
    }

    supabase
      .from('tenant_beta_features')
      .select('feature_key, enabled')
      .eq('tenant_id', tenant.id)
      .then(({ data }) => {
        const result: Record<string, boolean> = {};
        for (const row of data ?? []) {
          result[row.feature_key] = row.enabled;
        }
        cache = { tenantId: tenant.id, flags: result };
        setFlags(result);
        setLoading(false);
      });
  }, [tenant?.id]);

  const isBetaEnabled = useCallback(
    (key: string) => flags[key] === true,
    [flags]
  );

  return { isBetaEnabled, loading };
}
