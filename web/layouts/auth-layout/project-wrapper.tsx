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
  const { user: userStore, project: projectStore } = useMobxStore();
  // router
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  // fetching user project member information
  useSWR(
    workspaceSlug && projectId ? `PROJECT_MEMBERS_ME_${workspaceSlug}_${projectId}` : null,
    workspaceSlug && projectId
      ? () => userStore.fetchUserProjectInfo(workspaceSlug.toString(), projectId.toString())
      : null
  );
  // fetching project labels
  useSWR(
    workspaceSlug && projectId ? `PROJECT_LABELS_${workspaceSlug}_${projectId}` : null,
    workspaceSlug && projectId
      ? () => projectStore.fetchProjectLabels(workspaceSlug.toString(), projectId.toString())
      : null
  );
  // fetching project members
  useSWR(
    workspaceSlug && projectId ? `PROJECT_MEMBERS_${workspaceSlug}_${projectId}` : null,
    workspaceSlug && projectId
      ? () => projectStore.fetchProjectMembers(workspaceSlug.toString(), projectId.toString())
      : null
  );
  // fetching project states
  useSWR(
    workspaceSlug && projectId ? `PROJECT_STATES_${workspaceSlug}_${projectId}` : null,
    workspaceSlug && projectId
      ? () => projectStore.fetchProjectStates(workspaceSlug.toString(), projectId.toString())
      : null
  );

  // check if the project member apis is loading
  if (!userStore.projectMemberInfo && userStore.hasPermissionToProject === null) {
    return (
      <div className="grid h-screen place-items-center p-4 bg-custom-background-100">
        <div className="flex flex-col items-center gap-3 text-center">
          <Spinner />
        </div>
      </div>
    );
  }

  // check if the user don't have permission to access the project
  if (userStore.hasPermissionToProject === false && !userStore.projectNotFound) {
    <JoinProject />;
  }

  // check if the project info is not found.
  if (userStore.hasPermissionToProject === false && userStore.projectNotFound) {
    <div className="container grid h-screen place-items-center bg-custom-background-100">
      <EmptyState
        title="No such project exists"
        description="Try creating a new project"
        image={emptyProject}
        primaryButton={{
          text: "Create Project",
          onClick: () => {
            const e = new KeyboardEvent("keydown", {
              key: "p",
            });
            document.dispatchEvent(e);
          },
        }}
      />
    </div>;
  }

  return <>{children}</>;
});
