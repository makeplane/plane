import { isEmpty } from "lodash-es";
import { observer } from "mobx-react";
// plane imports
import { EUserPermissionsLevel, EUserPermissions, PROJECT_TRACKER_ELEMENTS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { EmptyStateDetailed } from "@plane/propel/empty-state";
import { ContentWrapper } from "@plane/ui";
// components
import { calculateTotalFilters } from "@plane/utils";
import { ProjectsLoader } from "@/components/ui/loader/projects-loader";
import { captureClick } from "@/helpers/event-tracker.helper";
// hooks
import { useCommandPalette } from "@/hooks/store/use-command-palette";
import { useProject } from "@/hooks/store/use-project";
import { useProjectFilter } from "@/hooks/store/use-project-filter";
import { useUserPermissions } from "@/hooks/store/user";
// local imports
import { ProjectCard } from "./card";

type TProjectCardListProps = {
  totalProjectIds?: string[];
  filteredProjectIds?: string[];
};

export const ProjectCardList = observer((props: TProjectCardListProps) => {
  const { totalProjectIds: totalProjectIdsProps, filteredProjectIds: filteredProjectIdsProps } = props;
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { toggleCreateProjectModal } = useCommandPalette();
  const {
    loader,
    fetchStatus,
    workspaceProjectIds: storeWorkspaceProjectIds,
    filteredProjectIds: storeFilteredProjectIds,
    getProjectById,
  } = useProject();
  const { currentWorkspaceDisplayFilters, currentWorkspaceFilters } = useProjectFilter();
  const { allowPermissions } = useUserPermissions();

  // derived values
  const workspaceProjectIds = totalProjectIdsProps ?? storeWorkspaceProjectIds;
  const filteredProjectIds = filteredProjectIdsProps ?? storeFilteredProjectIds;

  // permissions
  const canPerformEmptyStateActions = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.WORKSPACE
  );

  if (!filteredProjectIds || !workspaceProjectIds || loader === "init-loader" || fetchStatus !== "complete")
    return <ProjectsLoader />;

  if (workspaceProjectIds?.length === 0 && !currentWorkspaceDisplayFilters?.archived_projects)
    return (
      <EmptyStateDetailed
        title={t("workspace_projects.empty_state.general.title")}
        description={t("workspace_projects.empty_state.general.description")}
        assetKey="project"
        assetClassName="size-40"
        actions={[
          {
            label: t("workspace_projects.empty_state.general.primary_button.text"),
            onClick: () => {
              toggleCreateProjectModal(true);
              captureClick({ elementName: PROJECT_TRACKER_ELEMENTS.EMPTY_STATE_CREATE_PROJECT_BUTTON });
            },
            disabled: !canPerformEmptyStateActions,
            variant: "primary",
          },
        ]}
      />
    );

  if (filteredProjectIds.length === 0)
    return (
      <EmptyStateDetailed
        title={
          currentWorkspaceDisplayFilters?.archived_projects &&
          calculateTotalFilters(currentWorkspaceFilters ?? {}) === 0
            ? t("workspace.projects_archived.title")
            : t("common.search.title")
        }
        description={
          currentWorkspaceDisplayFilters?.archived_projects &&
          calculateTotalFilters(currentWorkspaceFilters ?? {}) === 0
            ? t("workspace.projects_archived.description")
            : t("common.search.description")
        }
        assetKey="project"
        assetClassName="size-40"
      />
    );

  return (
    <ContentWrapper>
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
        {filteredProjectIds.map((projectId) => {
          const projectDetails = getProjectById(projectId);
          if (!projectDetails) return;
          return <ProjectCard key={projectDetails.id} project={projectDetails} />;
        })}
      </div>
    </ContentWrapper>
  );
});
