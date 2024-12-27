import isEmpty from "lodash/isEmpty";
import { observer } from "mobx-react";
import Image from "next/image";
import { EmptyState } from "@/components/empty-state";
import { GanttLayoutLoader, KanbanLayoutLoader, ListLayoutLoader, ProjectsLoader } from "@/components/ui";
import { EmptyStateType } from "@/constants/empty-state";
import { useCommandPalette, useEventTracker } from "@/hooks/store";
import { useProjectFilter, useWorkspaceProjectStates } from "@/plane-web/hooks/store";
import { EProjectLayouts } from "@/plane-web/types/workspace-project-filters";
import AllFiltersImage from "@/public/empty-state/project/all-filters.svg";

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
  children: string | JSX.Element | JSX.Element[];
  layout: EProjectLayouts;
}

export const ProjectLayoutHOC = observer((props: Props) => {
  const { layout } = props;
  const { loading } = useProjectFilter();
  const { getFilteredProjectsByLayout } = useProjectFilter();
  const { projectStates } = useWorkspaceProjectStates();

  const { setTrackElement } = useEventTracker();
  const { toggleCreateProjectModal } = useCommandPalette();
  const filteredProjectIds = getFilteredProjectsByLayout(EProjectLayouts.GALLERY);

  if (loading || isEmpty(projectStates)) {
    return <ActiveLoader layout={layout} />;
  }
  if (!filteredProjectIds) {
    return (
      <EmptyState
        type={EmptyStateType.WORKSPACE_PROJECTS}
        primaryButtonOnClick={() => {
          setTrackElement("Project empty state");
          toggleCreateProjectModal(true);
        }}
      />
    );
  }
  if (filteredProjectIds.length === 0) {
    return (
      <div className="grid h-full w-full place-items-center">
        <div className="text-center">
          <Image src={AllFiltersImage} className="mx-auto h-36 w-36 sm:h-48 sm:w-48" alt="No matching projects" />
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
