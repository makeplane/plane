// types
import { IGroupByColumn } from "@plane/types";
// components
import { Logo } from "@/components/common";
// store
import { store } from "@/lib/store-context";

export const getTeamProjectColumns = (): IGroupByColumn[] | undefined => {
  const { projectMap } = store.projectRoot.project;
  const { currentTeamProjectIds } = store.teamRoot.team;
  // Return undefined if no project ids
  if (!currentTeamProjectIds) return;
  // Map project ids to project columns
  return currentTeamProjectIds
    .map((projectId: string) => {
      const project = projectMap[projectId];
      if (!project) return;
      return {
        id: project.id,
        name: project.name,
        icon: (
          <div className="w-6 h-6 grid place-items-center flex-shrink-0">
            <Logo logo={project.logo_props} />
          </div>
        ),
        payload: { project_id: project.id },
      };
    })
    .filter((column) => column !== undefined) as IGroupByColumn[];
};
