import clsx from 'clsx';
import type { ComponentType } from 'react';

interface Integration {
  name: string;
  description: string;
  connected: boolean;
  icon: ComponentType<{ className?: string }>;
}

interface IntegrationSettingsProps {
  integrations: Integration[];
}

export function IntegrationSettings({ integrations }: IntegrationSettingsProps) {
  return (
    <div className="bg-white dark:bg-surface-dark rounded-xl border border-neutral-200 dark:border-white/10">
      <div className="p-6 border-b border-neutral-200 dark:border-white/10">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Integrations</h2>
        <p className="text-neutral-500 text-sm mt-1">Connect your favorite tools</p>
      </div>
      <div className="divide-y divide-neutral-200 dark:divide-white/5">
        {integrations.map((integration) => (
          <div key={integration.name} className="flex items-center justify-between p-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-neutral-100 dark:bg-neutral-700 rounded-lg flex items-center justify-center">
                <integration.icon className="w-6 h-6 text-neutral-500" />
              </div>
              <div>
                <p className="font-medium text-neutral-900 dark:text-white">{integration.name}</p>
                <p className="text-sm text-neutral-500">{integration.description}</p>
              </div>
            </div>
            <button
              className={clsx(
                'px-4 py-2 rounded-lg font-medium text-sm transition-colors',
                integration.connected
                  ? 'bg-success/10 text-success'
                  : 'bg-primary-500 text-white hover:bg-primary-600'
              )}
            >
              {integration.connected ? 'Connected' : 'Connect'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
