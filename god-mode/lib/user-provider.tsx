"use client";

import { createContext } from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ThemeProviderProps } from "next-themes/dist/types";
// mobx store
import { UserStore } from "store/user.store";

let userStore = new UserStore();

export const UserContext = createContext<UserStore>(userStore);

const initializeStore = () => {
  const _userStore = userStore ?? new UserStore();
  if (typeof window === "undefined") return _userStore;
  if (!userStore) userStore = _userStore;
  return _userStore;
};

export function UserProvider({ children, ...props }: ThemeProviderProps) {
  const store = initializeStore();
  return (
    <>
      <UserContext.Provider value={store}>
        <NextThemesProvider {...props}>{children}</NextThemesProvider>
      </UserContext.Provider>
    </>
  );
}
