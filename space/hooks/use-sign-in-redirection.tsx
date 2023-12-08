import { useCallback, useState } from "react";
import { useRouter } from "next/router";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// types
import { IUser } from "types/user";

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
  const { next_path } = router.query;
  // mobx store
  const {
    user: { fetchCurrentUser },
  } = useMobxStore();

  const handleSignInRedirection = useCallback(
    async (user: IUser) => {
      const isOnboard = user.onboarding_step?.profile_complete;

      if (isOnboard) {
        // if next_path is provided, redirect the user to that url
        if (next_path) router.push(next_path.toString());
        else router.push("/");
      } else {
        // if the user profile is not complete, redirect them to the onboarding page to complete their profile and then redirect them to the next path
        if (next_path) router.push(`/onboarding?next_path=${next_path}`);
        else router.push("/onboarding");
      }
    },
    [router, next_path]
  );

  const updateUserInfo = useCallback(async () => {
    setIsRedirecting(true);

    await fetchCurrentUser()
      .then(async (user) => {
        if (user)
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
