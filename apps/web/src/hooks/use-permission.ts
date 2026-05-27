"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { MembershipRole } from "@deployx/shared";

const rolePermissionMap: Record<MembershipRole, string[]> = {
  [MembershipRole.OWNER]: ["*"],
  [MembershipRole.ADMIN]: [
    "project:*",
    "deployment:*",
    "domain:*",
    "env:*",
    "billing:view",
    "billing:manage",
    "billing:invoices",
    "org:read",
    "org:update",
    "team:invite",
    "team:remove",
    "team:update_role",
    "team:list",
    "log:read",
    "log:export",
    "settings:read",
    "settings:update",
    "token:*",
    "webhook:*",
  ],
  [MembershipRole.MEMBER]: [
    "project:read",
    "project:create",
    "project:update",
    "deployment:read",
    "deployment:create",
    "deployment:cancel",
    "domain:read",
    "env:read",
    "org:read",
    "team:list",
    "log:read",
    "settings:read",
    "token:create",
    "token:read",
    "webhook:read",
  ],
  [MembershipRole.VIEWER]: [
    "project:read",
    "deployment:read",
    "domain:read",
    "org:read",
    "team:list",
    "log:read",
    "settings:read",
    "webhook:read",
  ],
};

function resolvePermission(
  userPermissions: string[],
  permission: string
): boolean {
  if (userPermissions.includes("*")) return true;

  const [resource] = permission.split(":");
  if (userPermissions.includes(`${resource}:*`)) return true;

  return userPermissions.includes(permission);
}

export function usePermission(permission: string): boolean {
  const { user } = useAuth();

  if (!user) return false;

  const role = user.role as MembershipRole;
  const permissions = rolePermissionMap[role] ?? [];

  return resolvePermission(permissions, permission);
}

export function usePermissions(permissions: string[]) {
  const { user } = useAuth();

  if (!user) {
    return {
      hasAll: false,
      hasAny: false,
      getPermissions: () => [] as string[],
    };
  }

  const role = user.role as MembershipRole;
  const userPermissions = rolePermissionMap[role] ?? [];

  const hasAll = permissions.every((p) => resolvePermission(userPermissions, p));
  const hasAny = permissions.some((p) => resolvePermission(userPermissions, p));

  return {
    hasAll,
    hasAny,
    getPermissions: () => userPermissions,
  };
}
