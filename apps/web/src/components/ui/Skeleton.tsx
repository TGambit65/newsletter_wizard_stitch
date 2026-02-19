import clsx from 'clsx';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

export function Skeleton({ 
  className, 
  variant = 'rectangular',
  width,
  height,
  animation = 'pulse'
}: SkeletonProps) {
  return (
    <div
      className={clsx(
        'bg-neutral-200 dark:bg-neutral-700',
        animation === 'pulse' && 'animate-pulse',
        animation === 'wave' && 'animate-shimmer',
        variant === 'circular' && 'rounded-full',
        variant === 'text' && 'rounded',
        variant === 'rectangular' && 'rounded-lg',
        className
      )}
      style={{ width, height }}
    />
  );
}

// Pre-built skeleton patterns for common use cases
export function CardSkeleton() {
  return (
    <div className="bg-white dark:bg-surface-dark rounded-xl border border-neutral-200 dark:border-white/10 p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <Skeleton variant="rectangular" className="w-5 h-5" />
          <Skeleton variant="rectangular" className="w-10 h-10" />
        </div>
        <Skeleton variant="rectangular" className="w-16 h-5" />
      </div>
      <Skeleton variant="text" className="h-5 w-3/4 mb-2" />
      <Skeleton variant="text" className="h-4 w-full mb-3" />
      <div className="flex gap-4">
        <Skeleton variant="text" className="h-3 w-16" />
        <Skeleton variant="text" className="h-3 w-20" />
      </div>
    </div>
  );
}

export function TableRowSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 border-b border-neutral-200 dark:border-white/10">
      <Skeleton variant="circular" className="w-10 h-10" />
      <div className="flex-1">
        <Skeleton variant="text" className="h-4 w-1/3 mb-2" />
        <Skeleton variant="text" className="h-3 w-1/2" />
      </div>
      <Skeleton variant="rectangular" className="w-20 h-8" />
    </div>
  );
}

export function EditorSkeleton() {
  return (
    <div className="space-y-4">
      {/* Subject line skeleton */}
      <div className="bg-white dark:bg-surface-dark rounded-xl border border-neutral-200 dark:border-white/10 p-4">
        <Skeleton variant="text" className="h-4 w-24 mb-2" />
        <Skeleton variant="rectangular" className="h-10 w-full" />
      </div>
      
      {/* Editor skeleton */}
      <div className="bg-white dark:bg-surface-dark rounded-xl border border-neutral-200 dark:border-white/10 overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center gap-1 p-2 border-b border-neutral-200 dark:border-white/10">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} variant="rectangular" className="w-8 h-8" />
          ))}
        </div>
        {/* Content area */}
        <div className="p-4 space-y-3">
          <Skeleton variant="text" className="h-6 w-2/3" />
          <Skeleton variant="text" className="h-4 w-full" />
          <Skeleton variant="text" className="h-4 w-full" />
          <Skeleton variant="text" className="h-4 w-4/5" />
          <Skeleton variant="text" className="h-4 w-full" />
          <Skeleton variant="text" className="h-4 w-3/4" />
        </div>
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-surface-dark rounded-xl border border-neutral-200 dark:border-white/10 p-5">
            <Skeleton variant="text" className="h-4 w-24 mb-2" />
            <Skeleton variant="text" className="h-8 w-16 mb-1" />
            <Skeleton variant="text" className="h-3 w-20" />
          </div>
        ))}
      </div>
      
      {/* Content area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-surface-dark rounded-xl border border-neutral-200 dark:border-white/10 p-5">
          <Skeleton variant="text" className="h-6 w-40 mb-4" />
          {[...Array(3)].map((_, i) => (
            <TableRowSkeleton key={i} />
          ))}
        </div>
        <div className="bg-white dark:bg-surface-dark rounded-xl border border-neutral-200 dark:border-white/10 p-5">
          <Skeleton variant="text" className="h-6 w-32 mb-4" />
          <Skeleton variant="rectangular" className="h-48 w-full" />
        </div>
      </div>
    </div>
  );
}

export function KnowledgeBaseGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[...Array(6)].map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}
