import { FC, ReactNode } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import useSWR from "swr";
import { observer } from "mobx-react-lite";
// hooks
import { useLabel, useMember, useProject, useUser } from "hooks/store";
// icons
import { Button, Spinner } from "@plane/ui";

export interface IWorkspaceAuthWrapper {
  children: ReactNode;
}

export const WorkspaceAuthWrapper: FC<IWorkspaceAuthWrapper> = observer((props) => {
  const { children } = props;
  // store hooks
  const { membership } = useUser();
  const { fetchProjects } = useProject();
  const {
    workspace: { fetchWorkspaceMembers },
  } = useMember();
  // router
  const router = useRouter();
  const { workspaceSlug } = router.query;
  // fetching user workspace information
  useSWR(
    workspaceSlug ? `WORKSPACE_MEMBERS_ME_${workspaceSlug}` : null,
    workspaceSlug ? () => membership.fetchUserWorkspaceInfo(workspaceSlug.toString()) : null
  );
  // fetching workspace projects
  useSWR(
    workspaceSlug ? `WORKSPACE_PROJECTS_${workspaceSlug}` : null,
    workspaceSlug ? () => fetchProjects(workspaceSlug.toString()) : null
  );
  // fetch workspace members
  useSWR(
    workspaceSlug ? `WORKSPACE_MEMBERS_${workspaceSlug}` : null,
    workspaceSlug ? () => fetchWorkspaceMembers(workspaceSlug.toString()) : null
  );
  // fetch workspace user projects role
  useSWR(
    workspaceSlug ? `WORKSPACE_PROJECTS_ROLE_${workspaceSlug}` : null,
    workspaceSlug ? () => membership.fetchUserWorkspaceProjectsRole(workspaceSlug.toString()) : null
  );

  // while data is being loaded
  if (!membership.currentWorkspaceMemberInfo && membership.hasPermissionToCurrentWorkspace === undefined) {
    return (
      <div className="grid h-screen place-items-center bg-custom-background-100 p-4">
        <div className="flex flex-col items-center gap-3 text-center">
          <Spinner />
        </div>
      </div>
    );
  }
  // while user does not have access to view that workspace
  if (
    membership.hasPermissionToCurrentWorkspace !== undefined &&
    membership.hasPermissionToCurrentWorkspace === false
  ) {
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
                <span>
                  <Button variant="neutral-primary" size="sm">
                    Check pending invites
                  </Button>
                </span>
              </Link>
              <Link href="/create-workspace">
                <span>
                  <Button variant="primary" size="sm">
                    Create new workspace
                  </Button>
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
});
