"use client";

import React from "react";
import { usePermission, usePermissions } from "@/hooks/use-permission";
import { useAuth } from "@/components/providers/auth-provider";

function Skeleton() {
  return <div className="animate-pulse rounded-md bg-muted h-4 w-full" />;
}

type Mode = "all" | "any";

interface CanBaseProps {
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

interface CanWithPermission extends CanBaseProps {
  permission: string;
  permissions?: string[];
  mode?: Mode;
  check?: never;
  role?: string;
}

interface CanWithPermissions extends CanBaseProps {
  permission?: string;
  permissions: string[];
  mode?: Mode;
  check?: never;
  role?: string;
}

interface CanWithCheck extends CanBaseProps {
  permission?: never;
  permissions?: never;
  mode?: never;
  role?: never;
  check: (permissions: string[]) => boolean;
}

export type CanProps = CanWithPermission | CanWithPermissions | CanWithCheck;

export function Can(props: CanProps) {
  const { loading } = useAuth();
  const { fallback = null, children } = props;

  if (loading) {
    return <Skeleton />;
  }

  if ("check" in props && props.check) {
    const { getPermissions } = usePermissions([]);
    const userPerms = getPermissions();
    if (!props.check(userPerms)) {
      return <>{fallback}</>;
    }
    return <>{children}</>;
  }

  const { permission, permissions, mode = "any", role } = props;

  const perms = [
    ...(permission ? [permission] : []),
    ...(permissions ?? []),
  ];

  const { hasAll, hasAny } = usePermissions(perms.length > 0 ? perms : [""]);

  const hasAccess = mode === "all" ? hasAll : hasAny;

  if (role) {
    const { user } = useAuth();
    if (user?.role !== role) {
      return <>{fallback}</>;
    }
  }

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

interface WithPermissionOptions {
  fallback?: React.ReactNode;
  mode?: Mode;
}

export function withPermission<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  permission: string,
  options: WithPermissionOptions = {}
) {
  const { fallback = null, mode = "any" } = options;

  const Component = (props: P) => {
    const { loading } = useAuth();
    const { hasAny, hasAll } = usePermissions([permission]);

    if (loading) {
      return <Skeleton />;
    }

    const hasAccess = mode === "all" ? hasAll : hasAny;
    if (!hasAccess) {
      return <>{fallback}</>;
    }

    return <WrappedComponent {...props} />;
  };

  Component.displayName = `withPermission(${WrappedComponent.displayName ?? WrappedComponent.name ?? "Component"})`;

  return Component;
}
