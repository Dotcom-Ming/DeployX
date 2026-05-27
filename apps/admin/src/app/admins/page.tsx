"use client";

import { useEffect, useState } from "react";
import { getToken } from "@/lib/auth-context";

interface Admin {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
}

interface AdminsResponse {
  data: Admin[];
  meta: { page: number; pageSize: number; total: number; hasNextPage: boolean };
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3006/api";

export default function AdminsPage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ email: "", name: "", password: "", role: "admin" });
  const [submitting, setSubmitting] = useState(false);

  const authHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
  });

  const fetchAdmins = async (p: number) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: p.toString(), pageSize: "20" });
      const res = await fetch(`${API_URL}/admin/admins?${params}`, { headers: authHeaders() });
      if (res.ok) {
        const payload = await res.json();
        const d = payload?.data ?? payload;
        if (d?.data) {
          setAdmins(d.data);
          setTotal(d.meta.total);
          setHasNextPage(d.meta.hasNextPage);
        } else if (Array.isArray(d)) {
          setAdmins(d);
          setTotal(d.length);
          setHasNextPage(false);
        }
      } else {
        setError(`API错误：${res.status}`);
      }
    } catch {
      setError("无法连接到API服务器");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAdmins(page); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/admin/admins`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setShowCreate(false);
        setForm({ email: "", name: "", password: "", role: "admin" });
        fetchAdmins(1);
      } else {
        const payload = await res.json();
        setError(payload.message || "创建失败");
      }
    } catch {
      setError("无法连接到API服务器");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    setSubmitting(true);
    setError(null);
    try {
      const body: any = {};
      if (form.name) body.name = form.name;
      if (form.email) body.email = form.email;
      if (form.role) body.role = form.role;
      if (form.password) body.password = form.password;

      const res = await fetch(`${API_URL}/admin/admins/${editingId}`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setEditingId(null);
        setForm({ email: "", name: "", password: "", role: "admin" });
        fetchAdmins(page);
      } else {
        const payload = await res.json();
        setError(payload.message || "更新失败");
      }
    } catch {
      setError("无法连接到API服务器");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除此管理员吗？")) return;
    setError(null);
    try {
      const res = await fetch(`${API_URL}/admin/admins/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (res.ok) {
        fetchAdmins(page);
      } else {
        const payload = await res.json();
        setError(payload.message || "删除失败");
      }
    } catch {
      setError("无法连接到API服务器");
    }
  };

  const startEdit = (admin: Admin) => {
    setEditingId(admin.id);
    setForm({ email: admin.email, name: admin.name, password: "", role: admin.role });
    setShowCreate(false);
  };

  const roleLabel = (role: string) => {
    return role === "super_admin" ? "超级管理员" : "管理员";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">管理员管理</h1>
          <p className="text-sm text-muted-foreground">管理后台管理员账号</p>
        </div>
        <button
          onClick={() => { setShowCreate(!showCreate); setEditingId(null); setForm({ email: "", name: "", password: "", role: "admin" }); }}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          {showCreate ? "取消" : "添加管理员"}
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-error/30 bg-error/5 p-3 text-sm text-error">{error}</div>
      )}

      {(showCreate || editingId) && (
        <form onSubmit={editingId ? handleUpdate : handleCreate} className="rounded-lg border border-border bg-card p-4 space-y-4">
          <h3 className="text-sm font-semibold text-foreground">{editingId ? "编辑管理员" : "添加管理员"}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm text-muted-foreground">邮箱</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                required={!editingId}
                placeholder="admin@example.com"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm text-muted-foreground">姓名</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                required={!editingId}
                placeholder="管理员姓名"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm text-muted-foreground">密码{editingId && " (留空不修改)"}</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                required={!editingId}
                placeholder="至少8位密码"
                minLength={editingId ? 0 : 8}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm text-muted-foreground">角色</label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="admin">管理员</option>
                <option value="super_admin">超级管理员</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => { setShowCreate(false); setEditingId(null); }}
              className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {submitting ? "保存中..." : "保存"}
            </button>
          </div>
        </form>
      )}

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
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">姓名</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">邮箱</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">角色</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">创建时间</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {admins.length === 0 ? (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">暂无管理员</td></tr>
                  ) : (
                    admins.map((admin) => (
                      <tr key={admin.id} className="border-b border-border/50 last:border-0 hover:bg-muted/50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                              {admin.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-medium text-foreground">{admin.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{admin.email}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            admin.role === "super_admin" ? "bg-warning/10 text-warning" : "bg-info/10 text-info"
                          }`}>
                            {roleLabel(admin.role)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{admin.createdAt?.split("T")[0] || "—"}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => startEdit(admin)}
                              className="rounded px-2 py-1 text-xs font-medium text-info hover:bg-info/10"
                            >
                              编辑
                            </button>
                            <button
                              onClick={() => handleDelete(admin.id)}
                              className="rounded px-2 py-1 text-xs font-medium text-error hover:bg-error/10"
                            >
                              删除
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {admins.length > 0 && (
              <div className="flex items-center justify-between border-t border-border px-4 py-3">
                <p className="text-sm text-muted-foreground">
                  显示 {(page - 1) * 20 + 1}-{Math.min(page * 20, total)}，共 {total}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { setPage(Math.max(1, page - 1)); fetchAdmins(Math.max(1, page - 1)); }}
                    disabled={page === 1}
                    className="rounded px-3 py-1 text-sm font-medium border border-border disabled:opacity-50 hover:bg-muted"
                  >
                    上一页
                  </button>
                  <span className="text-sm text-muted-foreground">第 {page} 页</span>
                  <button
                    onClick={() => { setPage(page + 1); fetchAdmins(page + 1); }}
                    disabled={!hasNextPage}
                    className="rounded px-3 py-1 text-sm font-medium border border-border disabled:opacity-50 hover:bg-muted"
                  >
                    下一页
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
