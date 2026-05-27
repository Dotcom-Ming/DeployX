"use client";

import { useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  Search,
  Download,
  Rocket,
  UserPlus,
  Settings,
  Globe,
  Key,
  Link,
  Shield,
} from "lucide-react";
import { EmptyState } from "@/components/custom/empty-state";

const actionIcons: Record<string, React.ElementType> = {
  deployment: Rocket,
  member: UserPlus,
  project: Settings,
  domain: Globe,
  token: Key,
  webhook: Link,
  env: Shield,
  org: Settings,
};

const actionLabels: Record<string, string> = {
  "deployment.created": "创建部署",
  "deployment.succeeded": "部署成功",
  "deployment.failed": "部署失败",
  "deployment.cancelled": "取消部署",
  "member.invited": "邀请成员",
  "member.removed": "移除成员",
  "member.role_changed": "变更角色",
  "project.created": "创建项目",
  "project.settings_updated": "更新项目设置",
  "project.deleted": "删除项目",
  "domain.added": "添加域名",
  "domain.removed": "移除域名",
  "domain.verified": "域名验证",
  "token.created": "创建令牌",
  "token.revoked": "撤销令牌",
  "webhook.created": "创建 Webhook",
  "webhook.deleted": "删除 Webhook",
  "env.updated": "更新环境变量",
  "org.settings_updated": "更新组织设置",
};

const actionColors: Record<string, string> = {
  "deployment.created": "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  "deployment.succeeded": "bg-green-500/10 text-green-600 dark:text-green-400",
  "deployment.failed": "bg-red-500/10 text-red-600 dark:text-red-400",
  "deployment.cancelled": "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400",
  "member.invited": "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  "member.removed": "bg-red-500/10 text-red-600 dark:text-red-400",
  "member.role_changed": "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  "project.created": "bg-green-500/10 text-green-600 dark:text-green-400",
  "project.settings_updated": "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  "project.deleted": "bg-red-500/10 text-red-600 dark:text-red-400",
  "domain.added": "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
  "domain.removed": "bg-red-500/10 text-red-600 dark:text-red-400",
  "domain.verified": "bg-green-500/10 text-green-600 dark:text-green-400",
  "token.created": "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
  "token.revoked": "bg-red-500/10 text-red-600 dark:text-red-400",
  "webhook.created": "bg-pink-500/10 text-pink-600 dark:text-pink-400",
  "webhook.deleted": "bg-red-500/10 text-red-600 dark:text-red-400",
  "env.updated": "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  "org.settings_updated": "bg-amber-500/10 text-amber-600 dark:text-amber-400",
};

const actionCategoryMap: Record<string, string> = {
  "deployment.created": "deployment",
  "deployment.succeeded": "deployment",
  "deployment.failed": "deployment",
  "deployment.cancelled": "deployment",
  "member.invited": "member",
  "member.removed": "member",
  "member.role_changed": "member",
  "project.created": "project",
  "project.settings_updated": "project",
  "project.deleted": "project",
  "domain.added": "domain",
  "domain.removed": "domain",
  "domain.verified": "domain",
  "token.created": "token",
  "token.revoked": "token",
  "webhook.created": "webhook",
  "webhook.deleted": "webhook",
  "env.updated": "env",
  "org.settings_updated": "org",
};

const resourceTypeLabels: Record<string, string> = {
  project: "项目",
  member: "成员",
  domain: "域名",
  token: "令牌",
  webhook: "Webhook",
  organization: "组织",
};

const mockAuditLogs = [
  { id: "al_1", timestamp: new Date("2024-12-01T10:30:00"), user: { name: "Alex Chen", avatar: "", fallback: "AC" }, action: "deployment.created", resource: "deployx-web", resourceType: "project", ipAddress: "192.168.1.100", details: "部署 commit a1b2c3d 到生产环境" },
  { id: "al_2", timestamp: new Date("2024-12-01T09:15:00"), user: { name: "Jane Doe", avatar: "", fallback: "JD" }, action: "member.invited", resource: "newdev@company.com", resourceType: "member", ipAddress: "10.0.0.42", details: "邀请为 MEMBER 角色" },
  { id: "al_3", timestamp: new Date("2024-11-30T16:45:00"), user: { name: "Alex Chen", avatar: "", fallback: "AC" }, action: "project.settings_updated", resource: "deployx-web", resourceType: "project", ipAddress: "192.168.1.100", details: "更新了构建命令" },
  { id: "al_4", timestamp: new Date("2024-11-30T14:00:00"), user: { name: "Maria Kim", avatar: "", fallback: "MK" }, action: "domain.added", resource: "api.deployx.dev", resourceType: "domain", ipAddress: "172.16.0.5", details: "向 deployx-web 添加域名" },
  { id: "al_5", timestamp: new Date("2024-11-30T11:30:00"), user: { name: "Raj Singh", avatar: "", fallback: "RS" }, action: "env.updated", resource: "deployx-api", resourceType: "project", ipAddress: "10.0.0.88", details: "更新了 3 个环境变量" },
  { id: "al_6", timestamp: new Date("2024-11-29T09:00:00"), user: { name: "Alex Chen", avatar: "", fallback: "AC" }, action: "org.settings_updated", resource: "DeployX", resourceType: "organization", ipAddress: "192.168.1.100", details: "更新了组织名称" },
  { id: "al_7", timestamp: new Date("2024-11-28T15:20:00"), user: { name: "Jane Doe", avatar: "", fallback: "JD" }, action: "webhook.created", resource: "deployx-web", resourceType: "project", ipAddress: "10.0.0.42", details: "创建部署事件 Webhook" },
  { id: "al_8", timestamp: new Date("2024-11-28T10:00:00"), user: { name: "Alex Chen", avatar: "", fallback: "AC" }, action: "token.created", resource: "CI/CD Token", resourceType: "token", ipAddress: "192.168.1.100", details: "创建具有部署权限的令牌" },
  { id: "al_9", timestamp: new Date("2024-11-27T16:00:00"), user: { name: "Maria Kim", avatar: "", fallback: "MK" }, action: "deployment.succeeded", resource: "docs-portal", resourceType: "project", ipAddress: "172.16.0.5", details: "生产部署成功" },
  { id: "al_10", timestamp: new Date("2024-11-27T14:30:00"), user: { name: "Raj Singh", avatar: "", fallback: "RS" }, action: "deployment.failed", resource: "marketing-site", resourceType: "project", ipAddress: "10.0.0.88", details: "构建阶段失败 - 构建命令退出码 1" },
  { id: "al_11", timestamp: new Date("2024-11-26T11:00:00"), user: { name: "Alex Chen", avatar: "", fallback: "AC" }, action: "member.role_changed", resource: "Maria Kim", resourceType: "member", ipAddress: "192.168.1.100", details: "角色从 VIEWER 变更为 DEVELOPER" },
  { id: "al_12", timestamp: new Date("2024-11-25T09:30:00"), user: { name: "Jane Doe", avatar: "", fallback: "JD" }, action: "domain.verified", resource: "docs.deployx.dev", resourceType: "domain", ipAddress: "10.0.0.42", details: "DNS 验证通过，SSL 证书已签发" },
];

function groupByDate(items: typeof mockAuditLogs): Map<string, typeof mockAuditLogs> {
  const groups = new Map<string, typeof mockAuditLogs>();
  for (const item of items) {
    const date = new Date(item.timestamp).toLocaleDateString(undefined, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    if (!groups.has(date)) groups.set(date, []);
    groups.get(date)!.push(item);
  }
  return groups;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

export default function AuditLogPage() {
  const { org: orgSlug = "" } = useParams<{ org: string }>();
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [resourceTypeFilter, setResourceTypeFilter] = useState<string>("all");

  const filteredLogs = useMemo(() => {
    let logs = [...mockAuditLogs];
    if (actionFilter !== "all") {
      logs = logs.filter((log) => log.action.startsWith(actionFilter));
    }
    if (resourceTypeFilter !== "all") {
      logs = logs.filter((log) => log.resourceType === resourceTypeFilter);
    }
    if (search) {
      const lower = search.toLowerCase();
      logs = logs.filter(
        (log) =>
          log.user.name.toLowerCase().includes(lower) ||
          log.action.toLowerCase().includes(lower) ||
          log.resource.toLowerCase().includes(lower) ||
          log.details.toLowerCase().includes(lower) ||
          log.ipAddress.includes(lower)
      );
    }
    return logs;
  }, [search, actionFilter, resourceTypeFilter]);

  const grouped = useMemo(() => groupByDate(filteredLogs), [filteredLogs]);

  const handleExport = () => {
    const header = "时间,用户,操作,资源,资源类型,IP 地址,详情\n";
    const rows = filteredLogs
      .map(
        (log) =>
          `${log.timestamp.toISOString()},${log.user.name},${actionLabels[log.action] || log.action},${log.resource},${resourceTypeLabels[log.resourceType] || log.resourceType},${log.ipAddress},${log.details}`
      )
      .join("\n");
    const blob = new Blob(["\uFEFF" + header + rows], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-log-${orgSlug}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (filteredLogs.length === 0 && !search && actionFilter === "all" && resourceTypeFilter === "all") {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">审计日志</h1>
          <p className="text-muted-foreground text-sm mt-1">
            查看组织内的操作记录
          </p>
        </div>
        <Card>
          <CardContent className="py-8">
            <EmptyState
              icon={FileText}
              title="暂无审计日志"
              description="在组织中执行的操作将显示在此处"
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">审计日志</h1>
          <p className="text-muted-foreground text-sm mt-1">
            查看组织内的操作记录
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="h-4 w-4 mr-1" />
          导出 CSV
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索用户、操作、资源..."
            className="pl-9"
          />
        </div>
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="操作类型" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部操作</SelectItem>
            <SelectItem value="deployment">部署</SelectItem>
            <SelectItem value="member">成员</SelectItem>
            <SelectItem value="project">项目</SelectItem>
            <SelectItem value="domain">域名</SelectItem>
            <SelectItem value="token">令牌</SelectItem>
            <SelectItem value="webhook">Webhook</SelectItem>
            <SelectItem value="env">环境变量</SelectItem>
            <SelectItem value="org">组织</SelectItem>
          </SelectContent>
        </Select>
        <Select value={resourceTypeFilter} onValueChange={setResourceTypeFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="资源类型" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部资源</SelectItem>
            <SelectItem value="project">项目</SelectItem>
            <SelectItem value="member">成员</SelectItem>
            <SelectItem value="domain">域名</SelectItem>
            <SelectItem value="token">令牌</SelectItem>
            <SelectItem value="webhook">Webhook</SelectItem>
            <SelectItem value="organization">组织</SelectItem>
          </SelectContent>
        </Select>
        {(search || actionFilter !== "all" || resourceTypeFilter !== "all") && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch("");
              setActionFilter("all");
              setResourceTypeFilter("all");
            }}
          >
            清除筛选
          </Button>
        )}
      </div>

      {filteredLogs.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <EmptyState
              icon={Search}
              title="未找到匹配的日志"
              description="尝试调整筛选条件"
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {Array.from(grouped.entries()).map(([date, items]) => (
            <motion.div
              key={date}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h3 className="text-sm font-medium text-muted-foreground mb-3 sticky top-0 bg-background py-1 z-10">
                {date}
              </h3>
              <Card>
                <CardContent className="p-0">
                  {items.map((log, idx) => {
                    const category = actionCategoryMap[log.action] || "project";
                    const Icon = actionIcons[category] || Settings;
                    const colorClass = actionColors[log.action] || "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400";
                    return (
                      <div
                        key={log.id}
                        className={`flex items-start gap-4 px-4 py-3 hover:bg-muted/50 transition-colors ${
                          idx < items.length - 1 ? "border-b border-border" : ""
                        }`}
                      >
                        <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full border border-border bg-muted shrink-0">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium">
                              {actionLabels[log.action] || log.action}
                            </span>
                            <Badge variant="outline" className={colorClass}>
                              {resourceTypeLabels[log.resourceType] || log.resourceType}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {log.details}
                          </p>
                          <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                            <span className="font-mono">{log.resource}</span>
                            <span>·</span>
                            <span>{log.ipAddress}</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-5 w-5">
                              <AvatarFallback className="text-[10px]">
                                {log.user.fallback}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-xs font-medium">{log.user.name}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {formatTime(new Date(log.timestamp))}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <div className="text-center text-xs text-muted-foreground py-4">
        共 {filteredLogs.length} 条审计日志
      </div>
    </div>
  );
}
