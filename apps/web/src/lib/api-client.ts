import { toast } from "sonner";
import * as Sentry from "@sentry/react";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("deployx_token");
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const token = this.getToken();

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      let message = `请求失败: ${res.status}`;
      try {
        const errorBody = await res.json();
        message = errorBody.message ?? errorBody.error ?? message;
      } catch {
        // ignore parse error
      }

      if (res.status === 401) {
        localStorage.removeItem("deployx_token");
        localStorage.removeItem("deployx_refresh_token");
        window.location.href = "/login";
        return Promise.reject(new Error("未授权"));
      }

      if (import.meta.env.VITE_SENTRY_DSN_WEB) {
        Sentry.captureException(new Error(message), {
          tags: {
            module: "web",
            type: "api_client_error",
          },
          extra: {
            method,
            path,
            status: res.status,
          },
        });
      }

      toast.error(message);
      return Promise.reject(new Error(message));
    }

    // Handle 204 No Content
    if (res.status === 204) {
      return undefined as T;
    }

    const data = await res.json();
    return data.data ?? data;
  }

  get<T>(path: string): Promise<T> {
    return this.request<T>("GET", path);
  }

  post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>("POST", path, body);
  }

  patch<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>("PATCH", path, body);
  }

  delete<T>(path: string): Promise<T> {
    return this.request<T>("DELETE", path);
  }
}

export const apiClient = new ApiClient(BASE_URL);
