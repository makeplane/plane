import { FC, ReactNode } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
// components
import { JoinProject } from "@/components/auth-screens";
import { EmptyState, LogoSpinner } from "@/components/common";
// hooks
import {
  useEventTracker,
  useCycle,
  useProjectEstimates,
  useLabel,
  useMember,
  useModule,
  useProject,
  useProjectState,
  useProjectView,
  useCommandPalette,
  useUserPermissions,
} from "@/hooks/store";
// plane web constants
import { EUserPermissions, EUserPermissionsLevel } from "@/plane-web/constants/user-permissions";
// plane web hooks
import { useIssueTypes } from "@/plane-web/hooks/store";
// images
import emptyProject from "@/public/empty-state/onboarding/dashboard-light.webp";

interface IProjectAuthWrapper {
  children: ReactNode;
}

export const ProjectAuthWrapper: FC<IProjectAuthWrapper> = observer((props) => {
  const { children } = props;
  // store
  // const { fetchInboxes } = useInbox();
  const { toggleCreateProjectModal } = useCommandPalette();
  const { setTrackElement } = useEventTracker();
  const { fetchUserProjectInfo, allowPermissions, projectUserInfo } = useUserPermissions();
  const { loader, getProjectById, fetchProjectDetails } = useProject();
  const { fetchAllCycles } = useCycle();
  const { fetchModules } = useModule();
  const { fetchViews } = useProjectView();
  const {
    project: { fetchProjectMembers },
  } = useMember();
  const { fetchProjectStates } = useProjectState();
  const { fetchProjectLabels } = useLabel();
  const { getProjectEstimates } = useProjectEstimates();
  const { isIssueTypeEnabledForProject, fetchAllPropertiesAndOptions } = useIssueTypes();
  // router
  const { workspaceSlug, projectId } = useParams();

  const projectMemberInfo = projectUserInfo?.[workspaceSlug?.toString()]?.[projectId?.toString()];

  // fetching project details
  useSWR(
    workspaceSlug && projectId ? `PROJECT_DETAILS_${workspaceSlug.toString()}_${projectId.toString()}` : null,
    workspaceSlug && projectId ? () => fetchProjectDetails(workspaceSlug.toString(), projectId.toString()) : null
  );
  // fetching user project member information
  useSWR(
    workspaceSlug && projectId ? `PROJECT_ME_INFORMATION_${workspaceSlug}_${projectId}` : null,
    workspaceSlug && projectId ? () => fetchUserProjectInfo(workspaceSlug.toString(), projectId.toString()) : null
  );
  // fetching project labels
  useSWR(
    workspaceSlug && projectId ? `PROJECT_LABELS_${workspaceSlug}_${projectId}` : null,
    workspaceSlug && projectId ? () => fetchProjectLabels(workspaceSlug.toString(), projectId.toString()) : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );
  // fetching project members
  useSWR(
    workspaceSlug && projectId ? `PROJECT_MEMBERS_${workspaceSlug}_${projectId}` : null,
    workspaceSlug && projectId ? () => fetchProjectMembers(workspaceSlug.toString(), projectId.toString()) : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );
  // fetching project states
  useSWR(
    workspaceSlug && projectId ? `PROJECT_STATES_${workspaceSlug}_${projectId}` : null,
    workspaceSlug && projectId ? () => fetchProjectStates(workspaceSlug.toString(), projectId.toString()) : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );
  // fetching project estimates
  useSWR(
    workspaceSlug && projectId ? `PROJECT_ESTIMATES_${workspaceSlug}_${projectId}` : null,
    workspaceSlug && projectId ? () => getProjectEstimates(workspaceSlug.toString(), projectId.toString()) : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );
  // fetching project cycles
  useSWR(
    workspaceSlug && projectId ? `PROJECT_ALL_CYCLES_${workspaceSlug}_${projectId}` : null,
    workspaceSlug && projectId ? () => fetchAllCycles(workspaceSlug.toString(), projectId.toString()) : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );
  // fetching project modules
  useSWR(
    workspaceSlug && projectId ? `PROJECT_MODULES_${workspaceSlug}_${projectId}` : null,
    workspaceSlug && projectId ? () => fetchModules(workspaceSlug.toString(), projectId.toString()) : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );
  // fetching project views
  useSWR(
    workspaceSlug && projectId ? `PROJECT_VIEWS_${workspaceSlug}_${projectId}` : null,
    workspaceSlug && projectId ? () => fetchViews(workspaceSlug.toString(), projectId.toString()) : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  // derived values

  const isIssueTypeEnabled = isIssueTypeEnabledForProject(
    workspaceSlug?.toString(),
    projectId?.toString(),
    "ISSUE_TYPE_DISPLAY"
  );
  // fetching all issue types and properties
  useSWR(
    workspaceSlug && projectId && isIssueTypeEnabled
      ? `ISSUE_TYPES_AND_PROPERTIES_${workspaceSlug}_${projectId}_${isIssueTypeEnabled}`
      : null,
    workspaceSlug && projectId && isIssueTypeEnabled
      ? () => fetchAllPropertiesAndOptions(workspaceSlug.toString(), projectId.toString())
      : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );
  const hasPermissionToCurrentProject = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER, EUserPermissions.GUEST],
    EUserPermissionsLevel.PROJECT,
    workspaceSlug.toString(),
    projectId?.toString()
  );

  // check if the project member apis is loading
  if (!projectMemberInfo && projectId && hasPermissionToCurrentProject === null)
    return (
      <div className="grid h-screen place-items-center bg-custom-background-100 p-4">
        <div className="flex flex-col items-center gap-3 text-center">
          <LogoSpinner />
        </div>
      </div>
    );

  const projectExists = projectId ? getProjectById(projectId.toString()) : null;
  // check if the user don't have permission to access the project
  if (projectExists && projectId && hasPermissionToCurrentProject === false) return <JoinProject />;

  // check if the project info is not found.
  if (!loader && !projectExists && projectId && !!hasPermissionToCurrentProject === false)
    return (
      <div className="container grid h-screen place-items-center bg-custom-background-100">
        <EmptyState
          title="No such project exists"
          description="Try creating a new project"
          image={emptyProject}
          primaryButton={{
            text: "Create Project",
            onClick: () => {
              setTrackElement("Projects page empty state");
              toggleCreateProjectModal(true);
            },
          }}
        />
      </div>
    );

  return <>{children}</>;
});
