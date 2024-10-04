"use client";

import { FC, ReactNode } from "react";
import { observer } from "mobx-react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTheme } from "next-themes";
import useSWR from "swr";
import useSWRImmutable from "swr/immutable";

import { LogOut } from "lucide-react";
// hooks
import { Button, setToast, TOAST_TYPE, Tooltip } from "@plane/ui";
import { LogoSpinner } from "@/components/common";
import { useMember, useProject, useUser, useUserPermissions, useWorkspace } from "@/hooks/store";
import { useFavorite } from "@/hooks/store/use-favorite";
import { usePlatformOS } from "@/hooks/use-platform-os";
// local
import { persistence } from "@/local-db/storage.sqlite";
// constants
import { EUserPermissions, EUserPermissionsLevel } from "@/plane-web/constants/user-permissions";
// images
import PlaneBlackLogo from "@/public/plane-logos/black-horizontal-with-blue-logo.png";
import PlaneWhiteLogo from "@/public/plane-logos/white-horizontal-with-blue-logo.png";
import WorkSpaceNotAvailable from "@/public/workspace/workspace-not-available.png";

export interface IWorkspaceAuthWrapper {
  children: ReactNode;
}

export const WorkspaceAuthWrapper: FC<IWorkspaceAuthWrapper> = observer((props) => {
  const { children } = props;
  // router params
  const { workspaceSlug } = useParams();
  // next themes
  const { resolvedTheme } = useTheme();
  // store hooks
  const { signOut, data: currentUser } = useUser();
  const { fetchProjects } = useProject();
  const { fetchFavorite } = useFavorite();
  const {
    workspace: { fetchWorkspaceMembers },
  } = useMember();
  const { workspaces } = useWorkspace();
  const { isMobile } = usePlatformOS();
  const { loader, workspaceInfoBySlug, fetchUserWorkspaceInfo, fetchUserProjectPermissions, allowPermissions } =
    useUserPermissions();
  // derived values
  const canPerformWorkspaceMemberActions = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.WORKSPACE
  );

  const planeLogo = resolvedTheme === "dark" ? PlaneWhiteLogo : PlaneBlackLogo;
  const allWorkspaces = workspaces ? Object.values(workspaces) : undefined;
  const currentWorkspace =
    (allWorkspaces && allWorkspaces.find((workspace) => workspace?.slug === workspaceSlug)) || undefined;

  // fetching user workspace information
  useSWR(
    workspaceSlug && currentWorkspace ? `WORKSPACE_MEMBER_ME_INFORMATION_${workspaceSlug}` : null,
    workspaceSlug && currentWorkspace ? () => fetchUserWorkspaceInfo(workspaceSlug.toString()) : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );
  useSWR(
    workspaceSlug && currentWorkspace ? `WORKSPACE_PROJECTS_ROLES_INFORMATION_${workspaceSlug}` : null,
    workspaceSlug && currentWorkspace ? () => fetchUserProjectPermissions(workspaceSlug.toString()) : null,
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
  // fetch workspace favorite
  useSWR(
    workspaceSlug && currentWorkspace && canPerformWorkspaceMemberActions
      ? `WORKSPACE_FAVORITE_${workspaceSlug}`
      : null,
    workspaceSlug && currentWorkspace && canPerformWorkspaceMemberActions
      ? () => fetchFavorite(workspaceSlug.toString())
      : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  // initialize the local database
  const { isLoading: isDBInitializing } = useSWRImmutable(
    workspaceSlug ? `WORKSPACE_DB_${workspaceSlug}` : null,
    workspaceSlug
      ? async () => {
          // persistence.reset();
          await persistence.initialize(workspaceSlug.toString());
          // Load common data
          persistence.syncWorkspace();
          return true;
        }
      : null
  );

  const handleSignOut = async () => {
    await signOut().catch(() =>
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "Failed to sign out. Please try again.",
      })
    );
  };

  // derived values
  const currentWorkspaceInfo = workspaceSlug && workspaceInfoBySlug(workspaceSlug.toString());

  // if list of workspaces are not there then we have to render the spinner
  if (allWorkspaces === undefined || loader || isDBInitializing) {
    return (
      <div className="grid h-screen place-items-center bg-custom-background-100 p-4">
        <div className="flex flex-col items-center gap-3 text-center">
          <LogoSpinner />
        </div>
      </div>
    );
  }

  // if workspaces are there and we are trying to access the workspace that we are not part of then show the existing workspaces
  if (currentWorkspace === undefined && !currentWorkspaceInfo) {
    return (
      <div className="relative flex h-screen w-full flex-col items-center justify-center bg-custom-background-90 ">
        <div className="container relative mx-auto flex h-full w-full flex-col overflow-hidden overflow-y-auto px-5 py-14 md:px-0">
          <div className="relative flex flex-shrink-0 items-center justify-between gap-4">
            <div className="z-10 flex-shrink-0 bg-custom-background-90 py-4">
              <Image src={planeLogo} className="h-[26px] w-full" alt="Plane logo" />
            </div>
            <div className="relative flex items-center gap-2">
              <div className="text-sm font-medium">{currentUser?.email}</div>
              <div
                className="relative flex h-6 w-6 flex-shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded hover:bg-custom-background-80"
                onClick={handleSignOut}
              >
                <Tooltip tooltipContent={"Sign out"} position="top" className="ml-2" isMobile={isMobile}>
                  <LogOut size={14} />
                </Tooltip>
              </div>
            </div>
          </div>
          <div className="relative flex h-full w-full flex-grow flex-col items-center justify-center space-y-3">
            <div className="relative flex-shrink-0">
              <Image src={WorkSpaceNotAvailable} className="h-[220px] object-contain object-center" alt="Plane logo" />
            </div>
            <h3 className="text-center text-lg font-semibold">Workspace not found</h3>
            <p className="text-center text-sm text-custom-text-200">
              No workspace found with the URL. It may not exist or you lack authorization to view it.
            </p>
            <div className="flex items-center justify-center gap-2 pt-4">
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

          <div className="absolute bottom-0 left-4 top-0 w-0 bg-custom-background-80 md:w-0.5" />
        </div>
      </div>
    );
  }

  // while user does not have access to view that workspace
  if (currentWorkspaceInfo === undefined) {
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
