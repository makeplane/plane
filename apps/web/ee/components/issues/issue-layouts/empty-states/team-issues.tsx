import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import {
  EUserPermissionsLevel,
  TEAMSPACE_WORK_ITEM_TRACKER_ELEMENTS,
  TEAMSPACE_WORK_ITEM_TRACKER_EVENTS,
} from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { EIssuesStoreType, EUserWorkspaceRoles } from "@plane/types";
// components
import { ComicBoxButton } from "@/components/empty-state/comic-box-button";
import { DetailedEmptyState } from "@/components/empty-state/detailed-empty-state-root";
// helpers
import { captureClick, captureError, captureSuccess } from "@/helpers/event-tracker.helper";
// hooks
import { useCommandPalette } from "@/hooks/store/use-command-palette";
import { useIssues } from "@/hooks/store/use-issues";
import { useUserPermissions } from "@/hooks/store/user";
import { useWorkItemFilterInstance } from "@/hooks/store/work-item-filters/use-work-item-filter-instance";
import { useResolvedAssetPath } from "@/hooks/use-resolved-asset-path";
// plane web imports
import { useTeamspaces } from "@/plane-web/hooks/store/teamspaces/use-teamspaces";

export const TeamEmptyState: React.FC = observer(() => {
  // router
  const { workspaceSlug: routerWorkspaceSlug, teamspaceId: routerTeamspaceId } = useParams();
  const workspaceSlug = routerWorkspaceSlug ? routerWorkspaceSlug.toString() : undefined;
  const teamspaceId = routerTeamspaceId ? routerTeamspaceId.toString() : undefined;
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { toggleCreateIssueModal } = useCommandPalette();
  const { issuesFilter } = useIssues(EIssuesStoreType.TEAM);
  const { allowPermissions } = useUserPermissions();
  const { getTeamspaceProjectIds } = useTeamspaces();
  // derived values
  const teamspaceWorkItemFilter = teamspaceId
    ? useWorkItemFilterInstance(EIssuesStoreType.TEAM, teamspaceId)
    : undefined;
  const teamspaceProjectIds = teamspaceId ? getTeamspaceProjectIds(teamspaceId) : [];
  const activeLayout = issuesFilter?.issueFilters?.displayFilters?.layout;
  const additionalPath = teamspaceWorkItemFilter?.hasActiveFilters ? (activeLayout ?? "list") : undefined;
  const hasWorkspaceMemberLevelPermissions = allowPermissions(
    [EUserWorkspaceRoles.ADMIN, EUserWorkspaceRoles.MEMBER],
    EUserPermissionsLevel.WORKSPACE
  );
  const emptyFilterResolvedPath = useResolvedAssetPath({
    basePath: "/empty-state/empty-filters/",
    additionalPath: additionalPath,
  });
  const teamIssuesResolvedPath = useResolvedAssetPath({
    basePath: "/empty-state/teams/issues",
  });

  const handleClearAllFilters = () => {
    if (!teamspaceWorkItemFilter || !teamspaceId) return;
    teamspaceWorkItemFilter
      ?.clearFilters()
      .then(() => {
        captureSuccess({
          eventName: TEAMSPACE_WORK_ITEM_TRACKER_EVENTS.EMPTY_STATE_CLEAR_FILTERS,
          payload: {
            teamspace_id: teamspaceId,
          },
        });
      })
      .catch(() => {
        captureError({
          eventName: TEAMSPACE_WORK_ITEM_TRACKER_EVENTS.EMPTY_STATE_CLEAR_FILTERS,
          payload: {
            teamspace_id: teamspaceId,
          },
        });
      });
  };

  if (!workspaceSlug || !teamspaceId) return null;

  return (
    <div className="relative h-full w-full overflow-y-auto">
      {teamspaceWorkItemFilter?.hasActiveFilters ? (
        <DetailedEmptyState
          title={t("teamspace_work_items.empty_state.work_items_empty_filter.title")}
          description={t("teamspace_work_items.empty_state.work_items_empty_filter.description")}
          assetPath={emptyFilterResolvedPath}
          secondaryButton={{
            text: t("teamspace_work_items.empty_state.work_items_empty_filter.secondary_button.text"),
            onClick: () => {
              captureClick({
                elementName: TEAMSPACE_WORK_ITEM_TRACKER_ELEMENTS.EMPTY_STATE_CLEAR_FILTERS_BUTTON,
              });
              handleClearAllFilters();
            },
            disabled: !hasWorkspaceMemberLevelPermissions || !teamspaceWorkItemFilter,
          }}
        />
      ) : (
        <DetailedEmptyState
          title={t("teamspace_work_items.empty_state.no_work_items.title")}
          description={t("teamspace_work_items.empty_state.no_work_items.description")}
          assetPath={teamIssuesResolvedPath}
          customPrimaryButton={
            <ComicBoxButton
              label={t("teamspace_work_items.empty_state.no_work_items.primary_button.text")}
              title={t("teamspace_work_items.empty_state.no_work_items.primary_button.comic.title")}
              description={t("teamspace_work_items.empty_state.no_work_items.primary_button.comic.description")}
              onClick={() => {
                captureClick({
                  elementName: TEAMSPACE_WORK_ITEM_TRACKER_ELEMENTS.EMPTY_STATE_ADD_WORK_ITEM_BUTTON,
                });
                toggleCreateIssueModal(true, EIssuesStoreType.TEAM, teamspaceProjectIds);
              }}
              disabled={!hasWorkspaceMemberLevelPermissions}
            />
          }
        />
      )}
    </div>
  );
});
