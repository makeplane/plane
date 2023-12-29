import { useEffect, useState } from "react";
// next imports
import { useRouter } from "next/router";
// swr
import useSWR from "swr";
// services
import { WorkspaceService } from "services/workspace.service";
// mobx
import { useMobxStore } from "lib/mobx/store-provider";

const workspaceService = new WorkspaceService();

const useUserAuth = (routeAuth: "sign-in" | "onboarding" | "admin" | null = "admin") => {
  const router = useRouter();
  const { next_path } = router.query;

  const [isRouteAccess, setIsRouteAccess] = useState(true);
  const {
    user: { fetchCurrentUser },
  } = useMobxStore();

  const {
    data: user,
    isLoading,
    error,
    mutate,
  } = useSWR("CURRENT_USER_DETAILS", () => fetchCurrentUser(), {
    refreshInterval: 0,
    shouldRetryOnError: false,
  });

  const isValidURL = (url: string): boolean => {
    const disallowedSchemes = /^(https?|ftp):\/\//i;
    return !disallowedSchemes.test(url);
  };

  useEffect(() => {
    const handleWorkSpaceRedirection = async () => {
      workspaceService.userWorkspaces().then(async (userWorkspaces) => {
        const lastActiveWorkspace = userWorkspaces.find((workspace) => workspace.id === user?.last_workspace_id);
        if (lastActiveWorkspace) {
          router.push(`/${lastActiveWorkspace.slug}`);
          return;
        } else if (userWorkspaces.length > 0) {
          router.push(`/${userWorkspaces[0].slug}`);
          return;
        } else {
          router.push(`/profile`);
          return;
        }
      });
    };

    const handleUserRouteAuthentication = async () => {
      if (user && user.is_active) {
        if (routeAuth === "sign-in") {
          if (user.is_onboarded) handleWorkSpaceRedirection();
          else {
            router.push("/onboarding");
            return;
          }
        } else if (routeAuth === "onboarding") {
          if (user.is_onboarded) handleWorkSpaceRedirection();
          else {
            setIsRouteAccess(() => false);
            return;
          }
        } else {
          if (!user.is_onboarded) {
            router.push("/onboarding");
            return;
          } else {
            setIsRouteAccess(() => false);
            return;
          }
        }
      } else {
        // user is not active and we can redirect to no access page
        // router.push("/no-access");
        // remove token
        return;
      }
    };

    if (routeAuth === null) {
      setIsRouteAccess(() => false);
      return;
    } else {
      if (!isLoading) {
        setIsRouteAccess(() => true);
        if (user) {
          if (next_path) {
            if (isValidURL(next_path.toString())) {
              router.push(next_path.toString());
              return;
            } else {
              router.push("/");
              return;
            }
          } else handleUserRouteAuthentication();
        } else {
          if (routeAuth === "sign-in") {
            setIsRouteAccess(() => false);
            return;
          } else {
            router.push("/");
            return;
          }
        }
      }
    }
  }, [user, isLoading, routeAuth, router, next_path]);

  return {
    isLoading: isRouteAccess,
    user: error ? undefined : user,
    mutateUser: mutate,
    // assignedIssuesLength: user?.assigned_issues ?? 0,
    // workspaceInvitesLength: user?.workspace_invites ?? 0,
  };
};

export default useUserAuth;
