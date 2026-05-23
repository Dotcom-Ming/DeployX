"use client";

import { useEffect, useState, useCallback } from "react";

interface Deployment {
  id: string;
  status: string;
  project: string;
  org: string;
  branch: string;
  commit: string;
  duration: string;
  created: string;
}

interface DeploymentsResponse {
  data: Deployment[];
  meta: { page: number; pageSize: number; total: number; hasNextPage: boolean };
}

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

const isDeploymentsResponse = (value: unknown): value is DeploymentsResponse => {
  if (!value || typeof value !== "object") return false;
  const maybe = value as { data?: unknown };
  return Array.isArray(maybe.data);
};

const unwrapApiData = <T,>(value: unknown): T | null => {
  if (!value || typeof value !== "object") return null;
  const maybe = value as Partial<ApiEnvelope<T>>;
  return maybe.data === undefined ? null : maybe.data;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3006/api";

const statusStyles: Record<string, string> = {
  READY: "bg-success/10 text-success",
  BUILDING: "bg-info/10 text-info",
  ERROR: "bg-error/10 text-error",
  CANCELLED: "bg-muted text-muted-foreground",
  QUEUED: "bg-warning/10 text-warning",
  PENDING: "bg-muted text-muted-foreground",
};

export default function DeploymentsPage() {
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDeployments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("admin_token");
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: "20",
        status: statusFilter,
      });

      const res = await fetch(`${API_URL}/admin/deployments?${params}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.ok) {
        const payload: unknown = await res.json();
        const normalized = unwrapApiData<DeploymentsResponse | Deployment[]>(payload) ?? payload;
        const list = isDeploymentsResponse(normalized)
          ? normalized.data
          : Array.isArray(normalized)
            ? (normalized as Deployment[])
            : [];

        const filtered = list.filter(
          (d) =>
            !search ||
            d.project.toLowerCase().includes(search.toLowerCase()) ||
            d.org.toLowerCase().includes(search.toLowerCase()) ||
            d.commit.toLowerCase().includes(search.toLowerCase())
        );
        setDeployments(filtered);
        if (isDeploymentsResponse(normalized)) {
          setTotal(normalized.meta.total);
          setHasNextPage(normalized.meta.hasNextPage);
        } else {
          setTotal(list.length);
          setHasNextPage(false);
        }
      } else {
        setError(`API error: ${res.status}`);
        setDeployments([]);
      }
    } catch {
      setError("Failed to connect to API");
      setDeployments([]);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search]);

  useEffect(() => {
    fetchDeployments();
  }, [fetchDeployments]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchDeployments();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Deployments</h1>
        <p className="text-sm text-muted-foreground">View all deployments across the platform</p>
      </div>

      {/* Filters */}
      <form onSubmit={handleSearch} className="flex items-center gap-3 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search deployments..."
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="all">All Status</option>
          <option value="READY">Ready</option>
          <option value="BUILDING">Building</option>
          <option value="ERROR">Error</option>
          <option value="CANCELLED">Cancelled</option>
          <option value="QUEUED">Queued</option>
        </select>
        <button
          type="submit"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Search
        </button>
      </form>

      {error && (
        <div className="rounded-lg border border-error/30 bg-error/5 p-6 text-center">
          <p className="text-error">{error}</p>
          <p className="mt-2 text-sm text-muted-foreground">Make sure the API server is running on {API_URL}</p>
        </div>
      )}

      {/* Deployments Table */}
      <div className="rounded-lg border border-border bg-card">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Project</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Org</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Branch</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Commit</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Duration</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {deployments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                        No deployments found
                      </td>
                    </tr>
                  ) : (
                    deployments.map((dep) => (
                      <tr key={dep.id} className="border-b border-border/50 last:border-0 hover:bg-muted/50">
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                              statusStyles[dep.status]
                            }`}
                          >
                            {dep.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium text-foreground">{dep.project}</td>
                        <td className="px-4 py-3 text-muted-foreground">{dep.org}</td>
                        <td className="px-4 py-3 font-mono text-xs text-foreground">{dep.branch}</td>
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{dep.commit}</td>
                        <td className="px-4 py-3 text-muted-foreground">{dep.duration}</td>
                        <td className="px-4 py-3 text-muted-foreground">{dep.created}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {deployments.length > 0 && (
              <div className="flex items-center justify-between border-t border-border px-4 py-3">
                <p className="text-sm text-muted-foreground">
                  Showing {(page - 1) * 20 + 1}-{Math.min(page * 20, total)} of {total}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="rounded px-3 py-1 text-sm font-medium border border-border disabled:opacity-50 hover:bg-muted"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-muted-foreground">Page {page}</span>
                  <button
                    onClick={() => setPage((p) => p + 1)}
                    disabled={!hasNextPage}
                    className="rounded px-3 py-1 text-sm font-medium border border-border disabled:opacity-50 hover:bg-muted"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
