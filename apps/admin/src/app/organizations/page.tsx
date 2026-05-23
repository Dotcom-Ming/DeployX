"use client";

import { useEffect, useState } from "react";

interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: string;
  members: number;
  projects: number;
  created: string;
}

interface OrgsResponse {
  data: Organization[];
  meta: { page: number; pageSize: number; total: number; hasNextPage: boolean };
}

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

const isOrgsResponse = (value: unknown): value is OrgsResponse => {
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

const planStyles: Record<string, string> = {
  HOBBY: "bg-muted text-muted-foreground",
  PRO: "bg-info/10 text-info",
  ENTERPRISE: "bg-warning/10 text-warning",
};

export default function OrganizationsPage() {
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const fetchOrgs = async () => {
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          pageSize: "20",
          search,
          plan: planFilter,
        });

        const res = await fetch(`${API_URL}/admin/organizations?${params}`);

        if (!cancelled) {
          if (res.ok) {
            const payload: unknown = await res.json();
            const normalized = unwrapApiData<OrgsResponse | Organization[]>(payload) ?? payload;

            if (isOrgsResponse(normalized)) {
              setOrgs(normalized.data);
              setTotal(normalized.meta.total);
              setHasNextPage(normalized.meta.hasNextPage);
              setError(null);
            } else if (Array.isArray(normalized)) {
              setOrgs(normalized as Organization[]);
              setTotal(normalized.length);
              setHasNextPage(false);
              setError(null);
            } else {
              setOrgs([]);
              setTotal(0);
              setHasNextPage(false);
              setError("Unexpected API response format for organizations");
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

    fetchOrgs();
    return () => { cancelled = true; };
  }, [page, search, planFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  if (error && orgs.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Organizations</h1>
          <p className="text-sm text-muted-foreground">Manage organizations on the platform</p>
        </div>
        <div className="rounded-lg border border-error/30 bg-error/5 p-6 text-center">
          <p className="text-error">{error}</p>
          <p className="mt-2 text-sm text-muted-foreground">Make sure the API server is running on {API_URL}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Organizations</h1>
        <p className="text-sm text-muted-foreground">Manage organizations on the platform</p>
      </div>

      <form onSubmit={handleSearch} className="flex items-center gap-3">
        <div className="flex-1">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search organizations..."
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <select
          value={planFilter}
          onChange={(e) => { setPlanFilter(e.target.value); setPage(1); }}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="all">All Plans</option>
          <option value="HOBBY">Hobby</option>
          <option value="PRO">Pro</option>
          <option value="ENTERPRISE">Enterprise</option>
        </select>
        <button type="submit" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          Search
        </button>
      </form>

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
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Slug</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Plan</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Members</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Projects</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Created</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orgs.length === 0 ? (
                    <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No organizations found</td></tr>
                  ) : (
                    orgs.map((org) => (
                      <tr key={org.id} className="border-b border-border/50 last:border-0 hover:bg-muted/50">
                        <td className="px-4 py-3 font-medium text-foreground">{org.name}</td>
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{org.slug}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${planStyles[org.plan]}`}>
                            {org.plan}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-foreground">{org.members}</td>
                        <td className="px-4 py-3 text-foreground">{org.projects}</td>
                        <td className="px-4 py-3 text-muted-foreground">{org.created}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button className="rounded px-2 py-1 text-xs font-medium text-info hover:bg-info/10">View</button>
                            <button className="rounded px-2 py-1 text-xs font-medium text-warning hover:bg-warning/10">Suspend</button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {orgs.length > 0 && (
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
