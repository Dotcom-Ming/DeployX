"use client";

import { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { GitBranch, Copy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/custom/avatar";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { getDeployments } from "@/lib/api";
import { DeploymentStatus, DeploymentType } from "@deployx/shared";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  [DeploymentStatus.READY]: "bg-green-500",
  [DeploymentStatus.BUILDING]: "bg-yellow-500 animate-pulse",
  [DeploymentStatus.ERROR]: "bg-red-500",
  [DeploymentStatus.QUEUED]: "bg-blue-500",
  [DeploymentStatus.PENDING]: "bg-gray-500",
  [DeploymentStatus.CANCELLED]: "bg-gray-400",
};

const statusBadgeVariant: Record<string, "success" | "destructive" | "secondary" | "outline" | "warning"> = {
  [DeploymentStatus.READY]: "success",
  [DeploymentStatus.BUILDING]: "warning",
  [DeploymentStatus.ERROR]: "destructive",
  [DeploymentStatus.QUEUED]: "secondary",
  [DeploymentStatus.PENDING]: "outline",
  [DeploymentStatus.CANCELLED]: "secondary",
};

export default function DeploymentsPage() {
  const params = useParams<{ org: string; id: string }>();
  const orgSlug = params.org;
  const projectId = params.id;
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [branchFilter, setBranchFilter] = useState<string>("all");
  const [envFilter, setEnvFilter] = useState<string>("all");

  const { data: deploymentsData, isLoading } = useQuery({
    queryKey: ["deployments", orgSlug, projectId],
    queryFn: () => getDeployments(orgSlug, projectId),
  });

  const deployments = deploymentsData?.data || [];

  const filtered = useMemo(() => {
    return deployments.filter((d: any) => {
      const matchesStatus = statusFilter === "all" || d.status === statusFilter;
      const matchesBranch = branchFilter === "all" || d.branch === branchFilter;
      const matchesEnv = envFilter === "all" || d.type === envFilter;
      return matchesStatus && matchesBranch && matchesEnv;
    });
  }, [deployments, statusFilter, branchFilter, envFilter]);

  const branches = [...new Set(deployments.map((d: any) => d.branch).filter(Boolean))];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">加载部署列表...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 lg:p-8 max-w-7xl">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold">部署</h1>
      </motion.div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            {Object.values(DeploymentStatus).map((s) => (
              <SelectItem key={s} value={s} className="capitalize">{s.toLowerCase()}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={branchFilter} onValueChange={setBranchFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="分支" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部分支</SelectItem>
            {branches.map((b: string) => (
              <SelectItem key={b} value={b}>{b}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={envFilter} onValueChange={setEnvFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="环境" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部环境</SelectItem>
            <SelectItem value={DeploymentType.PRODUCTION}>生产环境</SelectItem>
            <SelectItem value={DeploymentType.PREVIEW}>预览环境</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Deployments table */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-left p-4 font-medium">状态</th>
                    <th className="text-left p-4 font-medium">环境</th>
                    <th className="text-left p-4 font-medium">来源</th>
                    <th className="text-left p-4 font-medium">时长</th>
                    <th className="text-left p-4 font-medium">创建时间</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((dep: any) => (
                    <tr
                      key={dep.id}
                      className="border-b last:border-0 hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => window.location.href = `/${params.org}/projects/${params.id}/deployments/${dep.id}`}
                    >
                      <td className="p-4">
                        <Badge variant={statusBadgeVariant[dep.status] || "outline"} className="capitalize">
                          {dep.status.toLowerCase()}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <Badge variant={dep.type === DeploymentType.PRODUCTION ? "default" : "secondary"}>
                          {dep.type === DeploymentType.PRODUCTION ? "生产环境" : "预览环境"}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <GitBranch className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="font-mono text-xs">{dep.branch || "main"}</span>
                          </div>
                          {dep.commitSha && (
                            <div className="flex items-center gap-1">
                              <span className="font-mono text-xs text-muted-foreground">{dep.commitSha.slice(0, 7)}</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigator.clipboard.writeText(dep.commitSha);
                                  toast.success("已复制提交 SHA");
                                }}
                              >
                                <Copy className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                              </button>
                              {dep.commitMessage && (
                                <span className="text-xs text-muted-foreground ml-1 truncate max-w-[200px]">{dep.commitMessage}</span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-xs text-muted-foreground">
                        {dep.buildDuration ? `${Math.floor(dep.buildDuration / 1000)}s` : "—"}
                      </td>
                      <td className="p-4 text-xs text-muted-foreground">
                        {new Date(dep.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-muted-foreground">
                        未找到部署
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
