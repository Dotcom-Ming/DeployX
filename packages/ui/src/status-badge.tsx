'use client';

import React from 'react';
import { cn } from './lib/utils';

export type StatusType = 'ready' | 'building' | 'error' | 'queued' | 'canceled';

interface StatusBadgeProps {
  status: StatusType;
  size?: 'sm' | 'md';
  variant?: 'solid' | 'soft' | 'outline';
  className?: string;
}

const statusConfig: Record<
  StatusType,
  { label: string; icon: string; solid: string; soft: string; outline: string }
> = {
  ready: {
    label: 'Ready',
    icon: '●',
    solid: 'bg-emerald-600 text-white border-emerald-600',
    soft: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    outline: 'text-emerald-600 border-emerald-500/40',
  },
  building: {
    label: 'Building',
    icon: '◌',
    solid: 'bg-blue-600 text-white border-blue-600',
    soft: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    outline: 'text-blue-600 border-blue-500/40',
  },
  error: {
    label: 'Error',
    icon: '✕',
    solid: 'bg-red-600 text-white border-red-600',
    soft: 'bg-red-500/10 text-red-600 border-red-500/20',
    outline: 'text-red-600 border-red-500/40',
  },
  queued: {
    label: 'Queued',
    icon: '◷',
    solid: 'bg-amber-600 text-white border-amber-600',
    soft: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    outline: 'text-amber-600 border-amber-500/40',
  },
  canceled: {
    label: 'Canceled',
    icon: '—',
    solid: 'bg-zinc-600 text-white border-zinc-600',
    soft: 'bg-zinc-500/10 text-zinc-600 border-zinc-500/20',
    outline: 'text-zinc-600 border-zinc-500/40',
  },
};

export function StatusBadge({ status, size = 'md', variant = 'soft', className }: StatusBadgeProps) {
  const config = statusConfig[status];
  const variantClass =
    variant === 'solid' ? config.solid : variant === 'outline' ? config.outline : config.soft;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border font-medium',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-0.5 text-sm',
        variantClass,
        className,
      )}
    >
      <span className={cn(size === 'sm' ? 'text-[10px]' : 'text-xs', status === 'building' && 'animate-pulse')}>
        {config.icon}
      </span>
      {config.label}
    </span>
  );
}
