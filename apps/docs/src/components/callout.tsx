import type { ReactNode } from "react";

type CalloutVariant = "info" | "warning" | "tip" | "danger";

interface CalloutProps {
  variant?: CalloutVariant;
  title?: string;
  children: ReactNode;
}

const calloutStyles: Record<CalloutVariant, { container: string; icon: string; label: string }> = {
  info: {
    container: "border-info/30 bg-info/5",
    icon: "text-info",
    label: "提示",
  },
  warning: {
    container: "border-warning/30 bg-warning/5",
    icon: "text-warning",
    label: "警告",
  },
  tip: {
    container: "border-success/30 bg-success/5",
    icon: "text-success",
    label: "技巧",
  },
  danger: {
    container: "border-error/30 bg-error/5",
    icon: "text-error",
    label: "危险",
  },
};

function CalloutIcon({ variant }: { variant: CalloutVariant }) {
  if (variant === "info") {
    return (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
      </svg>
    );
  }
  if (variant === "warning" || variant === "danger") {
    return (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
      </svg>
    );
  }
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.166a5.25 5.25 0 003.617-4.984V6.75A5.25 5.25 0 0014.25 1.5h-4.5A5.25 5.25 0 004.5 6.75v3.916a5.25 5.25 0 003.617 4.984c.85.343 1.508 1.183 1.508 2.166V18" />
    </svg>
  );
}

export function Callout({ variant = "info", title, children }: CalloutProps) {
  const style = calloutStyles[variant];
  const heading = title ?? style.label;

  return (
    <div className={`my-4 rounded-lg border ${style.container} p-4`}>
      <div className="flex items-start gap-3">
        <div className={style.icon}>
          <CalloutIcon variant={variant} />
        </div>
        <div className="flex-1 text-sm text-foreground [&_p]:mb-0 [&_code]:bg-muted [&_code]:rounded [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-xs [&_code]:font-mono">
          {heading ? (
            <div className="font-semibold mb-1">{heading}</div>
          ) : null}
          {children}
        </div>
      </div>
    </div>
  );
}
