/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { createContext } from "react";
// plane web store
import { RootStore } from "@/plane-web/store/root.store";

let rootStore = new RootStore();

export const StoreContext = createContext(rootStore);

function initializeStore() {
  const singletonRootStore = rootStore ?? new RootStore();
  // For SSG and SSR always create a new store
  if (typeof window === "undefined") return singletonRootStore;
  // Create the store once in the client
  if (!rootStore) rootStore = singletonRootStore;
  return singletonRootStore;
}

export type StoreProviderProps = {
  children: React.ReactNode;
  // oxlint-disable-next-line @typescript-eslint/no-explicit-any
  initialState?: any;
};

export function StoreProvider({ children, initialState = undefined }: StoreProviderProps) {
  const store = initializeStore();
  // If your page has Next.js data fetching methods that use a Mobx store, it will
  // get hydrated here, check `pages/ssg.js` and `pages/ssr.js` for more details
  if (initialState) {
    store.hydrate(initialState);
  }

  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}
