import { useState } from "react";
import { Bot, Check, Circle, ExternalLink, TriangleAlert } from "lucide-react";

import { useTranslation } from "@plane/i18n";
import { Badge } from "@plane/propel/badge";
import { Collapsible, CollapsibleButton } from "@plane/ui";
import { cn } from "@plane/utils";

import type { TLooperRole, TLooperSummary } from "./types";
import { useLooperSummary } from "./use-looper-summary";

type Props = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
};

const ROLE_ACCENT: Record<TLooperRole, string> = {
  product: "bg-accent-primary",
  design: "bg-warning-primary",
  engineering: "bg-success-primary",
  qa: "bg-tertiary",
};

const roleBadgeVariant = (status: string) => {
  if (status === "completed") return "success" as const;
  if (status === "waiting") return "warning" as const;
  return "neutral" as const;
};

const statusBadgeVariant = (summary: TLooperSummary) => {
  if (summary.dispatch?.health !== "ok") return "warning" as const;
  if (summary.dispatch?.state === "completed") return "success" as const;
  return "brand" as const;
};

export function LooperCollaborationPanel(props: Props) {
  const { workspaceSlug, projectId, issueId } = props;
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(true);
  const { data: summary } = useLooperSummary(workspaceSlug, projectId, issueId);

  if (!summary || summary.visibility !== "visible" || !summary.dispatch) return null;

  const ownerName = summary.dispatch.owner?.display_name ?? t("issue.looper.unknown_owner");
  const waitingRole = summary.waiting_role ? t(`issue.looper.role.${summary.waiting_role}`) : null;
  const stateLabel =
    summary.dispatch.health !== "ok"
      ? t(`issue.looper.health.${summary.dispatch.health}`)
      : waitingRole
        ? t("issue.looper.waiting_for", { role: waitingRole })
        : t(`issue.looper.state.${summary.dispatch.state}`);

  return (
    <Collapsible
      isOpen={isOpen}
      onToggle={() => setIsOpen((value) => !value)}
      className="overflow-hidden rounded-md border border-subtle"
      buttonClassName="w-full"
      title={
        <CollapsibleButton
          isOpen={isOpen}
          title={
            <span className="flex items-center gap-2">
              <Bot className="size-4 text-accent-primary" />
              {t("issue.looper.title")}
            </span>
          }
          indicatorElement={<Badge variant={statusBadgeVariant(summary)}>{stateLabel}</Badge>}
          actionItemElement={
            summary.read_only ? (
              <span className="text-caption-sm-regular text-tertiary">{t("issue.looper.read_only")}</span>
            ) : null
          }
        />
      }
    >
      <div className="space-y-5 px-2.5 py-4">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-caption-md-regular text-tertiary">
          <span className="grid size-5 place-items-center rounded-full bg-accent-primary text-[10px] font-medium text-on-color">
            {ownerName.slice(0, 1)}
          </span>
          <span className="text-secondary">{t("issue.looper.source", { owner: ownerName })}</span>
          <span>·</span>
          <span>{summary.dispatch.node.name}</span>
          <span>·</span>
          <span>{t(`issue.looper.live_status.${summary.dispatch.node.live_status}`)}</span>
          <span className="ml-auto">
            {t("issue.looper.authority", {
              revision: summary.dispatch.revision,
              stateVersion: summary.dispatch.state_version,
            })}
          </span>
        </div>

        <div className="grid grid-cols-7 max-md:grid-cols-1" aria-label={t("issue.looper.phases")}>
          {summary.phases?.map((phase, index) => (
            <div
              key={phase.key}
              className="relative flex flex-col items-center gap-1 px-1 text-center max-md:min-h-9 max-md:items-start max-md:pl-7 max-md:text-left"
            >
              {index > 0 && (
                <span
                  className={cn(
                    "absolute top-1.5 right-1/2 h-px w-full bg-layer-3 max-md:top-0 max-md:right-auto max-md:bottom-0 max-md:left-1.5 max-md:h-full max-md:w-px",
                    phase.status === "completed" && "bg-success-primary"
                  )}
                />
              )}
              <span
                className={cn(
                  "relative z-[1] grid size-3 place-items-center rounded-full border border-subtle-1 bg-surface-1",
                  phase.status === "completed" && "border-success-primary bg-success-primary text-on-color",
                  phase.status === "current" && "border-accent-primary bg-accent-primary text-on-color"
                )}
              >
                {phase.status === "completed" ? <Check className="size-2" strokeWidth={3} /> : null}
              </span>
              <span
                className={cn("text-caption-sm-medium text-tertiary", phase.status === "current" && "text-primary")}
              >
                {t(`issue.looper.phase.${phase.key}`)}
              </span>
              <span className="text-caption-sm-regular text-placeholder">
                {t(`issue.looper.phase_status.${phase.status}`)}
              </span>
            </div>
          ))}
        </div>

        {(summary.current_question || summary.dispatch.health !== "ok") && (
          <div className="border-warning-subtle-1 rounded-md border bg-warning-subtle px-3 py-2.5">
            <div className="flex items-center gap-1.5 text-caption-sm-medium text-warning-primary">
              <TriangleAlert className="size-3.5" />
              {summary.dispatch.health !== "ok"
                ? t(`issue.looper.health.${summary.dispatch.health}`)
                : t("issue.looper.current_action")}
            </div>
            <p className="mt-1 text-body-xs-medium text-primary">
              {summary.current_question ?? t("issue.looper.health_action")}
            </p>
          </div>
        )}

        <div>
          <div className="mb-2 flex items-center justify-between text-caption-sm-regular text-tertiary">
            <span>{t("issue.looper.role_collaboration")}</span>
            <span>{t("issue.looper.role_policy", { revision: summary.dispatch.role_policy_revision })}</span>
          </div>
          <div className="divide-y divide-subtle overflow-hidden rounded-md border border-subtle">
            {summary.roles?.map((role) => (
              <div key={role.role} className="flex min-h-9 flex-wrap items-center gap-2 px-2.5 py-1.5">
                <span className={cn("h-4 w-0.5 rounded-full", ROLE_ACCENT[role.role])} />
                <span className="min-w-24 text-body-xs-medium text-primary">{t(`issue.looper.role.${role.role}`)}</span>
                <span className="min-w-0 grow truncate text-caption-md-regular text-tertiary">
                  {role.member?.display_name ?? t("issue.looper.unassigned")}
                </span>
                <Badge variant={roleBadgeVariant(role.status)} size="sm">
                  {role.status === "completed"
                    ? t("issue.looper.answered_count", { answered: role.answered_count, total: role.total_count })
                    : role.status === "waiting"
                      ? t("issue.looper.waiting_count", { count: role.open_count })
                      : t("issue.looper.pending")}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {summary.artifacts && summary.artifacts.length > 0 && (
          <div>
            <div className="mb-2 text-caption-sm-regular text-tertiary">{t("issue.looper.artifacts")}</div>
            <div className="flex flex-wrap gap-2">
              {summary.artifacts.map((artifact) => (
                <a
                  key={artifact.id}
                  href={artifact.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-7 items-center gap-1 rounded-md border border-strong bg-layer-2 px-2 text-body-xs-medium text-secondary shadow-raised-100 hover:bg-surface-2"
                >
                  {artifact.title}
                  <ExternalLink className="size-3" />
                </a>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-subtle pt-3 text-caption-sm-regular text-tertiary">
          <span suppressHydrationWarning>
            {t("issue.looper.updated_at", { time: new Date(summary.dispatch.updated_at).toLocaleTimeString() })}
          </span>
          <span className="flex items-center gap-1">
            <Circle className="size-2 fill-current" />
            {t("issue.looper.plane_is_authority")}
          </span>
        </div>
      </div>
    </Collapsible>
  );
}
