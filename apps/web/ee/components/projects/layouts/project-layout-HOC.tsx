import { isEmpty } from "lodash-es";
import { observer } from "mobx-react";
import Image from "next/image";
// plane imports
import { EUserPermissionsLevel, PROJECT_TRACKER_ELEMENTS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { EUserProjectRoles } from "@plane/types";
// components
import { ComicBoxButton } from "@/components/empty-state/comic-box-button";
import { DetailedEmptyState } from "@/components/empty-state/detailed-empty-state-root";
import { GanttLayoutLoader } from "@/components/ui/loader/layouts/gantt-layout-loader";
import { KanbanLayoutLoader } from "@/components/ui/loader/layouts/kanban-layout-loader";
import { ListLayoutLoader } from "@/components/ui/loader/layouts/list-layout-loader";
import { ProjectsLoader } from "@/components/ui/loader/projects-loader";
// hooks
import { captureClick } from "@/helpers/event-tracker.helper";
import { useCommandPalette } from "@/hooks/store/use-command-palette";
import { useProject } from "@/hooks/store/use-project";
import { useUserPermissions } from "@/hooks/store/user";
import { useResolvedAssetPath } from "@/hooks/use-resolved-asset-path";
// plane web imports
import { useProjectFilter, useWorkspaceProjectStates } from "@/plane-web/hooks/store";
import { EProjectLayouts } from "@/plane-web/types/workspace-project-filters";

const ActiveLoader = (props: { layout: EProjectLayouts }) => {
  const { layout } = props;
  switch (layout) {
    case EProjectLayouts.TABLE:
      return <ListLayoutLoader />;
    case EProjectLayouts.BOARD:
      return <KanbanLayoutLoader />;
    case EProjectLayouts.GALLERY:
      return <ProjectsLoader />;
    case EProjectLayouts.TIMELINE:
      return <GanttLayoutLoader />;
    default:
      return null;
  }
};

interface Props {
  children: string | React.ReactNode | React.ReactNode[];
  layout: EProjectLayouts;
}

export const ProjectLayoutHOC = observer((props: Props) => {
  const { layout } = props;
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { fetchStatus } = useProject();
  const { loading } = useProjectFilter();
  const { getFilteredProjectsByLayout } = useProjectFilter();
  const { projectStates } = useWorkspaceProjectStates();
  const { toggleCreateProjectModal } = useCommandPalette();
  // derived values
  const filteredProjectIds = getFilteredProjectsByLayout(EProjectLayouts.GALLERY);
  const { allowPermissions } = useUserPermissions();
  // derived values
  const resolvedPath = useResolvedAssetPath({ basePath: "/empty-state/onboarding/projects" });
  const resolvedFiltersImage = useResolvedAssetPath({ basePath: "/empty-state/project/all-filters", extension: "svg" });

  const hasProjectMemberPermissions = allowPermissions(
    [EUserProjectRoles.ADMIN, EUserProjectRoles.MEMBER],
    EUserPermissionsLevel.WORKSPACE
  );

  if (loading || isEmpty(projectStates) || fetchStatus !== "complete") {
    return <ActiveLoader layout={layout} />;
  }
  if (!filteredProjectIds) {
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
              captureClick({
                elementName: PROJECT_TRACKER_ELEMENTS.EMPTY_STATE_CREATE_PROJECT_BUTTON,
              });
              toggleCreateProjectModal(true);
            }}
            disabled={!hasProjectMemberPermissions}
          />
        }
      />
    );
  }
  if (filteredProjectIds.length === 0) {
    return (
      <div className="grid h-full w-full place-items-center">
        <div className="text-center">
          <Image src={resolvedFiltersImage} className="mx-auto h-36 w-36 sm:h-48 sm:w-48" alt="No matching projects" />
          <h5 className="mb-1 mt-7 text-xl font-medium">No matching projects</h5>
          <p className="whitespace-pre-line text-base text-custom-text-400">
            {`No projects detected with the matching\ncriteria. Create a new project instead`}
          </p>
        </div>
      </div>
    );
  }
  return <>{props.children}</>;
});
