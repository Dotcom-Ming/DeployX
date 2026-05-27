"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { LogEntry } from "@/components/custom/terminal-logs";

interface UseDeploymentLogsReturn {
  logs: LogEntry[];
  connected: boolean;
  error: string | null;
}

export function useDeploymentLogs(deploymentId: string | null): UseDeploymentLogsReturn {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connect = useCallback(() => {
    if (!deploymentId) return;

    const wsUrl =
      import.meta.env.VITE_WS_URL ?? "ws://localhost:8080";
    const ws = new WebSocket(
      `${wsUrl}/deployments/${deploymentId}/logs`
    );

    ws.onopen = () => {
      setConnected(true);
      setError(null);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const logLine: LogEntry = {
          id: data.id ?? crypto.randomUUID(),
          timestamp: data.timestamp ?? new Date().toISOString(),
          message: data.message,
          level: data.level ?? "info",
        };
        setLogs((prev) => [...prev, logLine]);
      } catch {
        // Plain text log
        setLogs((prev) => [
          ...prev,
            {
              id: crypto.randomUUID(),
              timestamp: new Date().toISOString(),
              message: event.data,
              level: "info",
            },
          ]);
      }
    };

    ws.onerror = () => {
      setError("Connection error");
    };

    ws.onclose = () => {
      setConnected(false);
      // Reconnect after 3 seconds
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, 3000);
    };

    wsRef.current = ws;
  }, [deploymentId]);

  useEffect(() => {
    connect();

    return () => {
      wsRef.current?.close();
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connect]);

  return { logs, connected, error };
}
