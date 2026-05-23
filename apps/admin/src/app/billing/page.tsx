"use client";

import { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3006/api";

interface BillingData {
  stats: {
    mrr: string;
    totalRevenue: string;
    activeSubscriptions: number;
    churnRate: string;
  };
  revenueByMonth: { month: string; value: number }[];
  planDistribution: { plan: string; count: number; percentage: number }[];
  topOrgs: { name: string; plan: string; spend: string }[];
}

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

const isBillingData = (value: unknown): value is BillingData => {
  if (!value || typeof value !== "object") return false;
  const maybe = value as { stats?: unknown; revenueByMonth?: unknown; planDistribution?: unknown; topOrgs?: unknown };
  return (
    !!maybe.stats &&
    typeof maybe.stats === "object" &&
    Array.isArray(maybe.revenueByMonth) &&
    Array.isArray(maybe.planDistribution) &&
    Array.isArray(maybe.topOrgs)
  );
};

const unwrapApiData = <T,>(value: unknown): T | null => {
  if (!value || typeof value !== "object") return null;
  const maybe = value as Partial<ApiEnvelope<T>>;
  return maybe.data === undefined ? null : maybe.data;
};

const planStyles: Record<string, string> = {
  HOBBY: "bg-muted text-muted-foreground",
  PRO: "bg-info/10 text-info",
  ENTERPRISE: "bg-warning/10 text-warning",
};

export default function BillingPage() {
  const [data, setData] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchBilling = async () => {
      try {
        const token = localStorage.getItem("admin_token");
        const res = await fetch(`${API_URL}/admin/billing`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (!cancelled) {
          if (res.ok) {
            const payload: unknown = await res.json();
            const normalized = unwrapApiData<BillingData>(payload) ?? payload;
            setData(isBillingData(normalized) ? normalized : null);
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

    fetchBilling();
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
          <h1 className="text-2xl font-bold text-foreground">Billing</h1>
          <p className="text-sm text-muted-foreground">Revenue overview and subscription metrics</p>
        </div>
        <div className="rounded-lg border border-error/30 bg-error/5 p-6 text-center">
          <p className="text-error">{error}</p>
          <p className="mt-2 text-sm text-muted-foreground">Make sure the API server is running on {API_URL}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const billingStats = [
    { label: "MRR", value: data.stats.mrr, change: "Monthly recurring revenue" },
    { label: "Total Revenue", value: data.stats.totalRevenue, change: "Lifetime" },
    { label: "Active Subscriptions", value: data.stats.activeSubscriptions.toLocaleString(), change: "Current active" },
    { label: "Churn Rate", value: data.stats.churnRate, change: "Monthly churn" },
  ];

  const maxRevenue = Math.max(...data.revenueByMonth.map((d) => d.value), 1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Billing</h1>
        <p className="text-sm text-muted-foreground">Revenue overview and subscription metrics</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {billingStats.map((stat) => (
          <div key={stat.label} className="rounded-lg border border-border bg-card p-4">
            <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
            <p className="mt-1 text-2xl font-bold text-foreground">{stat.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{stat.change}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Revenue Chart */}
        <div className="rounded-lg border border-border bg-card p-4">
          <h2 className="text-sm font-semibold text-foreground mb-4">Revenue Trend</h2>
          <div className="flex items-end gap-3 h-48">
            {data.revenueByMonth.map((d) => (
              <div key={d.month} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs text-muted-foreground">
                  ${(d.value / 1000).toFixed(1)}k
                </span>
                <div
                  className="w-full bg-primary/20 rounded-t-sm"
                  style={{ height: `${(d.value / maxRevenue) * 100}%`, minHeight: "4px" }}
                />
                <span className="text-xs text-muted-foreground">{d.month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Plan Distribution */}
        <div className="rounded-lg border border-border bg-card p-4">
          <h2 className="text-sm font-semibold text-foreground mb-4">Plan Distribution</h2>
          <div className="space-y-4">
            {data.planDistribution.map((plan) => (
              <div key={plan.plan} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground">{plan.plan}</span>
                  <span className="text-muted-foreground">
                    {plan.count} ({plan.percentage}%)
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted">
                  <div
                    className={`h-2 rounded-full ${
                      plan.plan === "Hobby" ? "bg-muted" : plan.plan === "Pro" ? "bg-info" : "bg-warning"
                    }`}
                    style={{ width: `${plan.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Organizations by Spend */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h2 className="text-sm font-semibold text-foreground mb-4">Top Organizations by Spend</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="pb-2 text-left font-medium text-muted-foreground">Organization</th>
                <th className="pb-2 text-left font-medium text-muted-foreground">Plan</th>
                <th className="pb-2 text-right font-medium text-muted-foreground">Monthly Spend</th>
              </tr>
            </thead>
            <tbody>
              {data.topOrgs.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-4 text-center text-muted-foreground">
                    No organizations with subscriptions
                  </td>
                </tr>
              ) : (
                data.topOrgs.map((org) => (
                  <tr key={org.name} className="border-b border-border/50 last:border-0">
                    <td className="py-2.5 font-medium text-foreground">{org.name}</td>
                    <td className="py-2.5">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          planStyles[org.plan]
                        }`}
                      >
                        {org.plan}
                      </span>
                    </td>
                    <td className="py-2.5 text-right font-mono text-foreground">{org.spend}</td>
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
