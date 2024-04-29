import { useEffect, useState } from "react";
import { useRouter } from "next/router";
// services
import { WorkspaceService } from "@/services/workspace.service";
// types
import { IUser, TUserProfile } from "@plane/types";

const workspaceService = new WorkspaceService();
type Props = {
  routeAuth?: "sign-in" | "onboarding" | "admin" | null;
  user: IUser | null;
  userProfile: TUserProfile | undefined;
  isLoading: boolean;
};
const useUserAuth = (props: Props) => {
  const { routeAuth, user, userProfile, isLoading } = props;
  // states
  const [isRouteAccess, setIsRouteAccess] = useState(true);
  // router
  const router = useRouter();
  const { next_path } = router.query;

  const isValidURL = (url: string): boolean => {
    const disallowedSchemes = /^(https?|ftp):\/\//i;
    return !disallowedSchemes.test(url);
  };

  useEffect(() => {
    const handleWorkSpaceRedirection = async () => {
      workspaceService.userWorkspaces().then(async (userWorkspaces) => {
        if (!user || !userProfile) return;

        const firstWorkspace = Object.values(userWorkspaces ?? {})?.[0];
        const lastActiveWorkspace = userWorkspaces.find((workspace) => workspace.id === user?.last_workspace_id);

        if (lastActiveWorkspace) {
          router.push(`/${lastActiveWorkspace.slug}`);
          return;
        } else if (firstWorkspace) {
          router.push(`/${firstWorkspace.slug}`);
          return;
        } else {
          router.push(`/profile`);
          return;
        }
      });
    };

    const handleUserRouteAuthentication = async () => {
      if (user && user.is_active && userProfile) {
        if (routeAuth === "sign-in") {
          if (userProfile.is_onboarded) handleWorkSpaceRedirection();
          else {
            router.push("/onboarding");
            return;
          }
        } else if (routeAuth === "onboarding") {
          if (userProfile.is_onboarded) handleWorkSpaceRedirection();
          else {
            setIsRouteAccess(() => false);
            return;
          }
        } else {
          if (!userProfile.is_onboarded) {
            router.push("/onboarding");
            return;
          } else {
            setIsRouteAccess(() => false);
            return;
          }
        }
      } else {
        // user is not active and we can redirect to no access page
        router.push("/no-access");
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
  };
};

export default useUserAuth;
