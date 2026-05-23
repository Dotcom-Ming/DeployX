"use client";

import { useEffect, useState } from "react";

interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  orgs: number;
  deploys: number;
  created: string;
  status: string;
}

interface UsersResponse {
  data: User[];
  meta: { page: number; pageSize: number; total: number; hasNextPage: boolean };
}

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

const isUsersResponse = (value: unknown): value is UsersResponse => {
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

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async (p: number, s: string, sf: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: p.toString(),
        pageSize: "20",
        search: s,
        status: sf,
      });

      const res = await fetch(`${API_URL}/admin/users?${params}`);

      if (res.ok) {
        const payload: unknown = await res.json();
        const normalized = unwrapApiData<UsersResponse | User[]>(payload) ?? payload;

        if (isUsersResponse(normalized)) {
          setUsers(normalized.data);
          setTotal(normalized.meta.total);
          setHasNextPage(normalized.meta.hasNextPage);
        } else if (Array.isArray(normalized)) {
          setUsers(normalized as User[]);
          setTotal(normalized.length);
          setHasNextPage(false);
        } else {
          setError("Unexpected API response format for users");
          setUsers([]);
          setTotal(0);
          setHasNextPage(false);
        }
      } else {
        setError(`API error: ${res.status}`);
        setUsers([]);
      }
    } catch {
      setError("Failed to connect to API");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(page, search, statusFilter);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers(1, search, statusFilter);
    setPage(1);
  };

  const handleSuspend = async (userId: string) => {
    setActionLoading(userId);
    try {
      await fetch(`${API_URL}/admin/users/${userId}/suspend`, { method: "POST" });
      fetchUsers(page, search, statusFilter);
    } catch {
      console.error("Failed to suspend user");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    setActionLoading(userId);
    try {
      await fetch(`${API_URL}/admin/users/${userId}`, { method: "DELETE" });
      fetchUsers(page, search, statusFilter);
    } catch {
      console.error("Failed to delete user");
    } finally {
      setActionLoading(null);
    }
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchUsers(newPage, search, statusFilter);
  };

  if (error && users.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Users</h1>
          <p className="text-sm text-muted-foreground">Manage platform users</p>
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Users</h1>
          <p className="text-sm text-muted-foreground">Manage platform users</p>
        </div>
        <p className="text-sm text-muted-foreground">{total} total users</p>
      </div>

      <form onSubmit={handleSearch} className="flex items-center gap-3">
        <div className="flex-1">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users by name or email..."
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
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
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">User</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Email</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Orgs</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Deployments</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Created</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No users found</td></tr>
                  ) : (
                    users.map((user) => (
                      <tr key={user.id} className="border-b border-border/50 last:border-0 hover:bg-muted/50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                              {user.avatar}
                            </div>
                            <span className="font-medium text-foreground">{user.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                        <td className="px-4 py-3 text-foreground">{user.orgs}</td>
                        <td className="px-4 py-3 text-foreground">{user.deploys}</td>
                        <td className="px-4 py-3 text-muted-foreground">{user.created}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-success/10 text-success">
                            {user.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button className="rounded px-2 py-1 text-xs font-medium text-info hover:bg-info/10">View</button>
                            <button
                              onClick={() => handleSuspend(user.id)}
                              disabled={actionLoading === user.id}
                              className="rounded px-2 py-1 text-xs font-medium text-warning hover:bg-warning/10 disabled:opacity-50"
                            >
                              {actionLoading === user.id ? "..." : "Suspend"}
                            </button>
                            <button
                              onClick={() => handleDelete(user.id)}
                              disabled={actionLoading === user.id}
                              className="rounded px-2 py-1 text-xs font-medium text-error hover:bg-error/10 disabled:opacity-50"
                            >
                              {actionLoading === user.id ? "..." : "Delete"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {users.length > 0 && (
              <div className="flex items-center justify-between border-t border-border px-4 py-3">
                <p className="text-sm text-muted-foreground">
                  Showing {(page - 1) * 20 + 1}-{Math.min(page * 20, total)} of {total}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="rounded px-3 py-1 text-sm font-medium border border-border disabled:opacity-50 hover:bg-muted"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-muted-foreground">Page {page}</span>
                  <button
                    onClick={() => handlePageChange(page + 1)}
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
