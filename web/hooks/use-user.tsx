import { useEffect } from "react";
import { useRouter } from "next/router";
import useSWR from "swr";
// services
import { UserService } from "services/user.service";
// constants
import { CURRENT_USER } from "constants/fetch-keys";
// types
import type { IUser } from "@plane/types";

// services
const userService = new UserService();

export default function useUser({ redirectTo = "", redirectIfFound = false, options = {} } = {}) {
  const router = useRouter();
  // API to fetch user information
  const { data, isLoading, error, mutate } = useSWR<IUser>(CURRENT_USER, () => userService.currentUser(), options);

  const user = error ? undefined : data;

  useEffect(() => {
    // if no redirect needed, just return (example: already on /dashboard)
    // if user data not yet there (fetch in progress, logged in or not) then don't do anything yet
    if (!redirectTo || !user) return;

    if (
      // If redirectTo is set, redirect if the user was not found.
      (redirectTo && !redirectIfFound) ||
      // If redirectIfFound is also set, redirect if the user was found
      (redirectIfFound && user)
    ) {
      router.push(redirectTo);
      return;
      // const nextLocation = router.asPath.split("?next_path=")[1];
      // if (nextLocation) {
      //   router.push(nextLocation as string);
      //   return;
      // } else {
      //   router.push("/");
      //   return;
      // }
    }
  }, [user, redirectIfFound, redirectTo, router]);

  return {
    user,
    isUserLoading: isLoading,
    mutateUser: mutate,
    userError: error,
    // assignedIssuesLength: user?.assigned_issues ?? 0,
    // workspaceInvitesLength: user?.workspace_invites ?? 0,
  };
}
