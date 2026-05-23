"use client";

import { useAuth } from "@/components/providers/auth-provider";

export function useOrganization() {
  const { currentOrg, orgs, switchOrg, loading } = useAuth();

  return {
    currentOrg,
    organizations: orgs,
    switchOrg,
    loading,
  };
}
