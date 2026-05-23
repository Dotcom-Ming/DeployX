'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from './lib/utils';

export interface LogLine {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  group?: string;
}

interface TerminalLogsProps {
  logs: LogLine[];
  streaming?: boolean;
  height?: number;
  className?: string;
}

const levelColors: Record<string, string> = {
  info: 'text-zinc-400',
  warn: 'text-amber-400',
  error: 'text-red-400',
  debug: 'text-zinc-500',
};

export function TerminalLogs({ logs, streaming, height = 500, className }: TerminalLogsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  useEffect(() => {
    if (autoScroll && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    setAutoScroll(scrollHeight - scrollTop - clientHeight < 50);
  }, []);

  return (
    <div className={cn('flex flex-col rounded-lg border border-zinc-800 overflow-hidden', className)}>
      <div className="flex items-center gap-2 border-b border-zinc-800 bg-zinc-900 px-3 py-2">
        <button
          onClick={() => setAutoScroll(!autoScroll)}
          className={cn(
            'rounded px-2 py-1 text-xs',
            autoScroll ? 'bg-blue-600/20 text-blue-400' : 'text-zinc-500 hover:bg-zinc-800',
          )}
        >
          {autoScroll ? '自动滚动' : '已暂停'}
        </button>
      </div>
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="overflow-auto bg-zinc-950 font-mono text-[13px] leading-5"
        style={{ height }}
      >
        {logs.map((line) => (
          <div
            key={line.id}
            id={`log-${line.id}`}
            className={cn(
              'flex gap-3 px-4 hover:bg-zinc-900/50',
              line.level === 'error' && 'bg-red-950/20 hover:bg-red-950/30',
            )}
          >
            <span className="shrink-0 text-zinc-600">{line.timestamp}</span>
            <span className={cn('shrink-0 w-10 text-right uppercase', levelColors[line.level])}>
              {line.level}
            </span>
            <span className="text-zinc-300">{line.message}</span>
          </div>
        ))}
        {streaming && (
          <div className="flex items-center gap-2 px-4 py-1 text-zinc-500">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-blue-500" />
            流式输出中...
          </div>
        )}
      </div>
    </div>
  );
}
