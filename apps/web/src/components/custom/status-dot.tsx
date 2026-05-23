import { cn } from "@/lib/utils";

type Status = "ready" | "building" | "error" | "queued" | "canceled";

interface StatusDotProps {
  status: Status;
  className?: string;
}

const statusColors: Record<Status, string> = {
  ready: "bg-green-500",
  building: "bg-blue-500",
  error: "bg-red-500",
  queued: "bg-yellow-500",
  canceled: "bg-gray-400",
};

export function StatusDot({ status, className }: StatusDotProps) {
  return (
    <span
      className={cn(
        "inline-block h-2 w-2 rounded-full shrink-0",
        statusColors[status],
        status === "building" && "animate-pulse",
        className
      )}
    />
  );
}
