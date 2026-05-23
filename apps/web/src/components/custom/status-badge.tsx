import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  Loader2,
  XCircle,
  Clock,
  Ban,
} from "lucide-react";

type Status = "ready" | "building" | "error" | "queued" | "canceled";

interface StatusBadgeProps {
  status: Status;
  size?: "sm" | "md";
  variant?: "solid" | "soft" | "outline";
  className?: string;
}

const statusConfig: Record<
  Status,
  { label: string; icon: React.ElementType; solidClass: string; softClass: string; outlineClass: string }
> = {
  ready: {
    label: "Ready",
    icon: CheckCircle2,
    solidClass: "bg-green-600 text-white hover:bg-green-600 border-green-600",
    softClass: "bg-green-500/10 text-green-600 hover:bg-green-500/10 border-green-500/20",
    outlineClass: "text-green-600 border-green-500/40 hover:text-green-600",
  },
  building: {
    label: "Building",
    icon: Loader2,
    solidClass: "bg-blue-600 text-white hover:bg-blue-600 border-blue-600",
    softClass: "bg-blue-500/10 text-blue-600 hover:bg-blue-500/10 border-blue-500/20",
    outlineClass: "text-blue-600 border-blue-500/40 hover:text-blue-600",
  },
  error: {
    label: "Error",
    icon: XCircle,
    solidClass: "bg-red-600 text-white hover:bg-red-600 border-red-600",
    softClass: "bg-red-500/10 text-red-600 hover:bg-red-500/10 border-red-500/20",
    outlineClass: "text-red-600 border-red-500/40 hover:text-red-600",
  },
  queued: {
    label: "Queued",
    icon: Clock,
    solidClass: "bg-yellow-600 text-white hover:bg-yellow-600 border-yellow-600",
    softClass: "bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/10 border-yellow-500/20",
    outlineClass: "text-yellow-600 border-yellow-500/40 hover:text-yellow-600",
  },
  canceled: {
    label: "Canceled",
    icon: Ban,
    solidClass: "bg-gray-500 text-white hover:bg-gray-500 border-gray-500",
    softClass: "bg-gray-500/10 text-gray-500 hover:bg-gray-500/10 border-gray-500/20",
    outlineClass: "text-gray-500 border-gray-500/40 hover:text-gray-500",
  },
};

export function StatusBadge({
  status,
  size = "md",
  variant = "soft",
  className,
}: StatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  const variantClass =
    variant === "solid"
      ? config.solidClass
      : variant === "soft"
        ? config.softClass
        : config.outlineClass;

  return (
    <Badge
      className={cn(
        "gap-1 font-medium border",
        variantClass,
        size === "sm" && "text-[11px] px-1.5 py-0",
        size === "md" && "text-xs px-2 py-0.5",
        className
      )}
    >
      <Icon
        className={cn(
          status === "building" && "animate-spin",
          size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"
        )}
      />
      {config.label}
    </Badge>
  );
}
