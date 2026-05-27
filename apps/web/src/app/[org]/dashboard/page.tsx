"use client";

import { useState } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FolderKanban, Rocket, Wifi, Clock, TrendingUp, TrendingDown,
  ArrowUpRight, RotateCcw, FileText, ExternalLink,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar } from "@/components/custom/avatar";
import { getProjects, getDeployments, getOrganization } from "@/lib/api";
import { DeploymentStatus, Plan, PLAN_DISPLAY_NAMES } from "@deployx/shared";
import { useQuery } from "@tanstack/react-query";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";

const statusColors: Record<string, string> = {
  [DeploymentStatus.READY]: "bg-green-500",
  [DeploymentStatus.BUILDING]: "bg-yellow-500",
  [DeploymentStatus.ERROR]: "bg-red-500",
  [DeploymentStatus.QUEUED]: "bg-blue-500",
  [DeploymentStatus.PENDING]: "bg-gray-500",
  [DeploymentStatus.CANCELLED]: "bg-gray-400",
};

const fadeIn = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
};

const usageChartData: Record<string, { date: string; bandwidth: number; requests: number }[]> = {
  "7d": [
    { date: "Nov 25", bandwidth: 52, requests: 12400 },
    { date: "Nov 26", bandwidth: 68, requests: 15200 },
    { date: "Nov 27", bandwidth: 45, requests: 11800 },
    { date: "Nov 28", bandwidth: 72, requests: 16800 },
    { date: "Nov 29", bandwidth: 81, requests: 18400 },
    { date: "Nov 30", bandwidth: 95, requests: 21200 },
    { date: "Dec 01", bandwidth: 88, requests: 19600 },
  ],
  "30d": [
    { date: "Nov 02", bandwidth: 42, requests: 9800 },
    { date: "Nov 05", bandwidth: 55, requests: 12400 },
    { date: "Nov 08", bandwidth: 48, requests: 11200 },
    { date: "Nov 11", bandwidth: 61, requests: 14600 },
    { date: "Nov 14", bandwidth: 58, requests: 13800 },
    { date: "Nov 17", bandwidth: 70, requests: 16200 },
    { date: "Nov 20", bandwidth: 75, requests: 17800 },
    { date: "Nov 23", bandwidth: 68, requests: 15600 },
    { date: "Nov 26", bandwidth: 82, requests: 18900 },
    { date: "Nov 29", bandwidth: 90, requests: 20100 },
    { date: "Dec 01", bandwidth: 88, requests: 19600 },
  ],
};

export default function DashboardPage() {
  const { org: orgSlug = '' } = useParams<{ org: string }>();
  const [chartRange, setChartRange] = useState<"7d" | "30d">("7d");
  const chartData = usageChartData[chartRange];

  const { data: org, isLoading: orgLoading } = useQuery({
    queryKey: ["org", orgSlug],
    queryFn: () => getOrganization(orgSlug),
  });

  const { data: projectsData, isLoading: projectsLoading } = useQuery({
    queryKey: ["projects", orgSlug],
    queryFn: () => getProjects(orgSlug),
  });

  const { data: deploymentsData, isLoading: deploymentsLoading } = useQuery({
    queryKey: ["deployments", orgSlug],
    queryFn: async () => {
      if (!projectsData?.data) return { data: [] };
      const all: any[] = [];
      for (const p of projectsData.data.slice(0, 3)) {
        try {
          const res = await getDeployments(orgSlug, p.id);
          all.push(...res.data);
        } catch {
          // skip
        }
      }
      return { data: all };
    },
    enabled: !!projectsData?.data,
  });

  const projects = projectsData?.data || [];
  const deployments = deploymentsData?.data || [];
  const loading = orgLoading || projectsLoading || deploymentsLoading;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">加载中...</p>
      </div>
    );
  }

  const statCards = [
    { title: "总项目数", value: String(projects.length), trend: "+2", trendUp: true, icon: FolderKanban },
    { title: "部署（7天）", value: String(deployments.length), trend: "+8", trendUp: true, icon: Rocket },
    {
      title: "已用带宽",
      value: "456 GB",
      trend: "+12%",
      trendUp: false,
      icon: Wifi,
      progress: 45.6,
    },
    {
      title: "已用构建时长",
      value: "15,200 分钟",
      trend: "+5%",
      trendUp: false,
      icon: Clock,
      progress: 63.3,
    },
  ];

  return (
    <div className="space-y-8 p-6 lg:p-8 max-w-7xl">
      {/* Welcome Section */}
      <motion.div {...fadeIn} transition={{ duration: 0.3 }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">欢迎回来</h1>
            <div className="flex items-center gap-2 mt-1 text-muted-foreground">
              <span>{org?.name || orgSlug}</span>
              <Badge variant="secondary">{PLAN_DISPLAY_NAMES[org?.plan ? Plan[org.plan as keyof typeof Plan] : Plan.PRO]}</Badge>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stat Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="flex items-center gap-1 mt-1">
                  {stat.trendUp ? (
                    <TrendingUp className="h-3 w-3 text-green-500" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-yellow-500" />
                  )}
                  <span className={`text-xs ${stat.trendUp ? "text-green-500" : "text-yellow-500"}`}>
                    {stat.trend}
                  </span>
                  <span className="text-xs text-muted-foreground">较上期</span>
                </div>
                {stat.progress !== undefined && (
                  <Progress value={stat.progress} className="mt-3 h-2" />
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Recent Deployments */}
      <motion.div {...fadeIn} transition={{ duration: 0.3, delay: 0.2 }}>
        <Card>
          <CardHeader>
            <CardTitle>最近部署</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-left pb-3 font-medium">状态</th>
                    <th className="text-left pb-3 font-medium">项目</th>
                    <th className="text-left pb-3 font-medium">提交</th>
                    <th className="text-left pb-3 font-medium">分支</th>
                    <th className="text-left pb-3 font-medium">时长</th>
                    <th className="text-left pb-3 font-medium">时间</th>
                  </tr>
                </thead>
                <tbody>
                  {deployments.slice(0, 8).map((dep) => {
                    const project = projects.find((p: any) => p.id === dep.projectId);
                    return (
                      <tr key={dep.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-2">
                            <div className={`h-2.5 w-2.5 rounded-full ${statusColors[dep.status]}`} />
                            <span className="capitalize text-xs">{dep.status.toLowerCase()}</span>
                          </div>
                        </td>
                        <td className="py-3 pr-4 font-medium">{project?.name || dep.projectId}</td>
                        <td className="py-3 pr-4">
                          <span className="font-mono text-xs text-muted-foreground">
                            {dep.commitMessage}
                          </span>
                        </td>
                        <td className="py-3 pr-4">
                          <Badge variant="outline" className="font-mono text-xs">
                            {dep.branch}
                          </Badge>
                        </td>
                        <td className="py-3 pr-4 text-xs text-muted-foreground">
                          {dep.buildDuration ? `${Math.floor(dep.buildDuration / 1000)}s` : "—"}
                        </td>
                        <td className="py-3 text-xs text-muted-foreground">
                          {new Date(dep.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    );
                  })}
                  {deployments.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-muted-foreground">
                        暂无部署
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Access Projects */}
      <motion.div {...fadeIn} transition={{ duration: 0.3, delay: 0.3 }}>
        <h2 className="text-lg font-semibold mb-4">快捷访问</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.slice(0, 6).map((project: any, i: number) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 + i * 0.05 }}
            >
              <Card className="group relative overflow-hidden hover:border-primary/50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded bg-muted flex items-center justify-center text-xs font-bold">
                        {(project.framework || "NA").slice(0, 2)}
                      </div>
                      <div>
                        <div className="font-medium">{project.name}</div>
                        <div className="text-xs text-muted-foreground font-mono">
                          {project.slug}
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Hover actions */}
                  <div className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform bg-muted/95 backdrop-blur border-t p-2 flex gap-2">
                    <Button variant="ghost" size="sm" className="flex-1 text-xs">
                      <RotateCcw className="h-3 w-3 mr-1" /> 重新部署
                    </Button>
                    <Button variant="ghost" size="sm" className="flex-1 text-xs">
                      <FileText className="h-3 w-3 mr-1" /> 日志
                    </Button>
                    <Button variant="ghost" size="sm" className="flex-1 text-xs">
                      <ExternalLink className="h-3 w-3 mr-1" /> 访问
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
          {projects.length === 0 && (
            <div className="col-span-full py-8 text-center text-muted-foreground">
              暂无项目
            </div>
          )}
        </div>
      </motion.div>

      {/* Usage Trend Chart */}
      <motion.div {...fadeIn} transition={{ duration: 0.3, delay: 0.4 }}>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>用量趋势</CardTitle>
            <div className="flex gap-1">
              <Button
                variant={chartRange === "7d" ? "default" : "ghost"}
                size="sm"
                onClick={() => setChartRange("7d")}
              >
                7d
              </Button>
              <Button
                variant={chartRange === "30d" ? "default" : "ghost"}
                size="sm"
                onClick={() => setChartRange("30d")}
              >
                30d
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="bandwidthGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(199, 89%, 48%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(199, 89%, 48%)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="requestsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis yAxisId="left" stroke="hsl(199, 89%, 48%)" fontSize={12} />
                <YAxis yAxisId="right" orientation="right" stroke="hsl(142, 76%, 36%)" fontSize={12} />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Area yAxisId="left" type="monotone" dataKey="bandwidth" stroke="hsl(199, 89%, 48%)" fill="url(#bandwidthGrad)" name="带宽 (GB)" />
                <Area yAxisId="right" type="monotone" dataKey="requests" stroke="hsl(142, 76%, 36%)" fill="url(#requestsGrad)" name="请求数" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
