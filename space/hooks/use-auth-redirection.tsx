import { useCallback, useState } from "react";
import { useRouter } from "next/router";
// types
import { TUserProfile } from "@plane/types";
// mobx store
import { useMobxStore } from "@/lib/mobx/store-provider";

type UseAuthRedirectionProps = {
  error: any | null;
  isRedirecting: boolean;
  handleRedirection: () => Promise<void>;
};

const useAuthRedirection = (): UseAuthRedirectionProps => {
  // states
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [error, setError] = useState<any | null>(null);
  // router
  const router = useRouter();
  const { next_path } = router.query;
  // mobx store
  const {
    profile: { fetchUserProfile },
  } = useMobxStore();

  const isValidURL = (url: string): boolean => {
    const disallowedSchemes = /^(https?|ftp):\/\//i;
    return !disallowedSchemes.test(url);
  };

  const getAuthRedirectionUrl = useCallback(
    async (profile: TUserProfile | undefined) => {
      try {
        if (!profile) return "/";

        const isOnboard = profile.onboarding_step?.profile_complete;

        if (isOnboard) {
          // if next_path is provided, redirect the user to that url
          if (next_path) {
            if (isValidURL(next_path.toString())) {
              return next_path.toString();
            } else {
              return "/";
            }
          }
        } else {
          // if the user profile is not complete, redirect them to the onboarding page to complete their profile and then redirect them to the next path
          if (next_path) return `/onboarding?next_path=${next_path}`;
          else return "/onboarding";
        }

        return "/";
      } catch {
        setIsRedirecting(false);
        console.error("Error in handleSignInRedirection:", error);
        setError(error);
      }
    },
    [next_path]
  );

  const updateUserProfileInfo = useCallback(async () => {
    setIsRedirecting(true);

    await fetchUserProfile()
      .then(async (profile) => {
        if (profile)
          await getAuthRedirectionUrl(profile)
            .then((url: string | undefined) => {
              if (url) {
                router.push(url);
              }
              if (!url || url === "/") setIsRedirecting(false);
            })
            .catch((err) => {
              setError(err);
              setIsRedirecting(false);
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
    handleRedirection: updateUserProfileInfo,
  };
};

export default useAuthRedirection;
