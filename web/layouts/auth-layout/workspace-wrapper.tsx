import { FC, ReactNode } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import useSWR from "swr";
import { observer } from "mobx-react-lite";
// icons
import { Spinner, PrimaryButton, SecondaryButton } from "components/ui";
// hooks
import { useMobxStore } from "lib/mobx/store-provider";

export interface IWorkspaceAuthWrapper {
  children: ReactNode;
  noHeader?: boolean;
  bg?: "primary" | "secondary";
  breadcrumbs?: JSX.Element;
  left?: JSX.Element;
  right?: JSX.Element;
}

export const WorkspaceAuthWrapper: FC<IWorkspaceAuthWrapper> = observer((props) => {
  const { children } = props;
  // store
  const { user: userStore, project: projectStore, workspace: workspaceStore } = useMobxStore();
  // router
  const router = useRouter();
  const { workspaceSlug } = router.query;
  // fetching user workspace information
  useSWR(
    workspaceSlug ? `WORKSPACE_MEMBERS_ME_${workspaceSlug}` : null,
    workspaceSlug ? () => userStore.fetchUserWorkspaceInfo(workspaceSlug.toString()) : null
  );
  // fetching workspace projects
  useSWR(
    workspaceSlug ? `WORKSPACE_PROJECTS_${workspaceSlug}` : null,
    workspaceSlug ? () => projectStore.fetchProjects(workspaceSlug.toString()) : null
  );
  // fetch workspace members
  useSWR(
    workspaceSlug ? `WORKSPACE_MEMBERS_${workspaceSlug}` : null,
    workspaceSlug ? () => workspaceStore.fetchWorkspaceMembers(workspaceSlug.toString()) : null
  );
  // fetch workspace labels
  useSWR(
    workspaceSlug ? `WORKSPACE_LABELS_${workspaceSlug}` : null,
    workspaceSlug ? () => workspaceStore.fetchWorkspaceLabels(workspaceSlug.toString()) : null
  );

  // console.log("workspaceSlug", workspaceSlug);

  // console.log("userStore.memberInfo", userStore.memberInfo);

  // while data is being loaded
  if (!userStore.memberInfo && userStore.hasPermissionToWorkspace === null) {
    return (
      <div className="grid h-screen place-items-center p-4 bg-custom-background-100">
        <div className="flex flex-col items-center gap-3 text-center">
          <Spinner />
        </div>
      </div>
    );
  }
  // while user does not have access to view that workspace
  if (userStore.hasPermissionToWorkspace !== null && userStore.hasPermissionToWorkspace === false) {
    return (
      <div className={`h-screen w-full overflow-hidden bg-custom-background-100`}>
        <div className="grid h-full place-items-center p-4">
          <div className="space-y-8 text-center">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Not Authorized!</h3>
              <p className="mx-auto w-1/2 text-sm text-custom-text-200">
                You{"'"}re not a member of this workspace. Please contact the workspace admin to get an invitation or
                check your pending invitations.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Link href="/invitations">
                <a>
                  <SecondaryButton>Check pending invites</SecondaryButton>
                </a>
              </Link>
              <Link href="/create-workspace">
                <a>
                  <PrimaryButton>Create new workspace</PrimaryButton>
                </a>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
});
