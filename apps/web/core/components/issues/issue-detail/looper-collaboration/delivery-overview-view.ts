import type { TLooperPhaseKey, TLooperSummary } from "./types";

export type TLooperOverviewTone = "neutral" | "brand" | "warning" | "danger" | "success";

export type TLooperDeliveryOverview = {
  tone: TLooperOverviewTone;
  eyebrowKey: string;
  titleKey: string;
  descriptionKey: string;
  blockerKey: string | null;
  primaryArtifactType: "technical_spec" | "pull_request" | "qa" | null;
};

const HEALTHY = "ok";

export const formatElapsedDuration = (createdAt: string, now: number, locale: string): string => {
  const createdAtMs = Date.parse(createdAt);
  const elapsedMinutes = Number.isFinite(createdAtMs) ? Math.max(0, Math.floor((now - createdAtMs) / 60_000)) : 0;
  const isChinese = locale.toLowerCase().startsWith("zh");

  if (elapsedMinutes < 1) return isChinese ? "不到 1 分钟" : "<1 min";
  if (elapsedMinutes < 60) return isChinese ? `${elapsedMinutes} 分钟` : `${elapsedMinutes} min`;

  const hours = Math.floor(elapsedMinutes / 60);
  const minutes = elapsedMinutes % 60;
  if (hours < 24) {
    if (minutes === 0) return isChinese ? `${hours} 小时` : `${hours} hr`;
    return isChinese ? `${hours} 小时 ${minutes} 分钟` : `${hours} hr ${minutes} min`;
  }

  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  if (remainingHours === 0) return isChinese ? `${days} 天` : `${days} d`;
  return isChinese ? `${days} 天 ${remainingHours} 小时` : `${days} d ${remainingHours} hr`;
};

const phaseOverview = (
  phase: TLooperPhaseKey | undefined,
  state: string
): Omit<TLooperDeliveryOverview, "blockerKey"> => {
  if (state === "completed" || phase === "complete") {
    return {
      tone: "success",
      eyebrowKey: "issue.looper.overview.eyebrow.complete",
      titleKey: "issue.looper.overview.title.complete",
      descriptionKey: "issue.looper.overview.description.complete",
      primaryArtifactType: "pull_request",
    };
  }

  if (state === "failed") {
    return {
      tone: "danger",
      eyebrowKey: "issue.looper.overview.eyebrow.attention",
      titleKey: "issue.looper.overview.title.failed",
      descriptionKey: "issue.looper.overview.description.failed",
      primaryArtifactType: null,
    };
  }

  switch (phase) {
    case "implementation":
      return {
        tone: "brand",
        eyebrowKey: "issue.looper.overview.eyebrow.ready",
        titleKey: "issue.looper.overview.title.implementation",
        descriptionKey: "issue.looper.overview.description.implementation",
        primaryArtifactType: "technical_spec",
      };
    case "pull_request":
      return {
        tone: "brand",
        eyebrowKey: "issue.looper.overview.eyebrow.delivery",
        titleKey: "issue.looper.overview.title.pull_request",
        descriptionKey: "issue.looper.overview.description.pull_request",
        primaryArtifactType: "pull_request",
      };
    case "qa":
      return {
        tone: "brand",
        eyebrowKey: "issue.looper.overview.eyebrow.delivery",
        titleKey: "issue.looper.overview.title.qa",
        descriptionKey: "issue.looper.overview.description.qa",
        primaryArtifactType: "qa",
      };
    case "technical_spec":
      return {
        tone: "neutral",
        eyebrowKey: "issue.looper.overview.eyebrow.planning",
        titleKey: "issue.looper.overview.title.technical_spec",
        descriptionKey: "issue.looper.overview.description.technical_spec",
        primaryArtifactType: null,
      };
    case "role_decisions":
      return {
        tone: "neutral",
        eyebrowKey: "issue.looper.overview.eyebrow.planning",
        titleKey: "issue.looper.overview.title.role_decisions",
        descriptionKey: "issue.looper.overview.description.role_decisions",
        primaryArtifactType: null,
      };
    default:
      return {
        tone: "neutral",
        eyebrowKey: "issue.looper.overview.eyebrow.planning",
        titleKey: "issue.looper.overview.title.research",
        descriptionKey: "issue.looper.overview.description.research",
        primaryArtifactType: null,
      };
  }
};

export const resolveDeliveryOverview = (summary: TLooperSummary): TLooperDeliveryOverview => {
  const state = summary.dispatch?.state ?? "queued";

  if (summary.dispatch && summary.dispatch.health !== HEALTHY) {
    return {
      tone: "warning",
      eyebrowKey: "issue.looper.overview.eyebrow.attention",
      titleKey: "issue.looper.overview.title.health",
      descriptionKey: "issue.looper.overview.description.health",
      blockerKey: `issue.looper.health.${summary.dispatch.health}`,
      primaryArtifactType: null,
    };
  }

  if (summary.waiting_role || summary.current_question || state === "awaiting_human") {
    return {
      tone: "warning",
      eyebrowKey: "issue.looper.overview.eyebrow.waiting",
      titleKey: "issue.looper.overview.title.waiting_human",
      descriptionKey: "issue.looper.overview.description.waiting_human",
      blockerKey: "issue.looper.blocker.human_decision",
      primaryArtifactType: null,
    };
  }

  const overview = phaseOverview(summary.current_phase, state);
  return { ...overview, blockerKey: state === "failed" ? "issue.looper.blocker.failed" : null };
};

const RECENT_EVENT_KEYS: Record<string, string> = {
  dispatch_created: "issue.looper.activity.event.dispatch_created",
  dispatch_claimed: "issue.looper.activity.event.dispatch_claimed",
  dispatch_queued: "issue.looper.activity.event.dispatch_queued",
  dispatch_running: "issue.looper.activity.event.dispatch_running",
  dispatch_awaiting_human: "issue.looper.activity.event.dispatch_awaiting_human",
  dispatch_completed: "issue.looper.activity.event.dispatch_completed",
  dispatch_failed: "issue.looper.activity.event.dispatch_failed",
  dispatch_confirmed_stopped: "issue.looper.activity.event.dispatch_stopped",
  dispatch_released: "issue.looper.activity.event.dispatch_released",
  stop_requested: "issue.looper.activity.event.stop_requested",
  role_request_created: "issue.looper.activity.event.role_request_created",
  role_request_opened: "issue.looper.activity.event.role_request_created",
  role_message_created: "issue.looper.activity.event.role_message_created",
  role_message_follow_up: "issue.looper.activity.event.role_message_follow_up",
  role_request_answered: "issue.looper.activity.event.role_request_answered",
  technical_spec_approved: "issue.looper.activity.event.technical_spec_approved",
  artifact_published: "issue.looper.activity.event.artifact_published",
};

export const resolveRecentEvent = (event: NonNullable<TLooperSummary["recent_events"]>[number]): string =>
  RECENT_EVENT_KEYS[event.type] ?? "issue.looper.activity.event.generic";

export const findPrimaryArtifact = (summary: TLooperSummary, type: TLooperDeliveryOverview["primaryArtifactType"]) => {
  if (!type) return null;
  const artifacts = summary.artifacts ?? [];
  const patterns: Record<Exclude<typeof type, null>, RegExp> = {
    technical_spec: /technical[_ -]?spec|技术方案|spec/i,
    pull_request: /pull[_ -]?request|\bpr\b/i,
    qa: /\bqa\b|验收|validation/i,
  };
  return artifacts.find((artifact) => patterns[type].test(`${artifact.type} ${artifact.title}`)) ?? null;
};
