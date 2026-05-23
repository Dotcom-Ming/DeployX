"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import type { UserDto, OrganizationDto } from "@deployx/shared";
import { apiClient } from "@/lib/api-client";

interface AuthContextValue {
  user: UserDto | null;
  orgs: OrganizationDto[];
  currentOrg: OrganizationDto | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  switchOrg: (orgId: string) => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserDto | null>(null);
  const [orgs, setOrgs] = useState<OrganizationDto[]>([]);
  const [currentOrg, setCurrentOrg] = useState<OrganizationDto | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    const token = localStorage.getItem("deployx_token");
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const res = await apiClient.get<UserDto>("/users/me");
      setUser(res);
    } catch {
      localStorage.removeItem("deployx_token");
      localStorage.removeItem("deployx_refresh_token");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchOrgs = useCallback(async () => {
    try {
      const res = await apiClient.get<OrganizationDto[]>("/organizations");
      setOrgs(res);
      const savedOrgId = localStorage.getItem("deployx_current_org");
      const target = savedOrgId
        ? res.find((o) => o.id === savedOrgId)
        : res[0];
      if (target) {
        setCurrentOrg(target);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    if (user) {
      fetchOrgs();
    }
  }, [user, fetchOrgs]);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await apiClient.post<{
        accessToken: string;
        refreshToken: string;
        user: UserDto;
      }>("/auth/login", { email, password });
      localStorage.setItem("deployx_token", res.accessToken);
      localStorage.setItem("deployx_refresh_token", res.refreshToken);
      setUser(res.user);
    },
    []
  );

  const logout = useCallback(() => {
    localStorage.removeItem("deployx_token");
    localStorage.removeItem("deployx_refresh_token");
    localStorage.removeItem("deployx_current_org");
    setUser(null);
    setOrgs([]);
    setCurrentOrg(null);
    window.location.href = "/login";
  }, []);

  const switchOrg = useCallback(
    (orgId: string) => {
      const org = orgs.find((o) => o.id === orgId);
      if (org) {
        setCurrentOrg(org);
        localStorage.setItem("deployx_current_org", orgId);
      }
    },
    [orgs]
  );

  return (
    <AuthContext.Provider
      value={{ user, orgs, currentOrg, login, logout, switchOrg, loading }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
