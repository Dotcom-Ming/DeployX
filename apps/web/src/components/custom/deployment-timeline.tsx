"use client";

import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  Loader2,
  XCircle,
  Circle,
} from "lucide-react";

interface Stage {
  name: string;
  status: "completed" | "in-progress" | "pending" | "failed";
  duration?: string;
}

interface DeploymentTimelineProps {
  stages: Stage[];
  className?: string;
}

const stageIcons = {
  completed: CheckCircle2,
  "in-progress": Loader2,
  pending: Circle,
  failed: XCircle,
};

const stageColors = {
  completed: "text-green-500",
  "in-progress": "text-blue-500",
  pending: "text-muted-foreground",
  failed: "text-red-500",
};

const lineColors = {
  completed: "bg-green-500",
  "in-progress": "bg-blue-500",
  pending: "bg-muted",
  failed: "bg-red-500",
};

export function DeploymentTimeline({ stages, className }: DeploymentTimelineProps) {
  return (
    <div className={cn("flex items-center gap-0 w-full", className)}>
      {stages.map((stage, i) => {
        const Icon = stageIcons[stage.status];
        const isLast = i === stages.length - 1;

        return (
          <div key={stage.name} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full border-2",
                  stage.status === "completed" && "border-green-500 bg-green-500/10",
                  stage.status === "in-progress" && "border-blue-500 bg-blue-500/10",
                  stage.status === "pending" && "border-muted bg-background",
                  stage.status === "failed" && "border-red-500 bg-red-500/10"
                )}
              >
                <Icon
                  className={cn(
                    "h-4 w-4",
                    stageColors[stage.status],
                    stage.status === "in-progress" && "animate-spin"
                  )}
                />
              </div>
              <span className="text-xs font-medium text-center whitespace-nowrap">
                {stage.name}
              </span>
              {stage.duration && (
                <span className="text-[10px] text-muted-foreground">
                  {stage.duration}
                </span>
              )}
            </div>
            {!isLast && (
              <div
                className={cn(
                  "flex-1 h-0.5 mx-2",
                  stage.status === "completed"
                    ? lineColors.completed
                    : stage.status === "failed"
                      ? lineColors.failed
                      : stage.status === "in-progress"
                        ? "bg-gradient-to-r from-blue-500 to-muted"
                        : lineColors.pending
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
