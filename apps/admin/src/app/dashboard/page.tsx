"use client";

import { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3006/api";

interface DashboardData {
  stats: {
    totalUsers: number;
    usersThisWeek: number;
    totalOrgs: number;
    orgsThisWeek: number;
    totalDeployments: number;
    deploymentsThisWeek: number;
    deploymentChange: string;
  };
  signupsByDay: { day: string; value: number }[];
  deploymentsByDay: { day: string; value: number }[];
  systemHealth: { name: string; status: string; uptime: string; latency: string }[];
  recentActivity: { id: string; user: string; action: string; target: string; time: string; status: string }[];
}

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

const isDashboardData = (value: unknown): value is DashboardData => {
  if (!value || typeof value !== "object") return false;
  const maybe = value as {
    stats?: unknown;
    signupsByDay?: unknown;
    deploymentsByDay?: unknown;
    systemHealth?: unknown;
    recentActivity?: unknown;
  };
  return (
    !!maybe.stats &&
    Array.isArray(maybe.signupsByDay) &&
    Array.isArray(maybe.deploymentsByDay) &&
    Array.isArray(maybe.systemHealth) &&
    Array.isArray(maybe.recentActivity)
  );
};

const unwrapApiData = <T,>(value: unknown): T | null => {
  if (!value || typeof value !== "object") return null;
  const maybe = value as Partial<ApiEnvelope<T>>;
  return maybe.data === undefined ? null : maybe.data;
};

function MiniBarChart({ data, maxVal }: { data: { day: string; value: number }[]; maxVal: number }) {
  return (
    <div className="flex items-end gap-2 h-20">
      {data.map((d) => (
        <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
          <div
            className="w-full bg-primary/20 rounded-t-sm"
            style={{ height: `${(d.value / maxVal) * 100}%`, minHeight: "4px" }}
          />
          <span className="text-[10px] text-muted-foreground">{d.day}</span>
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchDashboard = async () => {
      try {
        const res = await fetch(`${API_URL}/admin/dashboard`);
        if (!cancelled) {
          if (res.ok) {
            const payload: unknown = await res.json();
            const normalized = unwrapApiData<DashboardData>(payload) ?? payload;
            if (isDashboardData(normalized)) {
              setData(normalized);
              setError(null);
            } else {
              setData(null);
              setError("Unexpected API response format for dashboard");
            }
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

    fetchDashboard();
    return () => { cancelled = true; };
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
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Platform overview and key metrics</p>
        </div>
        <div className="rounded-lg border border-error/30 bg-error/5 p-6 text-center">
          <p className="text-error">{error}</p>
          <p className="mt-2 text-sm text-muted-foreground">Make sure the API server is running on {API_URL}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const stats = [
    { label: "Total Users", value: data.stats.totalUsers.toLocaleString(), change: `+${data.stats.usersThisWeek} this week`, trend: "up" as const },
    { label: "Total Orgs", value: data.stats.totalOrgs.toLocaleString(), change: `+${data.stats.orgsThisWeek} this week`, trend: "up" as const },
    { label: "Deployments (7d)", value: data.stats.deploymentsThisWeek.toLocaleString(), change: `${data.stats.deploymentChange} vs last week`, trend: "up" as const },
    { label: "Total Deployments", value: data.stats.totalDeployments.toLocaleString(), change: "All time", trend: "up" as const },
  ];

  const maxSignups = Math.max(...data.signupsByDay.map((d) => d.value), 1);
  const maxDeployments = Math.max(...data.deploymentsByDay.map((d) => d.value), 1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Platform overview and key metrics</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-lg border border-border bg-card p-4">
            <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
            <p className="mt-1 text-2xl font-bold text-foreground">{stat.value}</p>
            <p className={`mt-1 text-xs ${stat.trend === "up" ? "text-success" : "text-error"}`}>
              {stat.change}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-4">
          <h2 className="text-sm font-semibold text-foreground mb-4">Signups This Week</h2>
          <MiniBarChart data={data.signupsByDay} maxVal={maxSignups} />
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <h2 className="text-sm font-semibold text-foreground mb-4">Deployments This Week</h2>
          <MiniBarChart data={data.deploymentsByDay} maxVal={maxDeployments} />
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <h2 className="text-sm font-semibold text-foreground mb-4">System Health</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {data.systemHealth.map((service) => (
            <div key={service.name} className="flex items-center gap-3 rounded-md border border-border p-3">
              <div className={`h-2.5 w-2.5 rounded-full ${service.status === "healthy" ? "bg-success" : "bg-warning"}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{service.name}</p>
                <p className="text-xs text-muted-foreground">{service.uptime} uptime · {service.latency}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <h2 className="text-sm font-semibold text-foreground mb-4">Recent Activity</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="pb-2 text-left font-medium text-muted-foreground">User</th>
                <th className="pb-2 text-left font-medium text-muted-foreground">Action</th>
                <th className="pb-2 text-left font-medium text-muted-foreground">Target</th>
                <th className="pb-2 text-left font-medium text-muted-foreground">Time</th>
                <th className="pb-2 text-left font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.recentActivity.length === 0 ? (
                <tr><td colSpan={5} className="py-4 text-center text-muted-foreground">No recent activity</td></tr>
              ) : (
                data.recentActivity.map((activity) => (
                  <tr key={activity.id} className="border-b border-border/50 last:border-0">
                    <td className="py-2.5 text-foreground">{activity.user}</td>
                    <td className="py-2.5 text-muted-foreground">{activity.action}</td>
                    <td className="py-2.5 font-mono text-xs text-foreground">{activity.target}</td>
                    <td className="py-2.5 text-muted-foreground">{activity.time}</td>
                    <td className="py-2.5">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        activity.status === "success" ? "bg-success/10 text-success" :
                        activity.status === "error" ? "bg-error/10 text-error" :
                        activity.status === "warning" ? "bg-warning/10 text-warning" : "bg-info/10 text-info"
                      }`}>
                        {activity.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
