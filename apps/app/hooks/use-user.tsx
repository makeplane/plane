import { useContext, useEffect } from "react";
import { useRouter } from "next/router";
// context
import { UserContext } from "contexts/user.context";

interface useUserOptions {
  redirectTo?: string;
}

const useUser = (options: useUserOptions = {}) => {
  // props
  const { redirectTo = null } = options;
  // context
  const contextData = useContext(UserContext);
  // router
  const router = useRouter();

  /**
   * Checks for redirect url and user details from the API.
   * if the user is not authenticated, user will be redirected
   * to the provided redirectTo route.
   */
  useEffect(() => {
    if (!contextData?.user || !redirectTo) return;

    if (!contextData?.user) {
      if (redirectTo) {
        router?.pathname !== redirectTo && router.push(redirectTo);
      }
      router?.pathname !== "/signin" && router.push("/signin");
    }
    if (contextData?.user) {
      if (redirectTo) {
        router?.pathname !== redirectTo && router.push(redirectTo);
      }
    }
  }, [contextData?.user, redirectTo, router]);

  return { ...contextData };
};

export default useUser;
