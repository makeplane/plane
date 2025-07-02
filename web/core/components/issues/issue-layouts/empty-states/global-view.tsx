import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { EUserPermissionsLevel, WORK_ITEM_TRACKER_ELEMENTS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { EIssuesStoreType, EUserWorkspaceRoles } from "@plane/types";
// components
import { ComicBoxButton, DetailedEmptyState } from "@/components/empty-state";
// hooks
import { captureClick } from "@/helpers/event-tracker.helper";
import { useCommandPalette, useProject, useUserPermissions } from "@/hooks/store";
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
  const noProjectResolvedPath = useResolvedAssetPath({ basePath: "/empty-state/onboarding/projects" });
  const globalViewsResolvedPath = useResolvedAssetPath({
    basePath: "/empty-state/all-issues/",
    additionalPath: resolvedCurrentView,
  });

  if (workspaceProjectIds?.length === 0) {
    return (
      <DetailedEmptyState
        size="sm"
        title={t("workspace_projects.empty_state.no_projects.title")}
        description={t("workspace_projects.empty_state.no_projects.description")}
        assetPath={noProjectResolvedPath}
        customPrimaryButton={
          <ComicBoxButton
            label={t("workspace_projects.empty_state.no_projects.primary_button.text")}
            title={t("workspace_projects.empty_state.no_projects.primary_button.comic.title")}
            description={t("workspace_projects.empty_state.no_projects.primary_button.comic.description")}
            onClick={() => {
              toggleCreateProjectModal(true);
              captureClick({ elementName: WORK_ITEM_TRACKER_ELEMENTS.EMPTY_STATE_ADD_BUTTON.GLOBAL_VIEW });
            }}
            disabled={!hasMemberLevelPermission}
          />
        }
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
