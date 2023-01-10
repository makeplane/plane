import React, { createContext, ReactElement } from "react";
// swr
import useSWR from "swr";
// services
import userService from "lib/services/user.service";
// constants
import { CURRENT_USER } from "constants/fetch-keys";

// types
import type { KeyedMutator } from "swr";
import type { IUser } from "types";

interface IUserContextProps {
  user?: IUser;
  isUserLoading: boolean;
  mutateUser: KeyedMutator<IUser>;
}

export const UserContext = createContext<IUserContextProps>({} as IUserContextProps);

export const UserProvider = ({ children }: { children: ReactElement }) => {
  // API to fetch user information
  const { data, error, mutate } = useSWR<IUser>(CURRENT_USER, () => userService.currentUser(), {
    shouldRetryOnError: false,
  });

  return (
    <UserContext.Provider
      value={{
        user: error ? undefined : data?.user,
        isUserLoading: Boolean(data?.user === undefined && error === undefined),
        mutateUser: mutate,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
