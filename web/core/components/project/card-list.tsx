import { observer } from "mobx-react";
import Image from "next/image";
import { EUserPermissionsLevel } from "@plane/constants";
// components
import { ContentWrapper } from "@plane/ui";
import { ComicBoxButton, DetailedEmptyState } from "@/components/empty-state";
import { ProjectCard } from "@/components/project";
import { ProjectsLoader } from "@/components/ui";
// hooks
import { useCommandPalette, useEventTracker, useProject, useProjectFilter, useUserPermissions } from "@/hooks/store";
import { useResolvedAssetPath } from "@/hooks/use-resolved-asset-path";
// plane-web
import { EUserPermissions } from "@/plane-web/constants";
// assets
import AllFiltersImage from "@/public/empty-state/project/all-filters.svg";
import NameFilterImage from "@/public/empty-state/project/name-filter.svg";

type TProjectCardListProps = {
  totalProjectIds?: string[];
  filteredProjectIds?: string[];
};

export const ProjectCardList = observer((props: TProjectCardListProps) => {
  const { totalProjectIds: totalProjectIdsProps, filteredProjectIds: filteredProjectIdsProps } = props;
  // store hooks
  const { toggleCreateProjectModal } = useCommandPalette();
  const { setTrackElement } = useEventTracker();
  const {
    workspaceProjectIds: storeWorkspaceProjectIds,
    filteredProjectIds: storeFilteredProjectIds,
    getProjectById,
    loader,
  } = useProject();
  const { searchQuery, currentWorkspaceDisplayFilters } = useProjectFilter();
  const { allowPermissions } = useUserPermissions();

  // helper hooks
  const resolvedPath = useResolvedAssetPath({ basePath: "/empty-state/onboarding/projects" });

  // derived values
  const workspaceProjectIds = totalProjectIdsProps ?? storeWorkspaceProjectIds;
  const filteredProjectIds = filteredProjectIdsProps ?? storeFilteredProjectIds;

  // permissions
  const canPerformEmptyStateActions = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.WORKSPACE
  );

  if (!filteredProjectIds || !workspaceProjectIds || loader) return <ProjectsLoader />;

  if (workspaceProjectIds?.length === 0 && !currentWorkspaceDisplayFilters?.archived_projects)
    return (
      <DetailedEmptyState
        title="No active projects"
        description="Think of each project as the parent for goal-oriented work. Projects are where Jobs, Cycles, and Modules live and, along with your colleagues, help you achieve that goal. Create a new project or filter for archived projects."
        assetPath={resolvedPath}
        customPrimaryButton={
          <ComicBoxButton
            label="Start your first project"
            title="Everything starts with a project in Plane"
            description="A project could be a product’s roadmap, a marketing campaign, or launching a new car."
            onClick={() => {
              setTrackElement("Project empty state");
              toggleCreateProjectModal(true);
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
            src={searchQuery.trim() === "" ? AllFiltersImage : NameFilterImage}
            className="mx-auto h-36 w-36 sm:h-48 sm:w-48"
            alt="No matching projects"
          />
          <h5 className="mb-1 mt-7 text-xl font-medium">No matching projects</h5>
          <p className="whitespace-pre-line text-base text-custom-text-400">
            {searchQuery.trim() === ""
              ? "Remove the filters to see all projects"
              : "No projects detected with the matching criteria.\nCreate a new project instead"}
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
