import { FC, ReactNode } from "react";
import { observer } from "mobx-react";
import { useRouter } from "next/router";
import useSWR from "swr";
import { Spinner } from "@plane/ui";
// helpers
import { EPageTypes } from "@/helpers/authentication.helper";
// hooks
import { useUser, useWorkspace } from "@/hooks/store";

type TPageType = EPageTypes;

type TAuthenticationWrapper = {
  children: ReactNode;
  pageType?: TPageType;
};

const isValidURL = (url: string): boolean => {
  const disallowedSchemes = /^(https?|ftp):\/\//i;
  return !disallowedSchemes.test(url);
};

export const AuthenticationWrapper: FC<TAuthenticationWrapper> = observer((props) => {
  const router = useRouter();
  const { next_path } = router.query;
  // props
  const { children, pageType = EPageTypes.AUTHENTICATED } = props;
  // hooks
  const {
    isLoading: isUserLoading,
    data: currentUser,
    currentUserSettings: { isLoading: currentUserSettingsLoader, data: currentUserSettings, fetchCurrentUserSettings },
    profile: { isLoading: currentUserProfileLoader, data: currentUserProfile, fetchUserProfile },
    fetchCurrentUser,
  } = useUser();
  const { loader: workspaceLoader, workspaces, fetchWorkspaces } = useWorkspace();

  useSWR("USER_INFORMATION", async () => await fetchCurrentUser(), {
    revalidateOnFocus: false,
    shouldRetryOnError: false,
  });

  useSWR(
    currentUser && currentUser?.id ? "USER_PROFILE_SETTINGS_INFORMATION" : null,
    async () => {
      if (currentUser && currentUser?.id) {
        await fetchCurrentUserSettings();
        await fetchUserProfile();
        await fetchWorkspaces();
      }
    },
    { revalidateOnFocus: false, shouldRetryOnError: false }
  );

  const getWorkspaceRedirectionUrl = (): string => {
    let redirectionRoute = "/profile";

    // validating the next_path from the router query
    if (next_path && isValidURL(next_path.toString())) {
      redirectionRoute = next_path.toString();
      return redirectionRoute;
    }

    // validate the last and fallback workspace_slug
    const currentWorkspaceSlug =
      currentUserSettings?.workspace?.last_workspace_slug || currentUserSettings?.workspace?.fallback_workspace_slug;

    // validate the current workspace_slug is available in the user's workspace list
    const isCurrentWorkspaceValid = Object.values(workspaces || {}).findIndex(
      (workspace) => workspace.slug === currentWorkspaceSlug
    );

    if (isCurrentWorkspaceValid >= 0) redirectionRoute = `/${currentWorkspaceSlug}`;

    return redirectionRoute;
  };

  if (isUserLoading || currentUserSettingsLoader || currentUserProfileLoader || workspaceLoader)
    return (
      <div className="relative flex h-screen w-full items-center justify-center">
        <Spinner />
      </div>
    );

  console.log("---");
  console.log("currentUser", currentUser?.id);
  console.log("currentUserProfile", currentUserProfile?.id);
  console.log("currentUserSettings", currentUserSettings?.id);
  console.log("---");

  if (pageType === EPageTypes.PUBLIC) return <>{children}</>;

  if (pageType === EPageTypes.NON_AUTHENTICATED) {
    if (!currentUser?.id) return <>{children}</>;
    else {
      if (currentUserProfile?.is_onboarded) {
        const currentRedirectRoute = getWorkspaceRedirectionUrl();
        router.push(currentRedirectRoute);
        return <></>;
      } else {
        router.push("/onboarding");
        return <></>;
      }
    }
  }

  if (pageType === EPageTypes.ONBOARDING) {
    if (!currentUser?.id) {
      router.push("/accounts/sign-in");
      return <></>;
    } else {
      if (currentUser && currentUserProfile?.is_onboarded) {
        const currentRedirectRoute = getWorkspaceRedirectionUrl();
        router.push(currentRedirectRoute);
        return <></>;
      } else return <>{children}</>;
    }
  }

  if (pageType === EPageTypes.AUTHENTICATED) {
    if (currentUser?.id) {
      if (currentUserProfile?.is_onboarded) return <>{children}</>;
      else {
        router.push(`/onboarding`);
        return <></>;
      }
    } else {
      router.push("/accounts/sign-in");
      return <></>;
    }
  }

  return <>{children}</>;
});
