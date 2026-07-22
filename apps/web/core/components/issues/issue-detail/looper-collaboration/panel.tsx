import { useState } from "react";
import { Bot, Check, Circle, ExternalLink, Laptop } from "lucide-react";

import { useTranslation } from "@plane/i18n";
import { Badge } from "@plane/propel/badge";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { Collapsible, CollapsibleButton } from "@plane/ui";
import { cn } from "@plane/utils";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { LooperCollaborationService } from "@/services/issue";

import { createClientMessageId } from "./client-message-id";
import { ConnectLooperModal } from "./connect-looper-modal";
import { LooperDeliveryOverviewCard } from "./delivery-overview-card";
import { LooperRecentActivity } from "./recent-activity";
import { LooperRoleThread } from "./role-thread";
import type { TLooperSummary } from "./types";
import { useLooperSummary } from "./use-looper-summary";

type Props = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
};

const looperCollaborationService = new LooperCollaborationService();

const statusBadgeVariant = (summary: TLooperSummary) => {
  if (summary.dispatch?.health !== "ok") return "warning" as const;
  if (summary.dispatch?.state === "completed") return "success" as const;
  return "brand" as const;
};

export function LooperCollaborationPanel(props: Props) {
  const { workspaceSlug, projectId, issueId } = props;
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(true);
  const [pendingAction, setPendingAction] = useState<"dispatch" | "stop" | "release" | null>(null);
  const [confirmDispatch, setConfirmDispatch] = useState(false);
  const [showRelease, setShowRelease] = useState(false);
  const [releaseReason, setReleaseReason] = useState("");
  const [isConnectOpen, setIsConnectOpen] = useState(false);
  const { data: summary, mutate } = useLooperSummary(workspaceSlug, projectId, issueId);
  const { toggleIssueLinkModal, setIssueLinkData } = useIssueDetail();

  if (!summary || summary.visibility !== "visible") return null;

  const runAction = async (action: "dispatch" | "stop" | "release") => {
    if (action === "release" && !releaseReason.trim()) return;
    setPendingAction(action);
    try {
      if (action === "dispatch") {
        await looperCollaborationService.dispatch(workspaceSlug, projectId, issueId, crypto.randomUUID());
        setConfirmDispatch(false);
      } else if (summary.dispatch) {
        await looperCollaborationService.ownerAction(
          workspaceSlug,
          projectId,
          summary.dispatch.id,
          action,
          releaseReason.trim()
        );
        setShowRelease(false);
        setReleaseReason("");
      }
      await mutate();
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("toast.success"),
        message: action === "dispatch" ? t("issue.looper.dispatch_success") : t(`issue.looper.${action}`),
      });
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("common.error.label"),
        message: t("issue.looper.action_failed"),
      });
    } finally {
      setPendingAction(null);
    }
  };

  const submitReply = async (roleRequestId: string, message: string) => {
    try {
      await looperCollaborationService.replyToRoleRequest(
        workspaceSlug,
        projectId,
        roleRequestId,
        message,
        createClientMessageId()
      );
      await mutate();
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("toast.success"),
        message: t("issue.looper.thread.reply_success"),
      });
      return true;
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("common.error.label"),
        message: t("issue.looper.action_failed"),
      });
      return false;
    }
  };

  const openProductSpecLinkModal = () => {
    setIssueLinkData(null);
    toggleIssueLinkModal(true);
  };

  if (!summary.dispatch) {
    const targetOwner = summary.target?.owner.display_name ?? t("issue.looper.unknown_owner");
    const targetNode = summary.target?.node.name ?? "Looper";
    return (
      <div className="overflow-hidden rounded-md border border-subtle bg-surface-1">
        <div className="flex min-h-11 items-center gap-2 border-b border-subtle px-3">
          <Bot className="size-4 text-accent-primary" />
          <span className="text-body-sm-medium text-primary">{t("issue.looper.title")}</span>
          <span className="ml-auto">
            <Badge variant={summary.permissions.can_dispatch ? "brand" : "neutral"}>
              {summary.permissions.can_dispatch ? t("issue.looper.pending") : t("issue.looper.read_only")}
            </Badge>
          </span>
        </div>
        <div className="space-y-3 px-3 py-4">
          {summary.target && (
            <div className="flex items-center gap-2 rounded-md border border-subtle bg-layer-1 px-3 py-2.5">
              <span className="grid size-7 place-items-center rounded-full bg-accent-primary text-caption-sm-medium text-on-color">
                {targetOwner.slice(0, 1)}
              </span>
              <div className="min-w-0 grow">
                <div className="truncate text-body-xs-medium text-primary">
                  {t("issue.looper.source", { owner: targetOwner })}
                </div>
                <div className="truncate text-caption-sm-regular text-tertiary">
                  {targetNode} · {t(`issue.looper.live_status.${summary.target.node.live_status}`)}
                </div>
              </div>
            </div>
          )}

          {confirmDispatch && summary.target ? (
            <div className="rounded-md border border-accent-subtle bg-accent-subtle px-3 py-3">
              <div className="text-body-xs-medium text-primary">{t("issue.looper.dispatch_confirm_title")}</div>
              <p className="mt-1 text-caption-md-regular text-secondary">
                {t("issue.looper.dispatch_confirm_body", { owner: targetOwner, node: targetNode })}
              </p>
              <div className="mt-3 flex justify-end gap-2">
                <Button variant="secondary" size="sm" onClick={() => setConfirmDispatch(false)}>
                  {t("common.cancel")}
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  loading={pendingAction === "dispatch"}
                  onClick={() => void runAction("dispatch")}
                >
                  {t("common.confirm")}
                </Button>
              </div>
            </div>
          ) : summary.permissions.can_dispatch ? (
            <Button variant="primary" size="sm" onClick={() => setConfirmDispatch(true)}>
              {t("issue.looper.dispatch_to_mine")}
            </Button>
          ) : summary.empty_reason === "owner_binding_required" ? (
            <div className="rounded-md border border-subtle bg-layer-1 px-3 py-3">
              <div className="text-body-xs-medium text-primary">
                {t("issue.looper.empty_reason.owner_binding_required")}
              </div>
              <p className="mt-1 text-caption-md-regular text-secondary">{t("issue.looper.connect.cta_hint")}</p>
              <Button className="mt-3" variant="primary" size="sm" onClick={() => setIsConnectOpen(true)}>
                <Laptop className="size-3.5" aria-hidden="true" />
                {t("issue.looper.connect.cta")}
              </Button>
            </div>
          ) : summary.empty_reason ? (
            <p className="text-caption-md-regular text-tertiary">
              {t(`issue.looper.empty_reason.${summary.empty_reason}`)}
            </p>
          ) : null}
        </div>

        <ConnectLooperModal
          isOpen={isConnectOpen}
          onClose={() => setIsConnectOpen(false)}
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          onConnected={() => void mutate()}
        />
      </div>
    );
  }

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

        <LooperDeliveryOverviewCard
          summary={summary}
          isStopping={pendingAction === "stop"}
          onStop={() => void runAction("stop")}
        />

        <div>
          <div className="mb-2 flex items-center justify-between text-caption-sm-regular text-tertiary">
            <span>{t("issue.looper.role_collaboration")}</span>
            <span>{t("issue.looper.role_policy", { revision: summary.dispatch.role_policy_revision })}</span>
          </div>
          <div className="divide-y divide-subtle overflow-hidden rounded-md border border-subtle">
            {summary.roles?.map((role) => (
              <LooperRoleThread
                key={role.role}
                role={role}
                nodeLiveStatus={summary.dispatch?.node.live_status ?? "unavailable"}
                onReply={submitReply}
                onLinkProductSpec={openProductSpecLinkModal}
              />
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

        {summary.recent_events && summary.recent_events.length > 0 && (
          <LooperRecentActivity events={summary.recent_events} />
        )}

        {summary.permissions.can_release && (
          <div className="space-y-2 border-t border-subtle pt-3">
            <div className="flex justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => setShowRelease((value) => !value)}>
                {t("issue.looper.release")}
              </Button>
            </div>
            {showRelease && (
              <div className="rounded-md border border-subtle bg-layer-1 p-2.5">
                <input
                  value={releaseReason}
                  onChange={(event) => setReleaseReason(event.target.value)}
                  placeholder={t("issue.looper.release_reason")}
                  className="focus:border-accent-primary h-8 w-full rounded-md border border-subtle bg-surface-1 px-2 text-body-xs-regular text-primary outline-none"
                />
                <div className="mt-2 flex justify-end gap-2">
                  <Button variant="secondary" size="sm" onClick={() => setShowRelease(false)}>
                    {t("common.cancel")}
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={!releaseReason.trim()}
                    loading={pendingAction === "release"}
                    onClick={() => void runAction("release")}
                  >
                    {t("issue.looper.release")}
                  </Button>
                </div>
              </div>
            )}
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
