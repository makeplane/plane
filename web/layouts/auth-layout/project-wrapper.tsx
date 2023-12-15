import { FC, ReactNode } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import useSWR from "swr";
// hooks
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { Spinner } from "@plane/ui";
import { JoinProject } from "components/auth-screens";
import { EmptyState } from "components/common";
// images
import emptyProject from "public/empty-state/project.svg";

interface IProjectAuthWrapper {
  children: ReactNode;
}

export const ProjectAuthWrapper: FC<IProjectAuthWrapper> = observer((props) => {
  const { children } = props;
  // store
  const {
    user: { fetchUserProjectInfo, projectMemberInfo, hasPermissionToProject },
    project: { fetchProjectDetails, workspaceProjects },
    projectLabel: { fetchProjectLabels },
    projectMember: { fetchProjectMembers },
    projectState: { fetchProjectStates },
    projectEstimates: { fetchProjectEstimates },
    cycle: { fetchCycles },
    module: { fetchModules },
    projectViews: { fetchAllViews },
    inbox: { fetchInboxesList, isInboxEnabled },
    commandPalette: { toggleCreateProjectModal },
  } = useMobxStore();
  // router
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  // fetching project details
  useSWR(
    workspaceSlug && projectId ? `PROJECT_DETAILS_${workspaceSlug.toString()}_${projectId.toString()}` : null,
    workspaceSlug && projectId ? () => fetchProjectDetails(workspaceSlug.toString(), projectId.toString()) : null
  );
  // fetching user project member information
  useSWR(
    workspaceSlug && projectId ? `PROJECT_MEMBERS_ME_${workspaceSlug}_${projectId}` : null,
    workspaceSlug && projectId ? () => fetchUserProjectInfo(workspaceSlug.toString(), projectId.toString()) : null
  );
  // fetching project labels
  useSWR(
    workspaceSlug && projectId ? `PROJECT_LABELS_${workspaceSlug}_${projectId}` : null,
    workspaceSlug && projectId ? () => fetchProjectLabels(workspaceSlug.toString(), projectId.toString()) : null
  );
  // fetching project members
  useSWR(
    workspaceSlug && projectId ? `PROJECT_MEMBERS_${workspaceSlug}_${projectId}` : null,
    workspaceSlug && projectId ? () => fetchProjectMembers(workspaceSlug.toString(), projectId.toString()) : null
  );
  // fetching project states
  useSWR(
    workspaceSlug && projectId ? `PROJECT_STATES_${workspaceSlug}_${projectId}` : null,
    workspaceSlug && projectId ? () => fetchProjectStates(workspaceSlug.toString(), projectId.toString()) : null
  );
  // fetching project estimates
  useSWR(
    workspaceSlug && projectId ? `PROJECT_ESTIMATES_${workspaceSlug}_${projectId}` : null,
    workspaceSlug && projectId ? () => fetchProjectEstimates(workspaceSlug.toString(), projectId.toString()) : null
  );
  // fetching project cycles
  useSWR(
    workspaceSlug && projectId ? `PROJECT_ALL_CYCLES_${workspaceSlug}_${projectId}` : null,
    workspaceSlug && projectId ? () => fetchCycles(workspaceSlug.toString(), projectId.toString(), "all") : null
  );
  // fetching project modules
  useSWR(
    workspaceSlug && projectId ? `PROJECT_MODULES_${workspaceSlug}_${projectId}` : null,
    workspaceSlug && projectId ? () => fetchModules(workspaceSlug.toString(), projectId.toString()) : null
  );
  // fetching project views
  useSWR(
    workspaceSlug && projectId ? `PROJECT_VIEWS_${workspaceSlug}_${projectId}` : null,
    workspaceSlug && projectId ? () => fetchAllViews(workspaceSlug.toString(), projectId.toString()) : null
  );
  // TODO: fetching project pages
  // fetching project inboxes if inbox is enabled
  useSWR(
    workspaceSlug && projectId && isInboxEnabled ? `PROJECT_INBOXES_${workspaceSlug}_${projectId}` : null,
    workspaceSlug && projectId && isInboxEnabled
      ? () => fetchInboxesList(workspaceSlug.toString(), projectId.toString())
      : null,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  const projectsList = workspaceSlug ? workspaceProjects : null;
  const projectExists = projectId ? projectsList?.find((project) => project.id === projectId.toString()) : null;

  // check if the project member apis is loading
  if (!projectMemberInfo && projectId && hasPermissionToProject[projectId.toString()] === null)
    return (
      <div className="grid h-screen place-items-center bg-custom-background-100 p-4">
        <div className="flex flex-col items-center gap-3 text-center">
          <Spinner />
        </div>
      </div>
    );

  // check if the user don't have permission to access the project
  if (projectExists && projectId && hasPermissionToProject[projectId.toString()] === false) return <JoinProject />;

  // check if the project info is not found.
  if (!projectExists && projectId && hasPermissionToProject[projectId.toString()] === false)
    return (
      <div className="container grid h-screen place-items-center bg-custom-background-100">
        <EmptyState
          title="No such project exists"
          description="Try creating a new project"
          image={emptyProject}
          primaryButton={{
            text: "Create Project",
            onClick: () => toggleCreateProjectModal(true),
          }}
        />
      </div>
    );

  return <>{children}</>;
});
