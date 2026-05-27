"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TerminalLogs, type LogEntry } from "@/components/custom/terminal-logs";
import {
  Download,
  Search,
  Wifi,
  WifiOff,
  Clock,
  RefreshCw,
} from "lucide-react";
import { mockRuntimeLogs } from "@/lib/mock-data";

type LogLevel = "info" | "warn" | "error" | "success";

interface RuntimeLog {
  id: string;
  timestamp: string;
  level: LogLevel;
  message: string;
}

const additionalRuntimeLogs: RuntimeLog[] = [
  { id: "rl_13", timestamp: "10:31:50", level: "info", message: "GET /api/v1/projects 200 18ms" },
  { id: "rl_14", timestamp: "10:32:00", level: "info", message: "POST /api/v1/deployments 201 245ms" },
  { id: "rl_15", timestamp: "10:32:10", level: "warn", message: "Slow query detected: SELECT * FROM deployments WHERE status=1 took 320ms" },
  { id: "rl_16", timestamp: "10:32:20", level: "info", message: "GET /api/v1/usage 200 42ms" },
  { id: "rl_17", timestamp: "10:32:30", level: "error", message: "Failed to process webhook delivery: Connection refused to hooks.slack.com:443" },
  { id: "rl_18", timestamp: "10:32:40", level: "info", message: "Worker 3 picked up job: build-proj-abc123" },
  { id: "rl_19", timestamp: "10:32:50", level: "success", message: "Build completed for project deployx-web in 95s" },
  { id: "rl_20", timestamp: "10:33:00", level: "info", message: "GET /api/v1/domains 200 15ms" },
  { id: "rl_21", timestamp: "10:33:10", level: "warn", message: "Rate limit warning: IP 203.0.113.50 at 92/100 requests" },
  { id: "rl_22", timestamp: "10:33:20", level: "info", message: "WebSocket client connected (total: 5)" },
  { id: "rl_23", timestamp: "10:33:30", level: "info", message: "Scheduled job executed: usage-aggregation" },
  { id: "rl_24", timestamp: "10:33:40", level: "error", message: "TLS handshake failed for custom domain: cert expired for staging.app.com" },
  { id: "rl_25", timestamp: "10:33:50", level: "info", message: "DELETE /api/v1/tokens/tok_3 204 8ms" },
  { id: "rl_26", timestamp: "10:34:00", level: "success", message: "SSL certificate renewed for deployx.dev" },
  { id: "rl_27", timestamp: "10:34:10", level: "info", message: "GET /api/v1/members 200 28ms" },
  { id: "rl_28", timestamp: "10:34:20", level: "warn", message: "Memory usage at 82% for worker-2 - auto-scaling triggered" },
  { id: "rl_29", timestamp: "10:34:30", level: "info", message: "New instance provisioned: worker-5 (region: us-east-1)" },
  { id: "rl_30", timestamp: "10:34:40", level: "success", message: "Health check passed for all 6 services" },
];

const allMockLogs: RuntimeLog[] = [...mockRuntimeLogs, ...additionalRuntimeLogs];

function generateTimestamp(baseMinutes: number): string {
  const d = new Date(Date.now() - baseMinutes * 60000);
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

const streamingMessages: { level: LogLevel; message: string }[] = [
  { level: "info", message: "GET /api/v1/health 200 3ms" },
  { level: "info", message: "POST /api/v1/deployments 201 189ms" },
  { level: "warn", message: "Connection pool at 75% capacity" },
  { level: "info", message: "GET /api/v1/projects 200 22ms" },
  { level: "error", message: "Request timeout: POST /api/v1/webhooks after 10000ms" },
  { level: "success", message: "Certificate auto-renewal completed for *.deployx.dev" },
  { level: "info", message: "WebSocket connection established from client abc123" },
  { level: "info", message: "DELETE /api/v1/env/ev_9 204 6ms" },
  { level: "warn", message: "Disk usage at 70% on volume /data" },
  { level: "info", message: "Build job queued: proj-marketing-site branch feat/design" },
];

export default function LogsPage() {
  const { id: projectId = "" } = useParams<{
    org: string;
    id: string;
  }>();
  const [logs, setLogs] = useState<LogEntry[]>(() =>
    allMockLogs.map((log) => ({
      id: log.id,
      timestamp: log.timestamp,
      level: log.level,
      message: log.message,
    }))
  );
  const [wsConnected, setWsConnected] = useState(false);
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isPaused, setIsPaused] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const streamIdxRef = useRef(0);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const connectWs = () => {
      try {
        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const wsUrl = `${protocol}//${window.location.host}/api/ws/logs?projectId=${projectId}`;
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => setWsConnected(true);
        ws.onclose = () => {
          setWsConnected(false);
          setTimeout(connectWs, 5000);
        };
        ws.onerror = () => ws.close();
        ws.onmessage = (event) => {
          try {
            const entry = JSON.parse(event.data);
            setLogs((prev) => [...prev, {
              id: entry.id || `live-${Date.now()}-${Math.random()}`,
              timestamp: entry.timestamp || generateTimestamp(0),
              level: entry.level || "info",
              message: entry.message,
            }]);
          } catch { /* ignore malformed messages */ }
        };
      } catch {
        setWsConnected(false);
      }
    };

    connectWs();
    return () => {
      wsRef.current?.close();
    };
  }, [projectId]);

  useEffect(() => {
    if (wsConnected || isPaused) return;

    const interval = setInterval(() => {
      const msg = streamingMessages[streamIdxRef.current % streamingMessages.length];
      streamIdxRef.current++;
      setLogs((prev) => [
        ...prev,
        {
          id: `live-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          timestamp: generateTimestamp(0),
          level: msg.level,
          message: msg.message,
        },
      ]);
    }, 3000 + Math.random() * 4000);

    return () => clearInterval(interval);
  }, [wsConnected, isPaused]);

  const filteredLogs = useMemo(() => {
    let result = logs;
    if (levelFilter !== "all") {
      result = result.filter((log) => log.level === levelFilter);
    }
    if (searchQuery) {
      const lower = searchQuery.toLowerCase();
      result = result.filter(
        (log) =>
          log.message.toLowerCase().includes(lower) ||
          log.level.toLowerCase().includes(lower)
      );
    }
    return result;
  }, [logs, levelFilter, searchQuery]);

  const errorCount = useMemo(
    () => logs.filter((l) => l.level === "error").length,
    [logs]
  );

  const handleExport = useCallback(() => {
    const content = filteredLogs
      .map((log) => `[${log.timestamp}] ${log.level.toUpperCase()}: ${log.message}`)
      .join("\n");
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `runtime-logs-${projectId}-${new Date().toISOString().slice(0, 10)}.log`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filteredLogs, projectId]);

  const handleRefresh = () => {
    setLastRefresh(new Date());
    const freshLogs: LogEntry[] = allMockLogs.map((log) => ({
      id: `${log.id}-r${Date.now()}`,
      timestamp: log.timestamp,
      level: log.level,
      message: log.message,
    }));
    setLogs(freshLogs);
    streamIdxRef.current = 0;
  };

  const levelCounts = useMemo(() => {
    const counts: Record<string, number> = { info: 0, warn: 0, error: 0, success: 0 };
    logs.forEach((l) => { counts[l.level] = (counts[l.level] || 0) + 1; });
    return counts;
  }, [logs]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">日志</h1>
          <p className="text-muted-foreground text-sm mt-1">
            项目的实时运行时日志
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsPaused(!isPaused)}
          >
            {isPaused ? (
              <RefreshCw className="h-4 w-4 mr-1" />
            ) : (
              <Clock className="h-4 w-4 mr-1" />
            )}
            {isPaused ? "恢复" : "暂停"}
          </Button>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-1" />
            刷新
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-1" />
            导出
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索日志内容..."
            className="pl-9 h-9"
          />
        </div>
        <Select value={levelFilter} onValueChange={setLevelFilter}>
          <SelectTrigger className="w-[140px] h-9">
            <SelectValue placeholder="日志级别" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部级别</SelectItem>
            <SelectItem value="info">
              Info ({levelCounts.info})
            </SelectItem>
            <SelectItem value="warn">
              Warn ({levelCounts.warn})
            </SelectItem>
            <SelectItem value="error">
              Error ({levelCounts.error})
            </SelectItem>
            <SelectItem value="success">
              Success ({levelCounts.success})
            </SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2 ml-auto text-xs text-muted-foreground">
          <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full border ${
            wsConnected
              ? "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-400"
              : "border-zinc-200 bg-zinc-50 text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400"
          }`}>
            {wsConnected ? (
              <Wifi className="h-3 w-3" />
            ) : (
              <WifiOff className="h-3 w-3" />
            )}
            {wsConnected ? "实时连接" : "模拟数据"}
          </div>
          {errorCount > 0 && (
            <Badge variant="destructive" className="text-[11px]">
              {errorCount} 个错误
            </Badge>
          )}
          <span>
            {filteredLogs.length} / {logs.length} 条
          </span>
        </div>
      </div>

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <TerminalLogs
            logs={filteredLogs}
            wsConnected={wsConnected || !isPaused}
            className="h-[600px]"
          />
        </CardContent>
      </Card>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          最后刷新: {lastRefresh.toLocaleTimeString()}
        </span>
        <span>
          {!wsConnected && "未连接到 WebSocket，显示模拟实时日志"}
        </span>
      </div>
    </div>
  );
}
