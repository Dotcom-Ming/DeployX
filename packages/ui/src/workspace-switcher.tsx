'use client';

import React from 'react';
import { cn } from './lib/utils';

interface Org {
  id: string;
  name: string;
  slug: string;
  plan: string;
}

interface WorkspaceSwitcherProps {
  organizations: Org[];
  currentOrg?: Org;
  onSwitchOrg?: (org: Org) => void;
  className?: string;
}

export function WorkspaceSwitcher({ organizations, currentOrg, onSwitchOrg, className }: WorkspaceSwitcherProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <div className={cn('relative', className)}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
      >
        <div className="flex h-5 w-5 items-center justify-center rounded bg-muted text-[10px] font-bold">
          {currentOrg?.name?.charAt(0)?.toUpperCase() || 'D'}
        </div>
        <span className="font-medium">{currentOrg?.name || 'DeployX'}</span>
        <span className="text-xs text-muted-foreground">▼</span>
      </button>
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-56 rounded-md border bg-popover p-1 shadow-md">
          {organizations.map((org) => (
            <button
              key={org.id}
              onClick={() => {
                onSwitchOrg?.(org);
                setOpen(false);
              }}
              className={cn(
                'flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent',
                currentOrg?.id === org.id && 'bg-accent',
              )}
            >
              <div className="flex h-5 w-5 items-center justify-center rounded bg-muted text-[10px] font-bold">
                {org.name.charAt(0).toUpperCase()}
              </div>
              <span className="flex-1 text-left">{org.name}</span>
              <span className="rounded bg-muted px-1 py-0.5 text-[10px]">{org.plan}</span>
              {currentOrg?.id === org.id && <span className="text-blue-500">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
