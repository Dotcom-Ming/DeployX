"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  Search,
  ChevronDown,
  ChevronRight,
  Download,
  Trash2,
  Pause,
  Play,
  AlertTriangle,
  Copy,
  Check,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Virtuoso, type VirtuosoHandle } from "react-virtuoso";

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

type FlatItem =
  | { type: "group-header"; group: string; count: number; firstTimestamp: string; lastTimestamp: string }
  | { type: "log"; log: LogEntry; lineNumber: number };

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
  const [copiedLineId, setCopiedLineId] = React.useState<string | null>(null);
  const [currentErrorIdx, setCurrentErrorIdx] = React.useState(-1);
  const [activeHashLine, setActiveHashLine] = React.useState<string | null>(null);

  const virtuosoRef = React.useRef<VirtuosoHandle>(null);
  const copiedTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const levelColors: Record<string, string> = {
    info: "text-blue-400",
    warn: "text-yellow-400 bg-yellow-500/5",
    error: "text-red-400 bg-red-500/10",
    success: "text-green-400",
  };

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

  const flatItems = React.useMemo(() => {
    const items: FlatItem[] = [];
    const groupMeta = new Map<string, { count: number; firstTimestamp: string; lastTimestamp: string }>();

    for (const log of logs) {
      if (log.group) {
        if (!groupMeta.has(log.group)) {
          groupMeta.set(log.group, { count: 1, firstTimestamp: log.timestamp, lastTimestamp: log.timestamp });
        } else {
          const meta = groupMeta.get(log.group)!;
          meta.count++;
          meta.lastTimestamp = log.timestamp;
        }
      }
    }

    const emittedGroups = new Set<string>();
    let lineNumber = 0;
    for (const log of logs) {
      if (log.group) {
        if (!emittedGroups.has(log.group)) {
          emittedGroups.add(log.group);
          const meta = groupMeta.get(log.group)!;
          items.push({
            type: "group-header",
            group: log.group,
            count: meta.count,
            firstTimestamp: meta.firstTimestamp,
            lastTimestamp: meta.lastTimestamp,
          });
        }
        if (!collapsed[log.group]) {
          lineNumber++;
          items.push({ type: "log", log, lineNumber });
        }
      } else {
        lineNumber++;
        items.push({ type: "log", log, lineNumber });
      }
    }

    return items;
  }, [logs, collapsed]);

  const errorIndices = React.useMemo(() => {
    return flatItems
      .map((item, idx) => (item.type === "log" && item.log.level === "error" ? idx : -1))
      .filter((idx) => idx !== -1);
  }, [flatItems]);

  const errorCount = errorIndices.length;

  const toggleGroup = (group: string) => {
    setCollapsed((prev) => ({ ...prev, [group]: !prev[group] }));
  };

  const jumpToNextError = () => {
    if (errorIndices.length === 0) return;
    const next = currentErrorIdx + 1;
    const target = next >= errorIndices.length ? 0 : next;
    setCurrentErrorIdx(target);
    virtuosoRef.current?.scrollToIndex({
      index: errorIndices[target],
      align: "center",
      behavior: "smooth",
    });
  };

  const jumpToPrevError = () => {
    if (errorIndices.length === 0) return;
    const prev = currentErrorIdx - 1;
    const target = prev < 0 ? errorIndices.length - 1 : prev;
    setCurrentErrorIdx(target);
    virtuosoRef.current?.scrollToIndex({
      index: errorIndices[target],
      align: "center",
      behavior: "smooth",
    });
  };

  const handleCopyLine = (log: LogEntry) => {
    const text = `[${log.timestamp}] ${log.level.toUpperCase()}: ${log.message}`;
    navigator.clipboard.writeText(text);
    setCopiedLineId(log.id);
    if (copiedTimeoutRef.current) clearTimeout(copiedTimeoutRef.current);
    copiedTimeoutRef.current = setTimeout(() => setCopiedLineId(null), 2000);
  };

  const handleLineNumberClick = (logId: string) => {
    window.location.hash = `log-${logId}`;
  };

  React.useEffect(() => {
    const checkHash = () => {
      const hash = window.location.hash;
      if (hash.startsWith("#log-")) {
        setActiveHashLine(hash.slice(5));
      } else {
        setActiveHashLine(null);
      }
    };
    checkHash();
    window.addEventListener("hashchange", checkHash);
    return () => window.removeEventListener("hashchange", checkHash);
  }, []);

  React.useEffect(() => {
    const hash = window.location.hash;
    if (!hash.startsWith("#log-")) return;
    const targetId = hash.slice(5);
    const idx = flatItems.findIndex(
      (item) => item.type === "log" && item.log.id === targetId
    );
    if (idx !== -1) {
      setTimeout(() => {
        virtuosoRef.current?.scrollToIndex({
          index: idx,
          align: "center",
          behavior: "smooth",
        });
      }, 150);
    }
  }, [flatItems]);

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

  const handleClear = () => {};

  const renderGroupHeader = (item: FlatItem & { type: "group-header" }) => {
    const isCollapsed = !!collapsed[item.group];
    return (
      <div
        className="flex items-center gap-2 px-4 py-1.5 cursor-pointer hover:bg-white/5 select-none border-b border-zinc-800/50"
        onClick={() => toggleGroup(item.group)}
      >
        {isCollapsed ? (
          <ChevronRight className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
        )}
        <span className="text-zinc-300 font-mono text-[13px] font-semibold">{item.group}</span>
        <span className="text-zinc-600 text-[11px]">
          {item.count} 行 · {item.firstTimestamp} → {item.lastTimestamp}
        </span>
        {isCollapsed && (
          <span className="text-zinc-600 text-[11px] ml-auto">
            {item.count} 行已折叠
          </span>
        )}
      </div>
    );
  };

  const renderLogLine = (log: LogEntry, lineNumber: number, inSearch: boolean = false) => {
    const isError = log.level === "error";
    const isWarning = log.level === "warn";
    const isHighlighted = activeHashLine === log.id;

    return (
      <div
        key={log.id}
        id={`log-${log.id}`}
        className={cn(
          "group flex gap-3 px-4 py-0.5 hover:bg-white/5 font-mono text-[13px] leading-5",
          levelColors[log.level],
          isError && "border-l-2 border-red-500/50",
          isWarning && "border-l-2 border-yellow-500/30",
          isHighlighted && "bg-yellow-500/10 ring-1 ring-inset ring-yellow-500/30"
        )}
      >
        <button
          onClick={() => handleLineNumberClick(log.id)}
          className="text-zinc-700 hover:text-zinc-400 shrink-0 w-[36px] text-right cursor-pointer bg-transparent border-none p-0"
          title="链接到此行"
        >
          {lineNumber}
        </button>
        <span className="text-muted-foreground shrink-0 w-[80px]">{log.timestamp}</span>
        <span className="shrink-0 w-[50px] uppercase text-[11px] font-bold mt-0.5">{log.level}</span>
        <span className="flex-1 break-all">
          {search ? highlightSearch(log.message, search) : parseAnsiString(log.message)}
        </span>
        <button
          onClick={(e) => { e.stopPropagation(); handleCopyLine(log); }}
          className="opacity-0 group-hover:opacity-100 shrink-0 self-center transition-opacity bg-transparent border-none p-0 cursor-pointer"
          title="复制此行"
        >
          {copiedLineId === log.id ? (
            <Check className="h-3 w-3 text-green-400" />
          ) : (
            <Copy className="h-3 w-3 text-zinc-500 hover:text-zinc-300" />
          )}
        </button>
      </div>
    );
  };

  const renderFlatItem = (index: number) => {
    const item = flatItems[index];
    if (item.type === "group-header") {
      return renderGroupHeader(item);
    }
    return renderLogLine(item.log, item.lineNumber);
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
              {errorCount > 0 && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-zinc-400 hover:text-zinc-200"
                    onClick={jumpToPrevError}
                    title="上一个错误"
                  >
                    <ChevronUp className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn("h-7 gap-1 px-2 text-red-400 hover:text-red-300 hover:bg-red-500/10")}
                    onClick={jumpToNextError}
                    title="下一个错误"
                  >
                    <AlertTriangle className="h-3.5 w-3.5" />
                    <span className="text-[11px]">{errorCount} 个错误</span>
                  </Button>
                </>
              )}
              {errorCount === 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-zinc-600"
                  disabled
                  title="无错误"
                >
                  <AlertTriangle className="h-3.5 w-3.5" />
                </Button>
              )}
              <div className="w-px h-4 bg-zinc-700 mx-1" />
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
            {filteredLogs.map((log, i) => renderLogLine(log, i + 1, true))}
            {filteredLogs.length === 0 && (
              <div className="flex items-center justify-center py-12 text-zinc-600 text-sm">
                没有匹配的日志
              </div>
            )}
          </div>
        ) : (
          <Virtuoso
            ref={virtuosoRef}
            data={flatItems}
            itemContent={(index) => renderFlatItem(index)}
            followOutput={autoScroll && !isPaused ? "smooth" : false}
            className="py-2"
            style={{ height: "100%" }}
          />
        )}
      </div>
    </div>
  );
}
