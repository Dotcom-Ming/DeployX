"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/react";

let initialized = false;

export function SentryProvider() {
  useEffect(() => {
    if (initialized) {
      return;
    }

    const dsn = import.meta.env.VITE_SENTRY_DSN_WEB;
    if (!dsn) {
      return;
    }

    Sentry.init({
      dsn,
      environment:
        import.meta.env.VITE_SENTRY_ENVIRONMENT ||
        import.meta.env.MODE ||
        "development",
      tracesSampleRate: Number(
        import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE || "0.2"
      ),
    });

    initialized = true;
  }, []);

  return null;
}
