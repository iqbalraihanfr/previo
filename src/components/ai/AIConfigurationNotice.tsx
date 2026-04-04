"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";

import type { AIConfigurationStatus } from "@/lib/ai/config";

type AIConfigurationNoticeProps = {
  variant?: "compact" | "full" | "subtle";
};

type StatusState =
  | { loading: true; data: null }
  | { loading: false; data: AIConfigurationStatus }
  | { loading: false; data: null };

export function AIConfigurationNotice({
  variant = "full",
}: AIConfigurationNoticeProps) {
  const [status, setStatus] = useState<StatusState>({
    loading: true,
    data: null,
  });

  useEffect(() => {
    let cancelled = false;

    async function loadStatus() {
      try {
        const response = await fetch("/api/ai/status", { cache: "no-store" });
        if (!response.ok) {
          throw new Error("Failed to load AI status");
        }

        const data = (await response.json()) as AIConfigurationStatus;
        if (!cancelled) {
          setStatus({ loading: false, data });
        }
      } catch {
        if (!cancelled) {
          setStatus({ loading: false, data: null });
        }
      }
    }

    void loadStatus();
    return () => {
      cancelled = true;
    };
  }, []);

  if (status.loading || !status.data) {
    return null;
  }

  const aiStatus = status.data;

  if (variant === "compact") {
    return (
      <div
        className="rounded-[14px] border border-border/70 bg-background/75 px-3 py-2"
        data-testid="ai-config-notice"
      >
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Badge variant={aiStatus.configured ? "secondary" : "outline"}>
            {aiStatus.configured ? "AI ready" : "AI setup required"}
          </Badge>
          <span>
            Provider:{" "}
            <span className="font-medium text-foreground">{aiStatus.provider}</span>
          </span>
          {!aiStatus.configured && (
            <span>
              Add{" "}
              <span className="font-medium text-foreground">
                {aiStatus.missing.join(", ")}
              </span>{" "}
              to `.env.local` to enable AI-assisted import and parsing.
            </span>
          )}
        </div>
      </div>
    );
  }

  if (variant === "subtle") {
    return (
      <section
        className="rounded-[14px] border border-border/60 bg-background/70 px-4 py-3 shadow-[0_4px_20px_rgba(46,50,48,0.04)]"
        data-testid="ai-config-notice"
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={aiStatus.configured ? "secondary" : "outline"}>
                {aiStatus.configured ? "AI ready" : "AI setup required"}
              </Badge>
              <span className="text-sm text-muted-foreground">
                Provider{" "}
                <span className="font-medium text-foreground">{aiStatus.provider}</span>
              </span>
              <span className="text-sm text-muted-foreground">
                Model{" "}
                <span className="font-medium text-foreground">{aiStatus.model}</span>
              </span>
            </div>

            <p className="text-sm leading-6 text-muted-foreground">
              {aiStatus.configured
                ? "AI-assisted import and parsing are available when you need them."
                : "The workspace still works without AI, but import assistance and suggestions stay unavailable until a provider key is configured."}
            </p>
          </div>

          <details className="rounded-[12px] border border-border/60 bg-background/85 px-3 py-2 text-sm sm:min-w-[220px]">
            <summary className="flex cursor-pointer list-none items-center gap-2 font-medium text-foreground">
              <Sparkles className="h-4 w-4" />
              Environment check
            </summary>
            <div className="mt-3 space-y-2 text-muted-foreground">
              <p>
                Key status:{" "}
                <span className="font-medium text-foreground">
                  {aiStatus.configured ? "Configured" : "Missing"}
                </span>
              </p>
              {!aiStatus.configured && (
                <p>
                  Required env:{" "}
                  <span className="font-medium text-foreground">
                    {aiStatus.missing.join(", ")}
                  </span>
                </p>
              )}
              <p>Set env vars in `.env.local`, then restart the app.</p>
            </div>
          </details>
        </div>
      </section>
    );
  }

  return (
    <section
      className={`rounded-[16px] border px-4 py-3 ${
        aiStatus.configured
          ? "border-emerald-500/25 bg-emerald-500/5"
          : "border-amber-500/25 bg-amber-500/8"
      }`}
      data-testid="ai-config-notice"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={aiStatus.configured ? "secondary" : "outline"}>
              {aiStatus.configured ? "AI configured" : "AI setup required"}
            </Badge>
            <span className="text-sm font-medium text-foreground">
              Provider {aiStatus.provider}
            </span>
            <span className="text-sm text-muted-foreground">
              Model {aiStatus.model}
            </span>
          </div>

          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            {aiStatus.configured ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            )}
            <p>
              {aiStatus.configured
                ? "AI-assisted import, document extraction, and SQL fallback parsing are available."
                : "The workspace still works without AI, but AI-assisted document import, suggestions, and SQL fallback parsing stay unavailable until you configure a provider key."}
            </p>
          </div>
        </div>

        <details className="min-w-[240px] rounded-[12px] border border-border/60 bg-background/80 px-3 py-2 text-sm">
          <summary className="flex cursor-pointer list-none items-center gap-2 font-medium text-foreground">
            <Sparkles className="h-4 w-4" />
            Environment check
          </summary>
          <div className="mt-3 space-y-2 text-muted-foreground">
            <p>
              Provider:{" "}
              <span className="font-medium text-foreground">{aiStatus.provider}</span>
            </p>
            <p>
              Key status:{" "}
              <span className="font-medium text-foreground">
                {aiStatus.configured ? "Configured" : "Missing"}
              </span>
            </p>
            {!aiStatus.configured && (
              <p>
                Required env:{" "}
                <span className="font-medium text-foreground">
                  {aiStatus.missing.join(", ")}
                </span>
              </p>
            )}
            <p>Set env vars in `.env.local`, then restart the app.</p>
          </div>
        </details>
      </div>
    </section>
  );
}
