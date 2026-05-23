"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Search, ChevronDown, ChevronRight, Download, Trash2, Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Virtuoso } from "react-virtuoso";

export interface LogEntry {
  id: string;
  timestamp: string;
  level: "info" | "warn" | "error" | "success";
  message: string;
  group?: string;
}

interface TerminalLogsProps {
  logs: LogEntry[];
  searchable?: boolean;
  showControls?: boolean;
  autoScroll?: boolean;
  className?: string;
  wsConnected?: boolean;
}

const ANSI_ESCAPE_REGEX = /\x1b\[([0-9;]*)m/g;

const ANSI_COLORS: Record<string, string> = {
  "30": "text-zinc-400",
  "31": "text-red-400",
  "32": "text-green-400",
  "33": "text-yellow-400",
  "34": "text-blue-400",
  "35": "text-purple-400",
  "36": "text-cyan-400",
  "37": "text-zinc-200",
  "90": "text-zinc-500",
  "91": "text-red-300",
  "92": "text-green-300",
  "93": "text-yellow-300",
  "94": "text-blue-300",
  "95": "text-purple-300",
  "96": "text-cyan-300",
  "97": "text-white",
};

const ANSI_BG_COLORS: Record<string, string> = {
  "40": "bg-zinc-800",
  "41": "bg-red-900/30",
  "42": "bg-green-900/30",
  "43": "bg-yellow-900/30",
  "44": "bg-blue-900/30",
  "45": "bg-purple-900/30",
  "46": "bg-cyan-900/30",
  "47": "bg-zinc-700",
};

function parseAnsiCodes(codes: string): string[] {
  return codes.split(";").filter(Boolean);
}

function parseAnsiString(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;
  let currentClasses: string[] = [];

  const resetClasses = () => {
    currentClasses = [];
  };

  while ((match = ANSI_ESCAPE_REGEX.exec(text)) !== null) {
    if (match.index > lastIndex) {
      const plainText = text.slice(lastIndex, match.index);
      if (plainText) {
        parts.push(
          <span key={lastIndex} className={currentClasses.join(" ")}>
            {plainText}
          </span>
        );
      }
    }

    const codes = parseAnsiCodes(match[1]);
    for (const code of codes) {
      if (code === "0" || code === "") {
        resetClasses();
      } else if (code === "1") {
        currentClasses.push("font-bold");
      } else if (code === "3") {
        currentClasses.push("italic");
      } else if (code === "4") {
        currentClasses.push("underline");
      } else if (ANSI_COLORS[code]) {
        currentClasses.push(ANSI_COLORS[code]);
      } else if (ANSI_BG_COLORS[code]) {
        currentClasses.push(ANSI_BG_COLORS[code]);
      }
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    const remaining = text.slice(lastIndex);
    if (remaining) {
      parts.push(
        <span key={lastIndex} className={currentClasses.join(" ")}>
          {remaining}
        </span>
      );
    }
  }

  return parts.length > 0 ? parts : [text];
}

function highlightSearch(text: string, search: string): React.ReactNode {
  if (!search) return text;

  const lowerText = text.toLowerCase();
  const lowerSearch = search.toLowerCase();
  const index = lowerText.indexOf(lowerSearch);

  if (index === -1) return text;

  return (
    <>
      {text.slice(0, index)}
      <span className="bg-yellow-500/30 text-yellow-200 rounded px-0.5">
        {text.slice(index, index + search.length)}
      </span>
      {text.slice(index + search.length)}
    </>
  );
}

export function TerminalLogs({
  logs,
  searchable = true,
  showControls = true,
  autoScroll: initialAutoScroll = true,
  className,
  wsConnected = false,
}: TerminalLogsProps) {
  const [search, setSearch] = React.useState("");
  const [collapsed, setCollapsed] = React.useState<Record<string, boolean>>({});
  const [autoScroll, setAutoScroll] = React.useState(initialAutoScroll);
  const [isPaused, setIsPaused] = React.useState(false);

  const filteredLogs = React.useMemo(() => {
    if (!search) return logs;
    const lower = search.toLowerCase();
    return logs.filter(
      (l) =>
        l.message.toLowerCase().includes(lower) ||
        l.level.toLowerCase().includes(lower) ||
        (l.group && l.group.toLowerCase().includes(lower))
    );
  }, [logs, search]);

  const levelColors: Record<string, string> = {
    info: "text-blue-400",
    warn: "text-yellow-400 bg-yellow-500/5",
    error: "text-red-400 bg-red-500/10",
    success: "text-green-400",
  };

  const toggleGroup = (group: string) => {
    setCollapsed((prev) => ({ ...prev, [group]: !prev[group] }));
  };

  const handleDownload = () => {
    const content = logs
      .map((log) => `[${log.timestamp}] ${log.level.toUpperCase()}: ${log.message}`)
      .join("\n");

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `deployx-logs-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    // In a real app, this would clear logs via WebSocket or API
  };

  const groups = React.useMemo(() => {
    const map = new Map<string, LogEntry[]>();
    const ungrouped: LogEntry[] = [];
    logs.forEach((log) => {
      if (log.group) {
        if (!map.has(log.group)) map.set(log.group, []);
        map.get(log.group)!.push(log);
      } else {
        ungrouped.push(log);
      }
    });
    return { groups: map, ungrouped };
  }, [logs]);

  const renderLogLine = (log: LogEntry, index: number) => {
    const isError = log.level === "error";
    const isWarning = log.level === "warn";

    return (
      <div
        key={log.id}
        className={cn(
          "flex gap-3 px-4 py-0.5 hover:bg-white/5 font-mono text-[13px] leading-5",
          levelColors[log.level],
          isError && "border-l-2 border-red-500/50",
          isWarning && "border-l-2 border-yellow-500/30"
        )}
      >
        <span className="text-muted-foreground shrink-0 w-[80px]">{log.timestamp}</span>
        <span className="shrink-0 w-[50px] uppercase text-[11px] font-bold mt-0.5">{log.level}</span>
        <span className="flex-1 break-all">
          {search ? highlightSearch(log.message, search) : parseAnsiString(log.message)}
        </span>
      </div>
    );
  };

  return (
    <div className={cn("flex flex-col rounded-lg border bg-zinc-950 overflow-hidden", className)}>
      {(searchable || showControls) && (
        <div className="flex items-center gap-2 px-4 py-2 border-b border-zinc-800 bg-zinc-900">
          {searchable && (
            <div className="relative flex-1">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="搜索日志..."
                className="w-full bg-zinc-800 border border-zinc-700 rounded pl-8 pr-3 py-1 text-xs text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600"
              />
            </div>
          )}
          {showControls && (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-zinc-400 hover:text-zinc-200"
                onClick={() => setIsPaused(!isPaused)}
              >
                {isPaused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-zinc-400 hover:text-zinc-200"
                onClick={handleDownload}
              >
                <Download className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-zinc-400 hover:text-zinc-200"
                onClick={handleClear}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
              <div className="flex items-center gap-1 ml-2">
                <div className={cn("h-2 w-2 rounded-full", wsConnected ? "bg-green-500" : "bg-zinc-600")} />
                <span className="text-[11px] text-zinc-500">{wsConnected ? "实时" : "已断开"}</span>
              </div>
            </div>
          )}
        </div>
      )}
      <div className="flex-1 overflow-hidden min-h-[200px] max-h-[600px]">
        {search ? (
          <div className="overflow-auto py-2 h-full">
            {filteredLogs.map((log, i) => renderLogLine(log, i))}
            {filteredLogs.length === 0 && (
              <div className="flex items-center justify-center py-12 text-zinc-600 text-sm">
                没有匹配的日志
              </div>
            )}
          </div>
        ) : (
          <Virtuoso
            data={logs}
            itemContent={(index, log) => renderLogLine(log, index)}
            followOutput={autoScroll && !isPaused ? "smooth" : false}
            className="py-2"
            style={{ height: "100%" }}
          />
        )}
      </div>
    </div>
  );
}
