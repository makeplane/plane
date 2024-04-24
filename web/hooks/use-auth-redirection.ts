import { useCallback, useState } from "react";
import { useRouter } from "next/router";
// types
import {
  //IUser, IUserSettings,
  IWorkspace,
  TUserProfile,
} from "@plane/types";
import { useUserProfile } from "@/hooks/store";
// hooks
import { useWorkspace } from "@/hooks/store";
import { useCurrentUserSettings } from "./store/use-current-user-settings";

type TUseAuthRedirectionProps = {
  error: any | null;
  isRedirecting: boolean;
  handleRedirection: () => Promise<void>;
};

const useAuthRedirection = (): TUseAuthRedirectionProps => {
  // states
  const [isRedirecting, setIsRedirecting] = useState(true);
  const [error, setError] = useState<any | null>(null);
  // router
  const router = useRouter();
  const { next_path } = router.query;
  // mobx store
  const { fetchUserProfile } = useUserProfile();
  const { fetchCurrentUserSettings } = useCurrentUserSettings();
  const { fetchWorkspaces } = useWorkspace();

  const isValidURL = (url: string): boolean => {
    const disallowedSchemes = /^(https?|ftp):\/\//i;
    return !disallowedSchemes.test(url);
  };

  const getAuthRedirectionUrl = useCallback(
    async (profile: TUserProfile | undefined) => {
      try {
        if (!profile) return;

        // if the user is not onboarded, redirect them to the onboarding page
        if (!profile.is_onboarded) {
          return "/onboarding";
        }
        // if next_path is provided, redirect the user to that url
        if (next_path) {
          if (isValidURL(next_path.toString())) {
            return next_path.toString();
          } else {
            return "/";
          }
        }

        // Fetch the current user settings
        const userSettings = await fetchCurrentUserSettings();
        const workspacesList: IWorkspace[] = await fetchWorkspaces();

        // Extract workspace details
        const workspaceSlug =
          userSettings?.workspace?.last_workspace_slug || userSettings?.workspace?.fallback_workspace_slug;

        // Redirect based on workspace details or to profile if not available
        if (
          workspaceSlug &&
          workspacesList &&
          workspacesList.filter((workspace) => workspace.slug === workspaceSlug).length > 0
        )
          return `/${workspaceSlug}`;
        else return "/profile";
      } catch (error) {
        setIsRedirecting(false);
        console.error("Error in handleSignInRedirection:", error);
        setError(error);
      }
    },
    [fetchCurrentUserSettings, fetchWorkspaces, router, next_path]
  );

  const updateUserInfo = useCallback(async () => {
    setIsRedirecting(true);

    await fetchUserProfile()
      .then(async (profile) => {
        await getAuthRedirectionUrl(profile)
          .then((url: string | undefined) => {
            if (url) {
              router.push(url);
              return;
            }

            setIsRedirecting(false);
          })
          .catch((err) => {
            setIsRedirecting(false);
            setError(err);
          });
      })
      .catch((err) => {
        setError(err);
        setIsRedirecting(false);
      });
  }, [fetchUserProfile, getAuthRedirectionUrl]);

  return {
    error,
    isRedirecting,
    handleRedirection: updateUserInfo,
  };
};

export default useAuthRedirection;
