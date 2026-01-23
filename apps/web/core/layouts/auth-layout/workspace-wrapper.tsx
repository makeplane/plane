import type { ReactNode } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import useSWR from "swr";
// ui
import { LogOut } from "lucide-react";
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { Button, getButtonStyling } from "@plane/propel/button";
import { PlaneLogo } from "@plane/propel/icons";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { Tooltip } from "@plane/propel/tooltip";
import { cn } from "@plane/utils";
// assets
import WorkSpaceNotAvailable from "@/app/assets/workspace/workspace-not-available.png?url";
// components
import { LogoSpinner } from "@/components/common/logo-spinner";
// constants
import {
  WORKSPACE_MEMBERS,
  WORKSPACE_PARTIAL_PROJECTS,
  WORKSPACE_MEMBER_ME_INFORMATION,
  WORKSPACE_PROJECTS_ROLES_INFORMATION,
  WORKSPACE_FAVORITE,
  WORKSPACE_STATES,
  WORKSPACE_SIDEBAR_PREFERENCES,
  WORKSPACE_PROJECT_NAVIGATION_PREFERENCES,
} from "@/constants/fetch-keys";
// hooks
import { useFavorite } from "@/hooks/store/use-favorite";
import { useMember } from "@/hooks/store/use-member";
import { useProject } from "@/hooks/store/use-project";
import { useProjectState } from "@/hooks/store/use-project-state";
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useUser, useUserPermissions } from "@/hooks/store/user";
import { usePlatformOS } from "@/hooks/use-platform-os";

interface IWorkspaceAuthWrapper {
  children: ReactNode;
  isLoading?: boolean;
}

export const WorkspaceAuthWrapper = observer(function WorkspaceAuthWrapper(props: IWorkspaceAuthWrapper) {
  const { children, isLoading: isParentLoading = false } = props;
  // router params
  const { workspaceSlug } = useParams();
  // store hooks
  const { signOut, data: currentUser } = useUser();
  const { fetchPartialProjects } = useProject();
  const { fetchFavorite } = useFavorite();
  const {
    workspace: { fetchWorkspaceMembers },
  } = useMember();
  const { workspaces, fetchSidebarNavigationPreferences, fetchProjectNavigationPreferences } = useWorkspace();
  const { isMobile } = usePlatformOS();
  const { loader, workspaceInfoBySlug, fetchUserWorkspaceInfo, fetchUserProjectPermissions, allowPermissions } =
    useUserPermissions();
  const { fetchWorkspaceStates } = useProjectState();
  // derived values
  const canPerformWorkspaceMemberActions = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.WORKSPACE
  );
  const allWorkspaces = workspaces ? Object.values(workspaces) : undefined;
  const currentWorkspace =
    (allWorkspaces && allWorkspaces.find((workspace) => workspace?.slug === workspaceSlug)) || undefined;
  const currentWorkspaceInfo = workspaceSlug && workspaceInfoBySlug(workspaceSlug.toString());

  // fetching user workspace information
  useSWR(
    workspaceSlug && currentWorkspace ? WORKSPACE_MEMBER_ME_INFORMATION(workspaceSlug.toString()) : null,
    workspaceSlug && currentWorkspace ? () => fetchUserWorkspaceInfo(workspaceSlug.toString()) : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );
  useSWR(
    workspaceSlug && currentWorkspace ? WORKSPACE_PROJECTS_ROLES_INFORMATION(workspaceSlug.toString()) : null,
    workspaceSlug && currentWorkspace ? () => fetchUserProjectPermissions(workspaceSlug.toString()) : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  // fetching workspace projects
  useSWR(
    workspaceSlug && currentWorkspace ? WORKSPACE_PARTIAL_PROJECTS(workspaceSlug.toString()) : null,
    workspaceSlug && currentWorkspace ? () => fetchPartialProjects(workspaceSlug.toString()) : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );
  // fetch workspace members
  useSWR(
    workspaceSlug && currentWorkspace ? WORKSPACE_MEMBERS(workspaceSlug.toString()) : null,
    workspaceSlug && currentWorkspace ? () => fetchWorkspaceMembers(workspaceSlug.toString()) : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );
  // fetch workspace favorite
  useSWR(
    workspaceSlug && currentWorkspace && canPerformWorkspaceMemberActions
      ? WORKSPACE_FAVORITE(workspaceSlug.toString())
      : null,
    workspaceSlug && currentWorkspace && canPerformWorkspaceMemberActions
      ? () => fetchFavorite(workspaceSlug.toString())
      : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );
  // fetch workspace states
  useSWR(
    workspaceSlug ? WORKSPACE_STATES(workspaceSlug.toString()) : null,
    workspaceSlug ? () => fetchWorkspaceStates(workspaceSlug.toString()) : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  // fetch workspace sidebar preferences
  useSWR(
    workspaceSlug ? WORKSPACE_SIDEBAR_PREFERENCES(workspaceSlug.toString()) : null,
    workspaceSlug ? () => fetchSidebarNavigationPreferences(workspaceSlug.toString()) : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  // fetch workspace project navigation preferences
  useSWR(
    workspaceSlug ? WORKSPACE_PROJECT_NAVIGATION_PREFERENCES(workspaceSlug.toString()) : null,
    workspaceSlug ? () => fetchProjectNavigationPreferences(workspaceSlug.toString()) : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
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

  // if list of workspaces are not there then we have to render the spinner
  if (isParentLoading || allWorkspaces === undefined || loader) {
    return (
      <div className="grid h-full place-items-center p-4 rounded-lg border border-subtle">
        <div className="flex flex-col items-center gap-3 text-center">
          <LogoSpinner />
        </div>
      </div>
    );
  }

  // if workspaces are there and we are trying to access the workspace that we are not part of then show the existing workspaces
  if (currentWorkspace === undefined && !currentWorkspaceInfo) {
    return (
      <div className="relative flex h-full w-full flex-col items-center justify-center bg-surface-2 ">
        <div className="container relative mx-auto flex h-full w-full flex-col overflow-hidden overflow-y-auto px-5 py-14 md:px-0">
          <div className="relative flex flex-shrink-0 items-center justify-between gap-4">
            <div className="z-10 flex-shrink-0 bg-surface-2 py-4">
              <PlaneLogo className="h-9 w-auto text-primary" />
            </div>
            <div className="relative flex items-center gap-2">
              <div className="text-13 font-medium">{currentUser?.email}</div>
              <div
                className="relative flex h-6 w-6 flex-shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-sm hover:bg-layer-1"
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
              <img src={WorkSpaceNotAvailable} className="h-[220px] object-contain object-center" alt="Plane logo" />
            </div>
            <h3 className="text-center text-16 font-semibold">Workspace not found</h3>
            <p className="text-center text-13 text-secondary">
              No workspace found with the URL. It may not exist or you lack authorization to view it.
            </p>
            <div className="flex items-center justify-center gap-2 pt-4">
              {allWorkspaces && allWorkspaces.length > 0 && (
                <Link href="/" className={cn(getButtonStyling("primary", "base"))}>
                  Go Home
                </Link>
              )}
              {allWorkspaces?.length > 0 && (
                <Link href="/settings/profile/general/" className={cn(getButtonStyling("secondary", "base"))}>
                  Visit Profile
                </Link>
              )}
              {allWorkspaces && allWorkspaces.length === 0 && (
                <Link href="/create-workspace/" className={cn(getButtonStyling("secondary", "base"))}>
                  Create new workspace
                </Link>
              )}
            </div>
          </div>

          <div className="absolute bottom-0 left-4 top-0 w-0 bg-layer-1 md:w-0.5" />
        </div>
      </div>
    );
  }

  // while user does not have access to view that workspace
  if (currentWorkspaceInfo === undefined) {
    return (
      <div className={`h-screen w-full overflow-hidden bg-surface-1`}>
        <div className="grid h-full place-items-center p-4">
          <div className="space-y-8 text-center">
            <div className="space-y-2">
              <h3 className="text-16 font-semibold">Not Authorized!</h3>
              <p className="mx-auto w-1/2 text-13 text-secondary">
                You{"'"}re not a member of this workspace. Please contact the workspace admin to get an invitation or
                check your pending invitations.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Link href="/invitations">
                <span>
                  <Button variant="secondary">Check pending invites</Button>
                </span>
              </Link>
              <Link href="/create-workspace">
                <span>
                  <Button variant="primary">Create new workspace</Button>
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
