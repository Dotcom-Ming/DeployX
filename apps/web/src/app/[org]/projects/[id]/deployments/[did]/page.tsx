"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  Copy, ExternalLink, RotateCcw, ArrowLeftRight, XCircle,
  GitBranch, User, Clock, Server, Globe, Search,
  Eye, Wrench, Terminal,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar } from "@/components/custom/avatar";
import { TerminalLogs } from "@/components/custom/terminal-logs";
import { getDeployment, getDeploymentLogs } from "@/lib/api";
import { DeploymentStatus, DeploymentType, BuildStage } from "@deployx/shared";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

const statusIconMap: Record<string, { icon: typeof CheckCircleIcon; color: string }> = {
  [DeploymentStatus.READY]: { icon: CheckCircleIcon, color: "text-green-500" },
  [DeploymentStatus.ERROR]: { icon: XCircleIcon, color: "text-red-500" },
  [DeploymentStatus.BUILDING]: { icon: BuildingIcon, color: "text-yellow-500" },
  [DeploymentStatus.QUEUED]: { icon: ClockIcon, color: "text-blue-500" },
};

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}
function XCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  );
}
function BuildingIcon({ className }: { className?: string }) {
  return <Clock className={className} />;
}
function ClockIcon({ className }: { className?: string }) {
  return <Clock className={className} />;
}

export default function DeploymentDetailPage() {
  const params = useParams<{ org: string; id: string; did: string }>();
  const orgSlug = params.org;
  const projectId = params.id;
  const deploymentId = params.did;
  const [activeTab, setActiveTab] = useState("build-logs");

  const { data: deployment, isLoading } = useQuery({
    queryKey: ["deployment", orgSlug, projectId, deploymentId],
    queryFn: () => getDeployment(orgSlug, projectId, deploymentId),
  });

  const { data: logs } = useQuery({
    queryKey: ["deployment-logs", orgSlug, projectId, deploymentId],
    queryFn: () => getDeploymentLogs(orgSlug, projectId, deploymentId),
    enabled: !!deployment,
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("已复制到剪贴板");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">加载部署详情...</p>
      </div>
    );
  }

  if (!deployment) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">未找到部署</p>
      </div>
    );
  }

  const StatusIcon = statusIconMap[deployment.status]?.icon || CheckCircleIcon;
  const statusColor = statusIconMap[deployment.status]?.color || "text-muted-foreground";

  const buildLogs = (logs || []).map((log: any, i: number) => ({
    id: `bl_${i}`,
    timestamp: log.timestamp || "",
    level: log.level || "info",
    message: log.message || "",
    group: log.group || "Build",
  }));

  return (
    <div className="flex min-h-[calc(100vh-80px)]">
      {/* Left sidebar */}
      <div className="w-80 shrink-0 border-r p-6 space-y-6 overflow-auto">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          {/* Status icon */}
          <div className="text-center mb-6">
            <StatusIcon className={`h-16 w-16 mx-auto ${statusColor}`} />
            <Badge variant={deployment.status === DeploymentStatus.READY ? "success" : "destructive"} className="mt-3 capitalize">
              {deployment.status.toLowerCase()}
            </Badge>
          </div>

          {/* Source info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">来源</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <GitBranch className="h-4 w-4 text-muted-foreground" />
                <span className="font-mono">{deployment.branch || "main"}</span>
              </div>
              {deployment.commitSha && (
                <div className="flex items-center gap-2">
                  <span className="font-mono text-muted-foreground">{deployment.commitSha.slice(0, 7)}</span>
                  <button onClick={() => copyToClipboard(deployment.commitSha)}>
                    <Copy className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                  </button>
                </div>
              )}
              {deployment.commitMessage && (
                <p className="text-xs text-muted-foreground">{deployment.commitMessage}</p>
              )}
            </CardContent>
          </Card>

          {/* Build info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">构建信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">开始时间</span>
                <span>{new Date(deployment.createdAt).toLocaleTimeString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">完成时间</span>
                <span>{deployment.status === DeploymentStatus.READY ? "—" : "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">时长</span>
                <span>{deployment.buildDuration ? `${Math.floor(deployment.buildDuration / 1000)}s` : "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">构建器</span>
                <span className="font-mono text-xs">DeployX v2</span>
              </div>
            </CardContent>
          </Card>

          {/* Domains */}
          {deployment.url && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">域名</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm font-mono">
                  <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="truncate">{deployment.url.replace("https://", "")}</span>
                  <button onClick={() => copyToClipboard(deployment.url || "")} className="shrink-0">
                    <Copy className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                  </button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action buttons */}
          <div className="space-y-2">
            {deployment.url && (
              <Button variant="outline" className="w-full justify-start" onClick={() => window.open(deployment.url, "_blank")}>
                <ExternalLink className="h-4 w-4 mr-2" /> 访问
              </Button>
            )}
            <Button variant="outline" className="w-full justify-start">
              <Eye className="h-4 w-4 mr-2" /> 检查
            </Button>
            <Button variant="outline" className="w-full justify-start" onClick={() => toast.info("正在重新部署...")}>
              <RotateCcw className="h-4 w-4 mr-2" /> 重新部署
            </Button>
            <Button variant="outline" className="w-full justify-start" onClick={() => toast.info("正在回滚...")}>
              <ArrowLeftRight className="h-4 w-4 mr-2" /> 回滚
            </Button>
            <Button variant="outline" className="w-full justify-start text-destructive hover:text-destructive">
              <XCircle className="h-4 w-4 mr-2" /> 取消
            </Button>
          </div>
        </motion.div>
      </div>

      {/* Right main area */}
      <div className="flex-1 p-6 space-y-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="build-logs">
              <Terminal className="h-4 w-4 mr-2" /> 构建日志
            </TabsTrigger>
            <TabsTrigger value="runtime-logs">
              <Terminal className="h-4 w-4 mr-2" /> 运行时日志
            </TabsTrigger>
            <TabsTrigger value="source">
              <GitBranch className="h-4 w-4 mr-2" /> 来源
            </TabsTrigger>
            <TabsTrigger value="functions">
              <Wrench className="h-4 w-4 mr-2" /> 函数
            </TabsTrigger>
          </TabsList>

          <TabsContent value="build-logs" className="mt-4">
            <TerminalLogs logs={buildLogs} searchable showControls autoScroll className="h-[600px]" />
          </TabsContent>

          <TabsContent value="runtime-logs" className="mt-4">
            <TerminalLogs logs={[]} searchable showControls autoScroll className="h-[600px]" />
          </TabsContent>

          <TabsContent value="source" className="mt-4">
            <Card>
              <CardContent className="p-6 space-y-4">
                <div>
                  <h3 className="font-medium mb-2">提交</h3>
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-medium">{deployment.commitMessage || "无提交信息"}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>部署于 {new Date(deployment.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  {deployment.commitSha && (
                    <div className="flex items-center gap-2 mt-2 text-sm font-mono">
                      <span className="text-muted-foreground">SHA:</span>
                      <span>{deployment.commitSha}</span>
                      <button onClick={() => copyToClipboard(deployment.commitSha)}>
                        <Copy className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                      </button>
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-medium mb-2">分支</h3>
                  <div className="flex items-center gap-2">
                    <GitBranch className="h-4 w-4 text-muted-foreground" />
                    <span className="font-mono">{deployment.branch || "main"}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="functions" className="mt-4">
            <Card>
              <CardContent className="p-12 text-center">
                <Wrench className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-1">无 Serverless 函数</h3>
                <p className="text-sm text-muted-foreground">此项目未配置任何 Serverless 函数。</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
