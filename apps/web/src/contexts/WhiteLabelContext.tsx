import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';

interface WhiteLabelConfig {
  brand_name: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  custom_domain: string | null;
  feature_flags: {
    ab_testing: boolean;
    voice_profiles: boolean;
    multi_esp: boolean;
    [key: string]: boolean;
  };
}

interface WhiteLabelContextType {
  config: WhiteLabelConfig;
  loading: boolean;
  isFeatureEnabled: (feature: string) => boolean;
}

const defaultConfig: WhiteLabelConfig = {
  brand_name: 'Newsletter Wizard',
  logo_url: null,
  primary_color: '#6366f1',
  secondary_color: '#8b5cf6',
  custom_domain: null,
  feature_flags: {
    ab_testing: true,
    voice_profiles: true,
    multi_esp: true,
  },
};

const WhiteLabelContext = createContext<WhiteLabelContextType>({
  config: defaultConfig,
  loading: true,
  isFeatureEnabled: () => true,
});

export function useWhiteLabel() {
  return useContext(WhiteLabelContext);
}

export function WhiteLabelProvider({ children }: { children: ReactNode }) {
  const { tenant } = useAuth();
  const [config, setConfig] = useState<WhiteLabelConfig>(defaultConfig);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWhiteLabelConfig();
  }, [tenant]);

  useEffect(() => {
    // Apply CSS variables when config changes
    if (config) {
      document.documentElement.style.setProperty('--color-primary', config.primary_color);
      document.documentElement.style.setProperty('--color-secondary', config.secondary_color);
      
      // Update meta theme-color for mobile browsers
      const metaTheme = document.querySelector('meta[name="theme-color"]');
      if (metaTheme) {
        metaTheme.setAttribute('content', config.primary_color);
      }
    }
  }, [config]);

  async function loadWhiteLabelConfig() {
    setLoading(true);
    
    try {
      // First check if we're on a custom domain
      const currentDomain = window.location.hostname;
      
      // Try to find white-label config by custom domain
      const { data: domainConfig } = await supabase
        .from('white_label_config')
        .select('*')
        .eq('custom_domain', currentDomain)
        .maybeSingle();
      
      if (domainConfig) {
        setConfig({
          brand_name: domainConfig.brand_name,
          logo_url: domainConfig.logo_url,
          primary_color: domainConfig.primary_color,
          secondary_color: domainConfig.secondary_color,
          custom_domain: domainConfig.custom_domain,
          feature_flags: domainConfig.feature_flags || defaultConfig.feature_flags,
        });
        setLoading(false);
        return;
      }
      
      // If no domain match and user has a tenant, check their partner config
      if (tenant?.id) {
        const { data: tenantData } = await supabase
          .from('tenants')
          .select('partner_id')
          .eq('id', tenant.id)
          .single();
        
        if (tenantData?.partner_id) {
          const { data: partnerConfig } = await supabase
            .from('white_label_config')
            .select('*')
            .eq('partner_id', tenantData.partner_id)
            .maybeSingle();
          
          if (partnerConfig) {
            setConfig({
              brand_name: partnerConfig.brand_name,
              logo_url: partnerConfig.logo_url,
              primary_color: partnerConfig.primary_color,
              secondary_color: partnerConfig.secondary_color,
              custom_domain: partnerConfig.custom_domain,
              feature_flags: partnerConfig.feature_flags || defaultConfig.feature_flags,
            });
          }
        }
      }
    } catch (error) {
      console.error('Error loading white-label config:', error);
    } finally {
      setLoading(false);
    }
  }

  function isFeatureEnabled(feature: string): boolean {
    return config.feature_flags[feature] !== false;
  }

  return (
    <WhiteLabelContext.Provider value={{ config, loading, isFeatureEnabled }}>
      {children}
    </WhiteLabelContext.Provider>
  );
}
