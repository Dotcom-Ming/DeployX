"use client";

import { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Rocket, GitBranch, UserPlus, Settings, Loader2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getProjects, getDeployments } from "@/lib/api";
import { DeploymentStatus } from "@deployx/shared";
import { formatRelativeTime } from "@deployx/shared";
import { useQuery } from "@tanstack/react-query";
import { EmptyState } from "@/components/custom/empty-state";
import { Activity } from "lucide-react";

const activityIcons: Record<string, React.ElementType> = {
  deployment_ready: Rocket,
  deployment_building: Rocket,
  deployment_error: Rocket,
  deployment_queued: Rocket,
  deployment_cancelled: Rocket,
};

function getActivityType(dep: any): string {
  return `deployment_${dep.status.toLowerCase()}`;
}

function getActivityDescription(dep: any): string {
  const action: Record<string, string> = {
    [DeploymentStatus.READY]: "Deployment succeeded",
    [DeploymentStatus.BUILDING]: "Deployment started building",
    [DeploymentStatus.ERROR]: "Deployment failed",
    [DeploymentStatus.QUEUED]: "Deployment queued",
    [DeploymentStatus.PENDING]: "Deployment pending",
    [DeploymentStatus.CANCELLED]: "Deployment cancelled",
  };
  return action[dep.status] || "Deployment updated";
}

function groupByDate(items: any[]): Map<string, any[]> {
  const groups = new Map<string, any[]>();
  for (const item of items) {
    const date = new Date(item.createdAt).toLocaleDateString(undefined, {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
    });
    if (!groups.has(date)) groups.set(date, []);
    groups.get(date)!.push(item);
  }
  return groups;
}

export default function ActivityPage() {
  const params = useParams<{ org: string }>();
  const router = useRouter();
  const orgSlug = params.org;

  const { data: projectsData, isLoading: projectsLoading } = useQuery({
    queryKey: ["projects", orgSlug],
    queryFn: () => getProjects(orgSlug),
  });

  const projects = projectsData?.data || [];

  const { data: allDeployments, isLoading: deploysLoading } = useQuery({
    queryKey: ["org-activity", orgSlug],
    queryFn: async () => {
      const all: any[] = [];
      for (const p of projects) {
        try {
          const res = await getDeployments(orgSlug, p.id);
          for (const dep of (res.data || [])) {
            all.push({ ...dep, projectName: p.name, projectId: p.id });
          }
        } catch { /* skip */ }
      }
      all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return all;
    },
    enabled: !!projects.length,
  });

  const isLoading = projectsLoading || deploysLoading;

  const grouped = useMemo(() => {
    if (!allDeployments) return new Map();
    return groupByDate(allDeployments);
  }, [allDeployments]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!allDeployments?.length) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Activity</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Audit log and recent activity for your organization
          </p>
        </div>
        <Card>
          <CardContent className="py-8">
            <EmptyState
              icon={Activity}
              title="No activity yet"
              description="Actions performed in your organization will appear here"
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Activity</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Audit log and recent activity for your organization
        </p>
      </div>

      <div className="space-y-8">
        {Array.from(grouped.entries()).map(([date, items]) => (
          <motion.div
            key={date}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h3 className="text-sm font-medium text-muted-foreground mb-4">{date}</h3>
            <div className="space-y-1">
              {items.map((dep: any, idx: number) => {
                const Icon = activityIcons[getActivityType(dep)] || Rocket;
                const isError = dep.status === DeploymentStatus.ERROR;
                return (
                  <div
                    key={dep.id}
                    className="flex items-start gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group"
                    onClick={() => router.push(`/${orgSlug}/projects/${dep.projectId}/deployments/${dep.id}`)}
                  >
                    <div className={`mt-0.5 flex h-8 w-8 items-center justify-center rounded-full border ${
                      isError ? "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950" : "border-border bg-muted"
                    }`}>
                      <Icon className={`h-4 w-4 ${isError ? "text-red-500" : "text-muted-foreground"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium">{getActivityDescription(dep)}</span>
                        <Badge variant="outline" className="text-[11px] font-mono">
                          {dep.projectName}
                        </Badge>
                        {dep.branch && (
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <GitBranch className="h-3 w-3" />
                            {dep.branch}
                          </span>
                        )}
                      </div>
                      {dep.commitMessage && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{dep.commitMessage}</p>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground whitespace-nowrap shrink-0 pt-0.5">
                      {formatRelativeTime(new Date(dep.createdAt))}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
