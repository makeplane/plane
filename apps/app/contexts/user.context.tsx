import React, { createContext, ReactElement } from "react";
// next
import { useRouter } from "next/router";
// swr
import useSWR, { KeyedMutator } from "swr";
// services
import userService from "services/user.service";
// constants
import { CURRENT_USER } from "constants/fetch-keys";

// types
import type { IUser } from "types";

interface IUserContextProps {
  user?: IUser;
  isUserLoading: boolean;
  mutateUser: KeyedMutator<IUser>;
  assignedIssuesLength?: number;
  workspaceInvitesLength?: number;
}

export const UserContext = createContext<IUserContextProps>({} as IUserContextProps);

export const UserProvider = ({ children }: { children: ReactElement }) => {
  const router = useRouter();

  // API to fetch user information
  const { data, error, mutate } = useSWR<IUser>(CURRENT_USER, () => userService.currentUser(), {
    shouldRetryOnError: false,
  });

  if (error) {
    router.push("/signin");
    return null;
  }

  return (
    <UserContext.Provider
      value={{
        user: error ? undefined : data?.user,
        isUserLoading: Boolean(data?.user === undefined && error === undefined),
        mutateUser: mutate,
        assignedIssuesLength: data?.assigned_issues ?? 0,
        workspaceInvitesLength: data?.workspace_invites ?? 0,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
