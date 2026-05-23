"use client";

import { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3006/api";

interface SystemData {
  services: { name: string; status: string; uptime: string; lastCheck: string; details: string }[];
  dbStats: {
    connections: { current: number; max: number; idle: number };
    queriesPerSecond: number;
    replicationLag: string;
    diskUsage: string;
  };
  redisStats: {
    connectedClients: number;
    usedMemory: string;
    hitRate: string;
    opsPerSecond: number;
  };
  queues: {
    deploy: { pending: number; active: number; completed: number; failed: number };
    build: { pending: number; active: number; completed: number; failed: number };
    ssl: { pending: number; active: number; completed: number; failed: number };
    email: { pending: number; active: number; completed: number; failed: number };
    cleanup: { pending: number; active: number; completed: number; failed: number };
  };
  recentErrors: { id: string; time: string; service: string; message: string; severity: string }[];
}

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

const isSystemData = (value: unknown): value is SystemData => {
  if (!value || typeof value !== "object") return false;
  const maybe = value as {
    services?: unknown;
    dbStats?: unknown;
    redisStats?: unknown;
    queues?: unknown;
    recentErrors?: unknown;
  };
  return (
    Array.isArray(maybe.services) &&
    !!maybe.dbStats &&
    !!maybe.redisStats &&
    !!maybe.queues &&
    Array.isArray(maybe.recentErrors)
  );
};

const unwrapApiData = <T,>(value: unknown): T | null => {
  if (!value || typeof value !== "object") return null;
  const maybe = value as Partial<ApiEnvelope<T>>;
  return maybe.data === undefined ? null : maybe.data;
};

const severityStyles: Record<string, string> = {
  error: "bg-error/10 text-error",
  warning: "bg-warning/10 text-warning",
};

export default function SystemPage() {
  const [data, setData] = useState<SystemData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchSystem = async () => {
      try {
        const token = localStorage.getItem("admin_token");
        const res = await fetch(`${API_URL}/admin/system`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (!cancelled) {
          if (res.ok) {
            const payload: unknown = await res.json();
            const normalized = unwrapApiData<SystemData>(payload) ?? payload;
            setData(isSystemData(normalized) ? normalized : null);
            setError(null);
          } else {
            setError(`API error: ${res.status}`);
          }
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setError("Failed to connect to API");
          setLoading(false);
        }
      }
    };

    fetchSystem();
    const interval = setInterval(fetchSystem, 30000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">System</h1>
          <p className="text-sm text-muted-foreground">Platform health and infrastructure monitoring</p>
        </div>
        <div className="rounded-lg border border-error/30 bg-error/5 p-6 text-center">
          <p className="text-error">{error}</p>
          <p className="mt-2 text-sm text-muted-foreground">Make sure the API server is running on {API_URL}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const queues = [
    { name: "deploy", ...data.queues.deploy },
    { name: "build", ...data.queues.build },
    { name: "ssl", ...data.queues.ssl },
    { name: "email", ...data.queues.email },
    { name: "cleanup", ...data.queues.cleanup },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">System</h1>
        <p className="text-sm text-muted-foreground">Platform health and infrastructure monitoring</p>
      </div>

      {/* Service Status */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {data.services.map((service) => (
          <div key={service.name} className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <div
                className={`h-2.5 w-2.5 rounded-full ${
                  service.status === "healthy" ? "bg-success" : "bg-warning"
                }`}
              />
              <h3 className="text-sm font-semibold text-foreground">{service.name}</h3>
            </div>
            <p className="text-xs text-muted-foreground">{service.details}</p>
            <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
              <span>Uptime: {service.uptime}</span>
              <span>{service.lastCheck}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Database Stats */}
        <div className="rounded-lg border border-border bg-card p-4">
          <h2 className="text-sm font-semibold text-foreground mb-4">Database</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Connections</span>
              <span className="text-sm font-mono text-foreground">
                {data.dbStats.connections.current} / {data.dbStats.connections.max}
                <span className="text-muted-foreground"> ({data.dbStats.connections.idle} idle)</span>
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted">
              <div
                className="h-2 rounded-full bg-info"
                style={{
                  width: `${(data.dbStats.connections.current / data.dbStats.connections.max) * 100}%`,
                }}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Queries/s</span>
              <span className="text-sm font-mono text-foreground">{data.dbStats.queriesPerSecond}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Replication Lag</span>
              <span className="text-sm font-mono text-foreground">{data.dbStats.replicationLag}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Disk Usage</span>
              <span className="text-sm font-mono text-foreground">{data.dbStats.diskUsage}</span>
            </div>
          </div>
        </div>

        {/* Redis Stats */}
        <div className="rounded-lg border border-border bg-card p-4">
          <h2 className="text-sm font-semibold text-foreground mb-4">Redis</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Connected Clients</span>
              <span className="text-sm font-mono text-foreground">{data.redisStats.connectedClients}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Used Memory</span>
              <span className="text-sm font-mono text-foreground">{data.redisStats.usedMemory}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Hit Rate</span>
              <span className="text-sm font-mono text-foreground">{data.redisStats.hitRate}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Ops/s</span>
              <span className="text-sm font-mono text-foreground">{data.redisStats.opsPerSecond}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Queue Stats */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h2 className="text-sm font-semibold text-foreground mb-4">Job Queues</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="pb-2 text-left font-medium text-muted-foreground">Queue</th>
                <th className="pb-2 text-right font-medium text-muted-foreground">Pending</th>
                <th className="pb-2 text-right font-medium text-muted-foreground">Active</th>
                <th className="pb-2 text-right font-medium text-muted-foreground">Completed</th>
                <th className="pb-2 text-right font-medium text-muted-foreground">Failed</th>
              </tr>
            </thead>
            <tbody>
              {queues.map((queue) => (
                <tr key={queue.name} className="border-b border-border/50 last:border-0">
                  <td className="py-2.5 font-mono text-xs text-foreground">{queue.name}</td>
                  <td className="py-2.5 text-right text-foreground">
                    {queue.pending > 0 ? (
                      <span className="text-warning">{queue.pending}</span>
                    ) : (
                      <span className="text-muted-foreground">0</span>
                    )}
                  </td>
                  <td className="py-2.5 text-right text-foreground">
                    {queue.active > 0 ? (
                      <span className="text-info">{queue.active}</span>
                    ) : (
                      <span className="text-muted-foreground">0</span>
                    )}
                  </td>
                  <td className="py-2.5 text-right text-muted-foreground">
                    {queue.completed.toLocaleString()}
                  </td>
                  <td className="py-2.5 text-right">
                    {queue.failed > 0 ? (
                      <span className="text-error">{queue.failed}</span>
                    ) : (
                      <span className="text-muted-foreground">0</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Errors */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h2 className="text-sm font-semibold text-foreground mb-4">Recent Errors</h2>
        <div className="space-y-2">
          {data.recentErrors.length === 0 ? (
            <div className="py-4 text-center text-muted-foreground">No recent errors</div>
          ) : (
            data.recentErrors.map((err) => (
              <div key={err.id} className="flex items-start gap-3 rounded-md border border-border/50 p-3">
                <span
                  className={`mt-0.5 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                    severityStyles[err.severity]
                  }`}
                >
                  {err.severity}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">{err.message}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {err.service} · {err.time}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
