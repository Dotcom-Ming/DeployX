"use client";

import { usePermission } from "@/hooks/use-permission";

interface CanProps {
  permission: string;
  role?: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function Can({ permission, role, fallback = null, children }: CanProps) {
  const hasPermission = usePermission(permission);

  if (role) {
    // If a specific role is required, check both permission and role
    // This can be extended based on the role hierarchy
  }

  if (!hasPermission) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
