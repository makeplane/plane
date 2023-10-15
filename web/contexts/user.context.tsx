import React, { createContext, ReactElement } from "react";
import useSWR, { KeyedMutator } from "swr";
// services
import { UserService } from "services/user.service";
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

// services
const userService = new UserService();

export const UserContext = createContext<IUserContextProps>({} as IUserContextProps);

export const UserProvider = ({ children }: { children: ReactElement }) => {
  // API to fetch user information
  const { data, error, mutate } = useSWR(CURRENT_USER, () => userService.currentUser(), {
    shouldRetryOnError: false,
  });

  return (
    <UserContext.Provider
      value={{
        user: error ? undefined : data,
        isUserLoading: Boolean(data === undefined && error === undefined),
        mutateUser: mutate,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
