import { ArrowUpRight, Bot, CircleStop, TriangleAlert } from "lucide-react";

import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { cn } from "@plane/utils";

import { findPrimaryArtifact, resolveDeliveryOverview, type TLooperOverviewTone } from "./delivery-overview-view";
import type { TLooperSummary } from "./types";
import { useElapsedDuration } from "./use-elapsed-duration";

type Props = {
  summary: TLooperSummary;
  isStopping: boolean;
  onStop: () => void;
};

const toneClasses: Record<TLooperOverviewTone, { bar: string; icon: string }> = {
  neutral: { bar: "bg-layer-4", icon: "text-tertiary" },
  brand: { bar: "bg-accent-primary", icon: "text-accent-primary" },
  warning: { bar: "bg-warning-primary", icon: "text-warning-primary" },
  danger: { bar: "bg-danger-primary", icon: "text-danger-primary" },
  success: { bar: "bg-success-primary", icon: "text-success-primary" },
};

export function LooperDeliveryOverviewCard({ summary, isStopping, onStop }: Props) {
  const { t } = useTranslation();
  const overview = resolveDeliveryOverview(summary);
  const primaryArtifact = findPrimaryArtifact(summary, overview.primaryArtifactType);
  const duration = useElapsedDuration(summary.dispatch!.created_at);
  const waitingRole = summary.waiting_role ? t(`issue.looper.role.${summary.waiting_role}`) : "";
  const isAttention = overview.tone === "warning" || overview.tone === "danger";
  const description =
    overview.blockerKey === "issue.looper.blocker.human_decision" && summary.current_question
      ? summary.current_question
      : t(overview.descriptionKey);

  return (
    <section className="relative overflow-hidden rounded-md border border-subtle bg-layer-1 px-4 py-3.5">
      <span className={cn("absolute inset-y-0 left-0 w-0.5", toneClasses[overview.tone].bar)} aria-hidden="true" />
      <div className="flex items-start gap-3">
        <span className={cn("mt-0.5 shrink-0", toneClasses[overview.tone].icon)}>
          {isAttention ? <TriangleAlert className="size-4" /> : <Bot className="size-4" />}
        </span>
        <div className="min-w-0 grow">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className={cn("text-caption-sm-medium", toneClasses[overview.tone].icon)}>
              {t(overview.eyebrowKey)}
            </span>
            {duration && (
              <span className="text-caption-sm-regular text-tertiary">
                {t("issue.looper.runtime_value", { duration })}
              </span>
            )}
          </div>
          <h4 className="mt-1 text-body-sm-medium text-primary">{t(overview.titleKey, { role: waitingRole })}</h4>
          <p className="mt-1 max-w-3xl text-body-xs-regular text-secondary">{description}</p>
          {overview.blockerKey && (
            <p className="mt-1.5 text-caption-md-regular text-tertiary">
              {t("issue.looper.blocker_label")}: {t(overview.blockerKey, { role: waitingRole })}
            </p>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {primaryArtifact && (
              <a
                href={primaryArtifact.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-7 items-center gap-1 rounded-md border border-strong bg-surface-1 px-2 text-body-xs-medium text-secondary shadow-raised-100 hover:bg-surface-2"
              >
                {t(`issue.looper.overview.action.${overview.primaryArtifactType}`)}
                <ArrowUpRight className="size-3" />
              </a>
            )}
            {summary.permissions.can_stop && (
              <Button variant="secondary" size="sm" loading={isStopping} onClick={onStop}>
                <CircleStop className="size-3.5" />
                {t("issue.looper.stop")}
              </Button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
