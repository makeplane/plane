import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { EUserPermissionsLevel, WORK_ITEM_TRACKER_ELEMENTS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { EmptyStateDetailed } from "@plane/propel/empty-state";
import { EIssuesStoreType, EUserWorkspaceRoles } from "@plane/types";
// components
import { DetailedEmptyState } from "@/components/empty-state/detailed-empty-state-root";
// hooks
import { captureClick } from "@/helpers/event-tracker.helper";
import { useCommandPalette } from "@/hooks/store/use-command-palette";
import { useProject } from "@/hooks/store/use-project";
import { useUserPermissions } from "@/hooks/store/user";
import { useResolvedAssetPath } from "@/hooks/use-resolved-asset-path";

export const GlobalViewEmptyState: React.FC = observer(() => {
  const { globalViewId } = useParams();
  // plane imports
  const { t } = useTranslation();
  // store hooks
  const { workspaceProjectIds } = useProject();
  const { toggleCreateIssueModal, toggleCreateProjectModal } = useCommandPalette();
  const { allowPermissions } = useUserPermissions();
  // derived values
  const hasMemberLevelPermission = allowPermissions(
    [EUserWorkspaceRoles.ADMIN, EUserWorkspaceRoles.MEMBER],
    EUserPermissionsLevel.WORKSPACE
  );
  const isDefaultView = ["all-issues", "assigned", "created", "subscribed"].includes(globalViewId?.toString() ?? "");
  const currentView = isDefaultView && globalViewId ? globalViewId : "custom-view";
  const resolvedCurrentView = currentView?.toString();
  const globalViewsResolvedPath = useResolvedAssetPath({
    basePath: "/empty-state/all-issues/",
    additionalPath: resolvedCurrentView,
  });

  if (workspaceProjectIds?.length === 0) {
    return (
      <EmptyStateDetailed
        title={t("workspace_projects.empty_state.no_projects.title")}
        description={t("workspace_projects.empty_state.no_projects.description")}
        assetKey="project"
        assetClassName="size-40"
        actions={[
          {
            label: t("workspace_projects.empty_state.no_projects.primary_button.text"),
            onClick: () => {
              toggleCreateProjectModal(true);
              captureClick({ elementName: WORK_ITEM_TRACKER_ELEMENTS.EMPTY_STATE_ADD_BUTTON.GLOBAL_VIEW });
            },
            disabled: !hasMemberLevelPermission,
            variant: "primary",
          },
        ]}
      />
    );
  }

  return (
    <DetailedEmptyState
      size="sm"
      title={t(`workspace_views.empty_state.${resolvedCurrentView}.title`)}
      description={t(`workspace_views.empty_state.${resolvedCurrentView}.description`)}
      assetPath={globalViewsResolvedPath}
      primaryButton={
        ["subscribed", "custom-view"].includes(resolvedCurrentView) === false
          ? {
              text: t(`workspace_views.empty_state.${resolvedCurrentView}.primary_button.text`),
              onClick: () => {
                captureClick({ elementName: WORK_ITEM_TRACKER_ELEMENTS.EMPTY_STATE_ADD_BUTTON.GLOBAL_VIEW });
                toggleCreateIssueModal(true, EIssuesStoreType.PROJECT);
              },
              disabled: !hasMemberLevelPermission,
            }
          : undefined
      }
    />
  );
});
