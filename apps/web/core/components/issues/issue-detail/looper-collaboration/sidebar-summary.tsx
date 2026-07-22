import { useTranslation } from "@plane/i18n";
import {
  ActivityIcon,
  BlockerIcon,
  InProgressState,
  MonospaceIcon,
  UpdatesIcon,
  UserActivityIcon,
  UserCirclePropertyIcon,
} from "@plane/propel/icons";

import { SidebarPropertyListItem } from "@/components/common/layout/sidebar/property-list-item";

import { resolveDeliveryOverview } from "./delivery-overview-view";
import { useElapsedDuration } from "./use-elapsed-duration";
import { useLooperSummary } from "./use-looper-summary";

type Props = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
};

export function LooperCollaborationSidebar(props: Props) {
  const { workspaceSlug, projectId, issueId } = props;
  const { t } = useTranslation();
  const { data: summary } = useLooperSummary(workspaceSlug, projectId, issueId);
  const duration = useElapsedDuration(summary?.dispatch?.created_at);

  if (!summary || summary.visibility !== "visible" || !summary.dispatch) return null;

  const overview = resolveDeliveryOverview(summary);
  const waitingRole = summary.waiting_role ? t(`issue.looper.role.${summary.waiting_role}`) : "";

  return (
    <div className="mt-5 border-t-2 border-subtle-1 pt-5">
      <h5 className="mb-4 text-body-xs-medium">{t("issue.looper.title")}</h5>
      <div className="space-y-2.5">
        <SidebarPropertyListItem icon={UserCirclePropertyIcon} label={t("issue.looper.executor")}>
          <span className="truncate px-2 text-body-xs-regular text-secondary">
            {t("issue.looper.owner_looper", {
              owner: summary.dispatch.owner?.display_name ?? t("issue.looper.unknown_owner"),
            })}
          </span>
        </SidebarPropertyListItem>
        <SidebarPropertyListItem icon={InProgressState} label={t("issue.looper.node_status_label")}>
          <span className="inline-flex items-center gap-1.5 px-2 text-body-xs-regular text-secondary">
            <span
              className={`size-1.5 rounded-full ${summary.dispatch.node.live_status === "online" ? "bg-success-primary" : "bg-layer-4"}`}
            />
            {t(`issue.looper.live_status.${summary.dispatch.node.live_status}`)}
          </span>
        </SidebarPropertyListItem>
        <SidebarPropertyListItem icon={ActivityIcon} label={t("issue.looper.phase_label")}>
          <span className="truncate px-2 text-body-xs-regular text-secondary">
            {summary.current_phase ? t(`issue.looper.phase.${summary.current_phase}`) : t("issue.looper.pending")}
          </span>
        </SidebarPropertyListItem>
        <SidebarPropertyListItem icon={BlockerIcon} label={t("issue.looper.blocker_label")}>
          <span className="truncate px-2 text-body-xs-regular text-secondary">
            {overview.blockerKey ? t(overview.blockerKey, { role: waitingRole }) : t("issue.looper.blocker.none")}
          </span>
        </SidebarPropertyListItem>
        <SidebarPropertyListItem icon={MonospaceIcon} label={t("issue.looper.authority_label")}>
          <span className="font-mono truncate px-2 text-caption-md-regular text-secondary">
            {t("issue.looper.authority_short", {
              revision: summary.dispatch.revision,
              stateVersion: summary.dispatch.state_version,
            })}
          </span>
        </SidebarPropertyListItem>
        <SidebarPropertyListItem icon={UserActivityIcon} label={t("issue.looper.runtime_label")}>
          <span className="truncate px-2 text-body-xs-regular text-secondary">{duration ?? "—"}</span>
        </SidebarPropertyListItem>
        <SidebarPropertyListItem icon={UpdatesIcon} label={t("issue.looper.updated_label")}>
          <span className="truncate px-2 text-body-xs-regular text-secondary" suppressHydrationWarning>
            {new Date(summary.dispatch.updated_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        </SidebarPropertyListItem>
      </div>
    </div>
  );
}
