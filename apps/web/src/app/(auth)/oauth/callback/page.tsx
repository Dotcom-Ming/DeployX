"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

function OAuthCallbackContent() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const code = searchParams.get("code");
    const state = searchParams.get("state");

    if (!code) {
      navigate("/login");
      return;
    }

    // Simulate OAuth token exchange
    const handleCallback = async () => {
      try {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 2000));
        navigate("/deployx/dashboard");
      } catch {
        navigate("/login?error=oauth_failed");
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      <p className="text-sm text-muted-foreground">Completing authentication...</p>
    </div>
  );
}

export default function OAuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col items-center justify-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      <p className="text-sm text-muted-foreground">正在完成身份验证...</p>
        </div>
      }
    >
      <OAuthCallbackContent />
    </Suspense>
  );
}
