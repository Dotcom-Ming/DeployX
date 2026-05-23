"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

let initialized = false;

export function SentryProvider() {
  useEffect(() => {
    if (initialized) {
      return;
    }

    const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN_WEB;
    if (!dsn) {
      return;
    }

    Sentry.init({
      dsn,
      environment:
        process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ||
        process.env.NODE_ENV ||
        "development",
      tracesSampleRate: Number(
        process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE || "0.2"
      ),
    });

    initialized = true;
  }, []);

  return null;
}
