/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// plane admin store
import { StoreContext, rootStore } from "./store-context";

function initializeStore(initialData = {}) {
  // If your page has Next.js data fetching methods that use a Mobx store, it will
  // get hydrated here, check `pages/ssg.js` and `pages/ssr.js` for more details
  if (initialData) {
    rootStore.hydrate(initialData);
  }
  return rootStore;
}

export type StoreProviderProps = {
  children: React.ReactNode;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialState?: any;
};

export function StoreProvider({ children, initialState = {} }: StoreProviderProps) {
  const store = initializeStore(initialState);
  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}
