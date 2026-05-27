"use client";

import { useEffect, useState, Suspense } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

function VerifyEmailForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  const apiBaseUrl = import.meta.env.VITE_API_URL ?? "http://localhost:3006";

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("未提供验证令牌。");
      return;
    }

    const verify = async () => {
      try {
        const res = await fetch(`${apiBaseUrl}/auth/verify-email?token=${token}`);
        const data = await res.json();

        if (!res.ok) {
          setStatus("error");
          setMessage(data.message || "验证失败，请重试。");
          return;
        }

        setStatus("success");
        setMessage(data.message || "邮箱验证成功！");
      } catch {
        setStatus("error");
        setMessage("出了点问题，请重试。");
      }
    };

    verify();
  }, [token]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-muted-foreground" />
            <CardTitle className="mt-4">正在验证邮箱</CardTitle>
            <CardDescription>请稍等，我们正在验证您的邮箱地址...</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {status === "success" ? (
            <>
              <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
              <CardTitle className="mt-4">邮箱已验证！</CardTitle>
            </>
          ) : (
            <>
              <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
              <CardTitle className="mt-4">验证失败</CardTitle>
            </>
          )}
          <CardDescription>{message}</CardDescription>
        </CardHeader>
        <CardFooter className="flex justify-center gap-3">
          {status === "success" ? (
            <Link to="/login">
              <Button>登录</Button>
            </Link>
          ) : (
            <>
              <Link to="/login">
                <Button variant="outline">返回登录</Button>
              </Link>
              <Link to="/signup">
                <Button>创建新账号</Button>
              </Link>
            </>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailForm />
    </Suspense>
  );
}
