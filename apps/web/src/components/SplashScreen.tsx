import { useWhiteLabel } from '@/contexts/WhiteLabelContext';
import { Wand2 } from 'lucide-react';

/**
 * Full-screen branded loading screen shown during the initial auth check.
 * Stitch design: glowing orb + ambient blobs + Space Grotesk heading.
 */
export function SplashScreen() {
  const { config } = useWhiteLabel();

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-between bg-background-light dark:bg-background-dark z-50 font-display overflow-hidden">

      {/* Ambient background lighting */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary-500/20 rounded-full blur-[120px] opacity-40" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-purple-900/20 rounded-full blur-[100px] opacity-30" />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center relative z-10 px-6">
        {/* Glowing orb */}
        <div className="relative group animate-float mb-8">
          {/* Outer glow halo */}
          <div className="absolute inset-0 rounded-full bg-primary-500 blur-3xl opacity-30 animate-pulse-slow scale-150" />

          {/* Orb */}
          <div
            className="w-48 h-48 relative rounded-full flex items-center justify-center border border-white/10 animate-glow"
            style={{
              background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.1) 0%, rgba(51,13,242,0.4) 40%, rgba(19,16,34,0.9) 100%)',
              boxShadow: '0 0 60px rgba(51,13,242,0.4)',
              backdropFilter: 'blur(8px)',
            }}
          >
            {/* Inner core */}
            <div
              className="absolute w-24 h-24 rounded-full opacity-60"
              style={{ background: 'radial-gradient(circle, #6d28d9 0%, #330df2 70%, transparent 100%)' }}
            />

            {/* Icon */}
            {config.logo_url ? (
              <img src={config.logo_url} alt={config.brand_name} className="relative z-10 w-20 h-20 object-contain rounded-xl" />
            ) : (
              <Wand2 className="relative z-10 w-16 h-16 text-white opacity-90 rotate-12" />
            )}

            {/* Surface highlight */}
            <div className="absolute top-4 left-8 w-12 h-6 bg-white/10 rounded-full blur-md" />
          </div>
        </div>

        {/* Brand name */}
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-white tracking-tight mb-2">
          {config.brand_name}
        </h1>
        <p className="text-neutral-500 dark:text-neutral-400 text-sm">Crafting your magic…</p>
      </div>

      {/* Footer with loading bar */}
      <div className="relative z-20 w-full flex flex-col items-center pb-12 pt-6"
           style={{ background: 'linear-gradient(to top, #131022 0%, transparent 100%)' }}>
        {/* Shimmer loading bar */}
        <div className="w-12 h-1 bg-white/10 rounded-full overflow-hidden mb-6">
          <div
            className="h-full bg-primary-500 rounded-full animate-shimmer"
            style={{ width: '50%' }}
          />
        </div>

        {/* Loading dots */}
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-bounce"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
