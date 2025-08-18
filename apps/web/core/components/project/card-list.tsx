import { observer } from "mobx-react";
import Image from "next/image";
// plane imports
import { EUserPermissionsLevel, EUserPermissions, PROJECT_TRACKER_ELEMENTS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { ContentWrapper } from "@plane/ui";
// components
import { ComicBoxButton } from "@/components/empty-state/comic-box-button";
import { DetailedEmptyState } from "@/components/empty-state/detailed-empty-state-root";
import { ProjectsLoader } from "@/components/ui/loader/projects-loader";
import { captureClick } from "@/helpers/event-tracker.helper";
// hooks
import { useCommandPalette } from "@/hooks/store/use-command-palette";
import { useProject } from "@/hooks/store/use-project";
import { useProjectFilter } from "@/hooks/store/use-project-filter";
import { useUserPermissions } from "@/hooks/store/user";
import { useResolvedAssetPath } from "@/hooks/use-resolved-asset-path";
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
  const { searchQuery, currentWorkspaceDisplayFilters } = useProjectFilter();
  const { allowPermissions } = useUserPermissions();

  // helper hooks
  const resolvedPath = useResolvedAssetPath({ basePath: "/empty-state/onboarding/projects" });
  const resolvedFiltersImage = useResolvedAssetPath({
    basePath: "/empty-state/project/all-filters",
    extension: "svg",
  });
  const resolvedNameFilterImage = useResolvedAssetPath({
    basePath: "/empty-state/project/name-filter",
    extension: "svg",
  });

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
      <DetailedEmptyState
        title={t("workspace_projects.empty_state.general.title")}
        description={t("workspace_projects.empty_state.general.description")}
        assetPath={resolvedPath}
        customPrimaryButton={
          <ComicBoxButton
            label={t("workspace_projects.empty_state.general.primary_button.text")}
            title={t("workspace_projects.empty_state.general.primary_button.comic.title")}
            description={t("workspace_projects.empty_state.general.primary_button.comic.description")}
            onClick={() => {
              toggleCreateProjectModal(true);
              captureClick({ elementName: PROJECT_TRACKER_ELEMENTS.EMPTY_STATE_CREATE_PROJECT_BUTTON });
            }}
            disabled={!canPerformEmptyStateActions}
          />
        }
      />
    );

  if (filteredProjectIds.length === 0)
    return (
      <div className="grid h-full w-full place-items-center">
        <div className="text-center">
          <Image
            src={searchQuery.trim() === "" ? resolvedFiltersImage : resolvedNameFilterImage}
            className="mx-auto h-36 w-36 sm:h-48 sm:w-48"
            alt="No matching projects"
          />
          <h5 className="mb-1 mt-7 text-xl font-medium">{t("workspace_projects.empty_state.filter.title")}</h5>
          <p className="whitespace-pre-line text-base text-custom-text-400">
            {searchQuery.trim() === ""
              ? t("workspace_projects.empty_state.filter.description")
              : t("workspace_projects.empty_state.search.description")}
          </p>
        </div>
      </div>
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
