'use client';

import React, { ReactNode } from 'react';
import { cn } from './lib/utils';

interface CanProps {
  permission?: string;
  role?: string;
  permissions?: string[];
  mode?: 'all' | 'any';
  fallback?: ReactNode;
  children: ReactNode;
}

function checkPermission(permission: string): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const stored = localStorage.getItem('deployx_permissions');
    if (!stored) return true;
    const userPermissions = JSON.parse(stored) as string[];
    return userPermissions.includes(permission) || userPermissions.includes('*');
  } catch {
    return true;
  }
}

function checkRole(role: string): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const stored = localStorage.getItem('deployx_role');
    if (!stored) return true;
    return stored === role;
  } catch {
    return true;
  }
}

export function Can({ permission, role, permissions, mode = 'all', fallback = null, children }: CanProps) {
  try {
    if (permission) {
      const allowed = checkPermission(permission);
      return allowed ? <>{children}</> : <>{fallback}</>;
    }
    if (role) {
      const allowed = checkRole(role);
      return allowed ? <>{children}</> : <>{fallback}</>;
    }
    if (permissions && permissions.length > 0) {
      const results = permissions.map(checkPermission);
      const allowed = mode === 'all' ? results.every(Boolean) : results.some(Boolean);
      return allowed ? <>{children}</> : <>{fallback}</>;
    }
    return <>{children}</>;
  } catch {
    return <>{fallback}</>;
  }
}

export function withPermission<P extends object>(Component: React.ComponentType<P>, permission: string) {
  return function WithPermissionComponent(props: P) {
    return (
      <Can permission={permission}>
        <Component {...props} />
      </Can>
    );
  };
}
