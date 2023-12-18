import { FC, ReactNode } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import useSWR from "swr";
// hooks
import {
  useApplication,
  useCycle,
  useEstimate,
  useLabel,
  useMember,
  useModule,
  useProject,
  useProjectState,
  useProjectView,
  useUser,
} from "hooks/store";
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
<<<<<<< HEAD
=======
    user: { fetchUserProjectInfo, projectMemberInfo, hasPermissionToCurrentProject },
    project: { fetchProjectDetails, workspaceProjects },
    projectLabel: { fetchProjectLabels },
    projectMember: { fetchProjectMembers },
    projectState: { fetchProjectStates },
    projectEstimates: { fetchProjectEstimates },
    cycle: { fetchCycles },
    module: { fetchModules },
    projectViews: { fetchAllViews },
>>>>>>> a86dafc11c3e52699f4050e9d9c97393e29f0434
    inbox: { fetchInboxesList, isInboxEnabled },
  } = useMobxStore();
  const {
    commandPalette: { toggleCreateProjectModal },
  } = useApplication();
  const {
    membership: { fetchUserProjectInfo, projectMemberInfo, hasPermissionToProject },
  } = useUser();
  const { getProjectById, fetchProjectDetails } = useProject();
  const { fetchAllCycles } = useCycle();
  const { fetchModules } = useModule();
  const { fetchViews } = useProjectView();
  const {
    project: { fetchProjectMembers },
  } = useMember();
  const { fetchProjectStates } = useProjectState();
  const {
    project: { fetchProjectLabels },
  } = useLabel();
  const { fetchProjectEstimates } = useEstimate();
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
    workspaceSlug && projectId && hasPermissionToCurrentProject ? `PROJECT_LABELS_${workspaceSlug}_${projectId}` : null,
    workspaceSlug && projectId && hasPermissionToCurrentProject
      ? () => fetchProjectLabels(workspaceSlug.toString(), projectId.toString())
      : null
  );
  // fetching project members
  useSWR(
    workspaceSlug && projectId && hasPermissionToCurrentProject
      ? `PROJECT_MEMBERS_${workspaceSlug}_${projectId}`
      : null,
    workspaceSlug && projectId && hasPermissionToCurrentProject
      ? () => fetchProjectMembers(workspaceSlug.toString(), projectId.toString())
      : null
  );
  // fetching project states
  useSWR(
    workspaceSlug && projectId && hasPermissionToCurrentProject ? `PROJECT_STATES_${workspaceSlug}_${projectId}` : null,
    workspaceSlug && projectId && hasPermissionToCurrentProject
      ? () => fetchProjectStates(workspaceSlug.toString(), projectId.toString())
      : null
  );
  // fetching project estimates
  useSWR(
    workspaceSlug && projectId && hasPermissionToCurrentProject
      ? `PROJECT_ESTIMATES_${workspaceSlug}_${projectId}`
      : null,
    workspaceSlug && projectId && hasPermissionToCurrentProject
      ? () => fetchProjectEstimates(workspaceSlug.toString(), projectId.toString())
      : null
  );
  // fetching project cycles
  useSWR(
<<<<<<< HEAD
    workspaceSlug && projectId ? `PROJECT_ALL_CYCLES_${workspaceSlug}_${projectId}` : null,
    workspaceSlug && projectId ? () => fetchAllCycles(workspaceSlug.toString(), projectId.toString()) : null
=======
    workspaceSlug && projectId && hasPermissionToCurrentProject
      ? `PROJECT_ALL_CYCLES_${workspaceSlug}_${projectId}`
      : null,
    workspaceSlug && projectId && hasPermissionToCurrentProject
      ? () => fetchCycles(workspaceSlug.toString(), projectId.toString(), "all")
      : null
>>>>>>> a86dafc11c3e52699f4050e9d9c97393e29f0434
  );
  // fetching project modules
  useSWR(
    workspaceSlug && projectId && hasPermissionToCurrentProject
      ? `PROJECT_MODULES_${workspaceSlug}_${projectId}`
      : null,
    workspaceSlug && projectId && hasPermissionToCurrentProject
      ? () => fetchModules(workspaceSlug.toString(), projectId.toString())
      : null
  );
  // fetching project views
  useSWR(
<<<<<<< HEAD
    workspaceSlug && projectId ? `PROJECT_VIEWS_${workspaceSlug}_${projectId}` : null,
    workspaceSlug && projectId ? () => fetchViews(workspaceSlug.toString(), projectId.toString()) : null
=======
    workspaceSlug && projectId && hasPermissionToCurrentProject ? `PROJECT_VIEWS_${workspaceSlug}_${projectId}` : null,
    workspaceSlug && projectId && hasPermissionToCurrentProject
      ? () => fetchAllViews(workspaceSlug.toString(), projectId.toString())
      : null
>>>>>>> a86dafc11c3e52699f4050e9d9c97393e29f0434
  );
  // fetching project inboxes if inbox is enabled
  useSWR(
    workspaceSlug && projectId && hasPermissionToCurrentProject && isInboxEnabled
      ? `PROJECT_INBOXES_${workspaceSlug}_${projectId}`
      : null,
    workspaceSlug && projectId && hasPermissionToCurrentProject && isInboxEnabled
      ? () => fetchInboxesList(workspaceSlug.toString(), projectId.toString())
      : null,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  const projectExists = projectId ? getProjectById(projectId.toString()) : null;

  // check if the project member apis is loading
  if (!projectMemberInfo && projectId && hasPermissionToCurrentProject === null)
    return (
      <div className="grid h-screen place-items-center bg-custom-background-100 p-4">
        <div className="flex flex-col items-center gap-3 text-center">
          <Spinner />
        </div>
      </div>
    );

  // check if the user don't have permission to access the project
  if (projectExists && projectId && hasPermissionToCurrentProject === false) return <JoinProject />;

  // check if the project info is not found.
  if (!projectExists && projectId && hasPermissionToCurrentProject === false)
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
