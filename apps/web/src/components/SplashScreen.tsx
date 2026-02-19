import { useWhiteLabel } from '@/contexts/WhiteLabelContext';
import { Wand2 } from 'lucide-react';

/**
 * Full-screen branded loading screen shown during the initial auth check.
 * CSS-only animation, no heavy dependencies.
 */
export function SplashScreen() {
  const { config } = useWhiteLabel();

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-neutral-50 dark:bg-neutral-900 z-50">
      {/* Logo */}
      <div className="relative mb-8">
        <div
          className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-xl"
          style={{ backgroundColor: config.primary_color }}
        >
          {config.logo_url ? (
            <img
              src={config.logo_url}
              alt={config.brand_name}
              className="w-12 h-12 object-contain"
            />
          ) : (
            <Wand2 className="w-10 h-10 text-white" />
          )}
        </div>

        {/* Pulse ring */}
        <span
          className="absolute inset-0 rounded-2xl animate-ping opacity-20"
          style={{ backgroundColor: config.primary_color }}
        />
      </div>

      {/* Brand name */}
      <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-8">
        {config.brand_name}
      </h1>

      {/* Loading dots */}
      <div className="flex items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-2 h-2 rounded-full bg-primary-500 animate-bounce"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
