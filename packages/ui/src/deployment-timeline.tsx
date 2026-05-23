'use client';

import React from 'react';
import { cn } from './lib/utils';

export type StageStatus = 'completed' | 'in-progress' | 'pending' | 'failed';

interface BuildStage {
  name: string;
  status: StageStatus;
  duration?: string;
}

interface DeploymentTimelineProps {
  stages: BuildStage[];
  className?: string;
}

const stageSymbols: Record<StageStatus, string> = {
  completed: '✓',
  'in-progress': '●',
  pending: '○',
  failed: '✕',
};

const stageColors: Record<StageStatus, string> = {
  completed: 'text-emerald-500 border-emerald-500 bg-emerald-500/10',
  'in-progress': 'text-blue-500 border-blue-500 bg-blue-500/10',
  pending: 'text-zinc-400 border-zinc-300 bg-zinc-50 dark:bg-zinc-800',
  failed: 'text-red-500 border-red-500 bg-red-500/10',
};

const lineColors: Record<StageStatus, string> = {
  completed: 'bg-emerald-500',
  'in-progress': 'bg-blue-500',
  pending: 'bg-zinc-300',
  failed: 'bg-red-500',
};

export function DeploymentTimeline({ stages, className }: DeploymentTimelineProps) {
  return (
    <div className={cn('flex items-center gap-0', className)}>
      {stages.map((stage, index) => {
        const isLast = index === stages.length - 1;
        return (
          <div key={stage.name} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-bold',
                  stageColors[stage.status],
                )}
              >
                {stageSymbols[stage.status]}
              </div>
              <span className="text-xs font-medium text-muted-foreground">{stage.name}</span>
              {stage.duration && (
                <span className="text-[10px] text-muted-foreground">{stage.duration}</span>
              )}
            </div>
            {!isLast && (
              <div className={cn('h-0.5 w-12', lineColors[stage.status])} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export type { BuildStage };
