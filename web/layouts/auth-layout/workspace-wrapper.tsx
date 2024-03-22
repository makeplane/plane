import { FC, ReactNode } from "react";
import { observer } from "mobx-react-lite";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useTheme } from "next-themes";
import useSWR, { mutate } from "swr";
import { LogOut } from "lucide-react";
// hooks
import { Button, Spinner, TOAST_TYPE, setToast, Tooltip } from "@plane/ui";
import { useMember, useProject, useUser, useWorkspace } from "@/hooks/store";
import { usePlatformOS } from "@/hooks/use-platform-os";
// images
import PlaneBlackLogo from "public/plane-logos/black-horizontal-with-blue-logo.svg";
import PlaneWhiteLogo from "public/plane-logos/white-horizontal-with-blue-logo.svg";
import WorkSpaceNotAvailable from "public/workspace/workspace-not-available.png";

export interface IWorkspaceAuthWrapper {
  children: ReactNode;
}

export const WorkspaceAuthWrapper: FC<IWorkspaceAuthWrapper> = observer((props) => {
  const { children } = props;
  // router
  const router = useRouter();
  const { workspaceSlug } = router.query;
  // next themes
  const { resolvedTheme, setTheme } = useTheme();
  // store hooks
  const { membership, signOut, currentUser } = useUser();
  const { fetchProjects } = useProject();
  const {
    workspace: { fetchWorkspaceMembers },
  } = useMember();
  const { workspaces } = useWorkspace();
  const { isMobile } = usePlatformOS();

  const planeLogo = resolvedTheme === "dark" ? PlaneWhiteLogo : PlaneBlackLogo;
  const allWorkspaces = workspaces ? Object.values(workspaces) : undefined;
  const currentWorkspace =
    (allWorkspaces && allWorkspaces.find((workspace) => workspace?.slug === workspaceSlug)) || undefined;

  // fetching user workspace information
  useSWR(
    workspaceSlug && currentWorkspace ? `WORKSPACE_MEMBERS_ME_${workspaceSlug}` : null,
    workspaceSlug && currentWorkspace ? () => membership.fetchUserWorkspaceInfo(workspaceSlug.toString()) : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );
  // fetching workspace projects
  useSWR(
    workspaceSlug && currentWorkspace ? `WORKSPACE_PROJECTS_${workspaceSlug}` : null,
    workspaceSlug && currentWorkspace ? () => fetchProjects(workspaceSlug.toString()) : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );
  // fetch workspace members
  useSWR(
    workspaceSlug && currentWorkspace ? `WORKSPACE_MEMBERS_${workspaceSlug}` : null,
    workspaceSlug && currentWorkspace ? () => fetchWorkspaceMembers(workspaceSlug.toString()) : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );
  // fetch workspace user projects role
  useSWR(
    workspaceSlug && currentWorkspace ? `WORKSPACE_PROJECTS_ROLE_${workspaceSlug}` : null,
    workspaceSlug && currentWorkspace
      ? () => membership.fetchUserWorkspaceProjectsRole(workspaceSlug.toString())
      : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  const handleSignOut = async () => {
    await signOut()
      .then(() => {
        mutate("CURRENT_USER_DETAILS", null);
        setTheme("system");
        router.push("/");
      })
      .catch(() =>
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: "Failed to sign out. Please try again.",
        })
      );
  };

  // if list of workspaces are not there then we have to render the spinner
  if (allWorkspaces === undefined) {
    return (
      <div className="grid h-screen place-items-center bg-custom-background-100 p-4">
        <div className="flex flex-col items-center gap-3 text-center">
          <Spinner />
        </div>
      </div>
    );
  }

  // if workspaces are there and we are trying to access the workspace that we are not part of then show the existing workspaces
  if (
    currentWorkspace === undefined &&
    !membership.currentWorkspaceMemberInfo &&
    membership.hasPermissionToCurrentWorkspace === undefined
  ) {
    return (
      <div className="relative w-full h-full flex flex-col justify-center items-center bg-custom-background-90">
        <div className="relative container px-5 md:px-0 w-full h-full mx-auto py-14 overflow-hidden overflow-y-auto flex flex-col">
          <div className="flex-shrink-0 relative flex justify-between items-center gap-4">
            <div className="flex-shrink-0 py-4 z-10 bg-custom-background-90">
              <Image src={planeLogo} className="h-[26px] w-full" alt="Plane logo" />
            </div>
            <div className="relative flex items-center gap-2">
              <div className="text-sm font-medium">{currentUser?.email}</div>
              <div
                className="relative flex-shrink-0 w-6 h-6 rounded overflow-hidden flex justify-center items-center cursor-pointer hover:bg-custom-background-80"
                onClick={handleSignOut}
              >
                <Tooltip tooltipContent={"Sign out"} position="top" className="ml-2" isMobile={isMobile}>
                  <LogOut size={14} />
                </Tooltip>
              </div>
            </div>
          </div>
          <div className="space-y-3 w-full h-full flex-grow relative flex flex-col justify-center items-center">
            <div className="flex-shrink-0 relative">
              <Image src={WorkSpaceNotAvailable} className="h-[220px] object-contain object-center" alt="Plane logo" />
            </div>
            <h3 className="text-lg font-semibold text-center">Workspace not found</h3>
            <p className="text-sm text-custom-text-200 text-center">
              No workspace found with the URL. It may not exist or you lack authorization to view it.
            </p>
            <div className="flex justify-center items-center gap-2 pt-4">
              {allWorkspaces && allWorkspaces.length > 1 && (
                <Link href="/">
                  <Button>Go Home</Button>
                </Link>
              )}
              <Link href="/profile">
                <Button variant="neutral-primary">Visit Profile</Button>
              </Link>
            </div>
          </div>

          <div className="absolute top-0 bottom-0 left-4 w-0 md:w-0.5 bg-custom-background-80" />
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
