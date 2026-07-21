import { ActivityIcon, UserCirclePropertyIcon } from "@plane/propel/icons";
import { useTranslation } from "@plane/i18n";

import { SidebarPropertyListItem } from "@/components/common/layout/sidebar/property-list-item";

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

  if (!summary || summary.visibility !== "visible" || !summary.dispatch) return null;

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
        <SidebarPropertyListItem icon={ActivityIcon} label={t("issue.looper.phase_label")}>
          <span className="truncate px-2 text-body-xs-regular text-secondary">
            {summary.current_phase ? t(`issue.looper.phase.${summary.current_phase}`) : t("issue.looper.pending")}
          </span>
        </SidebarPropertyListItem>
      </div>
    </div>
  );
}
