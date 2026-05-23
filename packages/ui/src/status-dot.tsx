'use client';

import { cn } from './lib/utils';

export type StatusType = 'ready' | 'building' | 'error' | 'queued' | 'canceled';

interface StatusDotProps {
  status: StatusType;
  className?: string;
  pulse?: boolean;
}

const statusColors: Record<StatusType, string> = {
  ready: 'bg-emerald-500',
  building: 'bg-blue-500',
  error: 'bg-red-500',
  queued: 'bg-amber-500',
  canceled: 'bg-zinc-400',
};

export function StatusDot({ status, className, pulse }: StatusDotProps) {
  const shouldPulse = pulse ?? status === 'building';

  return (
    <span className={cn('relative flex h-2 w-2', className)}>
      {shouldPulse && (
        <span
          className={cn(
            'absolute inline-flex h-full w-full animate-ping rounded-full opacity-75',
            statusColors[status],
          )}
        />
      )}
      <span
        className={cn(
          'relative inline-flex h-2 w-2 rounded-full',
          statusColors[status],
        )}
      />
    </span>
  );
}
