"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface AvatarProps {
  src?: string;
  alt?: string;
  fallback: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizeMap = { sm: "h-6 w-6 text-xs", md: "h-8 w-8 text-sm", lg: "h-10 w-10 text-base" };

export function Avatar({ src, alt, fallback, className, size = "md" }: AvatarProps) {
  const [imgError, setImgError] = React.useState(false);

  if (src && !imgError) {
    return (
      <img
        src={src}
        alt={alt || fallback}
        onError={() => setImgError(true)}
        className={cn("rounded-full object-cover", sizeMap[size], className)}
      />
    );
  }

  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center bg-muted font-medium",
        sizeMap[size],
        className
      )}
    >
      {fallback.slice(0, 2).toUpperCase()}
    </div>
  );
}
