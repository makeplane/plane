import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { EUserPermissionsLevel, PROJECT_VIEW_TRACKER_ELEMENTS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { EUserProjectRoles } from "@plane/types";
// components
import { ListLayout } from "@/components/core/list";
import { ComicBoxButton, DetailedEmptyState, SimpleEmptyState } from "@/components/empty-state";
import { ViewListLoader } from "@/components/ui";
import { ProjectViewListItem } from "@/components/views";
// hooks
import { captureClick } from "@/helpers/event-tracker.helper";
import { useCommandPalette, useProjectView, useUserPermissions } from "@/hooks/store";
import { useResolvedAssetPath } from "@/hooks/use-resolved-asset-path";

export const ProjectViewsList = observer(() => {
  const { projectId } = useParams();
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { toggleCreateViewModal } = useCommandPalette();
  const { getProjectViews, getFilteredProjectViews, loader } = useProjectView();
  const { allowPermissions } = useUserPermissions();
  // derived values
  const projectViews = getProjectViews(projectId?.toString());
  const filteredProjectViews = getFilteredProjectViews(projectId?.toString());
  const canPerformEmptyStateActions = allowPermissions(
    [EUserProjectRoles.ADMIN, EUserProjectRoles.MEMBER, EUserProjectRoles.GUEST],
    EUserPermissionsLevel.PROJECT
  );
  const generalViewResolvedPath = useResolvedAssetPath({
    basePath: "/empty-state/onboarding/views",
  });
  const filteredViewResolvedPath = useResolvedAssetPath({
    basePath: "/empty-state/search/views",
  });

  if (loader || !projectViews || !filteredProjectViews) return <ViewListLoader />;

  if (filteredProjectViews.length === 0 && projectViews.length > 0) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <SimpleEmptyState
          title={t("project_views.empty_state.filter.title")}
          description={t("project_views.empty_state.filter.description")}
          assetPath={filteredViewResolvedPath}
        />
      </div>
    );
  }

  return (
    <>
      {filteredProjectViews.length > 0 ? (
        <div className="flex h-full w-full flex-col">
          <ListLayout>
            {filteredProjectViews.length > 0 ? (
              filteredProjectViews.map((view) => <ProjectViewListItem key={view.id} view={view} />)
            ) : (
              <p className="mt-10 text-center text-sm text-custom-text-300">No results found</p>
            )}
          </ListLayout>
        </div>
      ) : (
        <DetailedEmptyState
          title={t("project_views.empty_state.general.title")}
          description={t("project_views.empty_state.general.description")}
          assetPath={generalViewResolvedPath}
          customPrimaryButton={
            <ComicBoxButton
              label={t("project_views.empty_state.general.primary_button.text")}
              title={t("project_views.empty_state.general.primary_button.comic.title")}
              description={t("project_views.empty_state.general.primary_button.comic.description")}
              onClick={() => {
                toggleCreateViewModal(true);
                captureClick({ elementName: PROJECT_VIEW_TRACKER_ELEMENTS.EMPTY_STATE_CREATE_BUTTON });
              }}
              disabled={!canPerformEmptyStateActions}
            />
          }
        />
      )}
    </>
  );
});
