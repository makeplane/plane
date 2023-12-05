import { useCallback, useState } from "react";
import { useRouter } from "next/router";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// types
import { IUser, IUserSettings } from "types";

type UseSignInRedirectionProps = {
  error: any | null;
  isRedirecting: boolean;
  handleRedirection: () => Promise<void>;
};

const useSignInRedirection = (): UseSignInRedirectionProps => {
  // states
  const [isRedirecting, setIsRedirecting] = useState(true);
  const [error, setError] = useState<any | null>(null);
  // router
  const router = useRouter();
  const { next_url } = router.query;
  // mobx store
  const {
    user: { fetchCurrentUser, fetchCurrentUserSettings },
  } = useMobxStore();

  const handleSignInRedirection = useCallback(
    async (user: IUser) => {
      // if the user is not onboarded, redirect them to the onboarding page
      if (!user.is_onboarded) {
        router.push("/onboarding");
        return;
      }
      // if next_url is provided, redirect the user to that url
      if (next_url) {
        router.push(next_url.toString());
        return;
      }

      // if the user is onboarded, fetch their last workspace details
      await fetchCurrentUserSettings()
        .then((userSettings: IUserSettings) => {
          const workspaceSlug =
            userSettings?.workspace?.last_workspace_slug || userSettings?.workspace?.fallback_workspace_slug;
          if (workspaceSlug) router.push(`/${workspaceSlug}`);
          else router.push("/profile");
        })
        .catch((err) => setError(err));
    },
    [fetchCurrentUserSettings, router, next_url]
  );

  const updateUserInfo = useCallback(async () => {
    setIsRedirecting(true);

    await fetchCurrentUser()
      .then(async (user) => {
        await handleSignInRedirection(user)
          .catch((err) => setError(err))
          .finally(() => setIsRedirecting(false));
      })
      .catch((err) => {
        setError(err);
        setIsRedirecting(false);
      });
  }, [fetchCurrentUser, handleSignInRedirection]);

  return {
    error,
    isRedirecting,
    handleRedirection: updateUserInfo,
  };
};

export default useSignInRedirection;
