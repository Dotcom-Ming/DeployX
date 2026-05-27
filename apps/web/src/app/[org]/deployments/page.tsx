"use client";

import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { GitBranch, Copy, FolderKanban, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { getProjects, getDeployments } from "@/lib/api";
import { DeploymentStatus, DeploymentType } from "@deployx/shared";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { EmptyState } from "@/components/custom/empty-state";
import { Rocket } from "lucide-react";

const statusBadgeVariant: Record<string, "success" | "destructive" | "secondary" | "outline" | "warning"> = {
  [DeploymentStatus.READY]: "success",
  [DeploymentStatus.BUILDING]: "warning",
  [DeploymentStatus.ERROR]: "destructive",
  [DeploymentStatus.QUEUED]: "secondary",
  [DeploymentStatus.PENDING]: "outline",
  [DeploymentStatus.CANCELLED]: "secondary",
};

export default function OrgDeploymentsPage() {
  const { org: orgSlug = '' } = useParams<{ org: string }>();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [envFilter, setEnvFilter] = useState<string>("all");

  const { data: projectsData, isLoading: projectsLoading } = useQuery({
    queryKey: ["projects", orgSlug],
    queryFn: () => getProjects(orgSlug),
  });

  const projects = projectsData?.data || [];

  const { data: deploymentsMap, isLoading: deploymentsLoading } = useQuery({
    queryKey: ["org-deployments", orgSlug],
    queryFn: async () => {
      const map: Record<string, any[]> = {};
      for (const p of projects) {
        try {
          const res = await getDeployments(orgSlug, p.id);
          map[p.id] = res.data || [];
        } catch {
          map[p.id] = [];
        }
      }
      return map;
    },
    enabled: !!projects.length,
  });

  const deployments = useMemo(() => {
    if (!deploymentsMap) return [];
    const all: any[] = [];
    for (const [projectId, deps] of Object.entries(deploymentsMap)) {
      const project = projects.find((p: any) => p.id === projectId);
      for (const dep of deps) {
        all.push({ ...dep, projectName: project?.name || projectId, projectSlug: project?.slug || projectId });
      }
    }
    all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return all;
  }, [deploymentsMap, projects]);

  const filtered = useMemo(() => {
    return deployments.filter((d: any) => {
      const matchesStatus = statusFilter === "all" || d.status === statusFilter;
      const matchesProject = projectFilter === "all" || d.projectId === projectFilter || d.projectName === projectFilter;
      const matchesEnv = envFilter === "all" || d.type === envFilter;
      return matchesStatus && matchesProject && matchesEnv;
    });
  }, [deployments, statusFilter, projectFilter, envFilter]);

  const isLoading = projectsLoading || deploymentsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-semibold">部署</h1>
        <p className="text-muted-foreground text-sm mt-1">
          组织中所有部署
        </p>
      </motion.div>

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
        <Select value={projectFilter} onValueChange={setProjectFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="项目" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部项目</SelectItem>
            {projects.map((p: any) => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
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

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
        {filtered.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <EmptyState
                icon={Rocket}
                title="未找到部署"
                description={deployments.length === 0 ? "部署您的第一个项目以在此查看部署" : "请尝试调整筛选条件"}
              />
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-muted-foreground">
                      <th className="text-left p-4 font-medium">状态</th>
                      <th className="text-left p-4 font-medium">项目</th>
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
                        onClick={() => navigate(`/${orgSlug}/projects/${dep.projectId}/deployments/${dep.id}`)}
                      >
                        <td className="p-4">
                          <Badge variant={statusBadgeVariant[dep.status] || "outline"} className="capitalize">
                            {dep.status.toLowerCase()}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1.5">
                            <FolderKanban className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>{dep.projectName}</span>
                          </div>
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
                          {dep.buildDuration ? `${Math.floor(dep.buildDuration / 1000)}s` : "\u2014"}
                        </td>
                        <td className="p-4 text-xs text-muted-foreground">
                          {new Date(dep.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </motion.div>
    </div>
  );
}
