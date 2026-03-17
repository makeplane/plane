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

import ElectronStore from "electron-store";
import { Store } from "./store";
import type { Tab, TabWithFavicon, PersistedTab, PersistedWindow, StoreSchema } from "./types";

export type { Tab, TabWithFavicon };

export interface WindowTabState {
  tabs: Tab[];
  activeTabId: string | undefined;
  favicons: Map<string, string>;
}

export interface TabState {
  windows: Map<string, WindowTabState>;
}

function generateTabId(): string {
  return `tab-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export class TabStore extends Store<TabState> {
  private persistStore: ElectronStore<StoreSchema>;
  #closedTabsByWindow: Map<string, PersistedTab[]> = new Map();
  #closedWindows: PersistedWindow[] = [];
  #suppressClosedWindowCapture = false;

  constructor(persistStore: ElectronStore<StoreSchema>) {
    const persistedWindows = persistStore.get("windows") ?? [];
    const windows = new Map<string, WindowTabState>();

    for (const win of persistedWindows) {
      const tabs: Tab[] = win.tabs.map((t: PersistedTab) => ({ ...t, title: "Loading..." }));
      windows.set(win.id, {
        tabs,
        activeTabId: win.activeTabId,
        favicons: new Map(),
      });
    }

    super({ windows });
    this.persistStore = persistStore;
  }

  registerWindow(windowId: string): void {
    if (this.state.windows.has(windowId)) {
      return;
    }

    const windows = new Map(this.state.windows);
    windows.set(windowId, { tabs: [], activeTabId: undefined, favicons: new Map() });
    this.state = { ...this.state, windows };
    this.#persistWindows(windows);
  }

  restoreWindow(windowId: string, windowState: PersistedWindow): void {
    const tabs: Tab[] = windowState.tabs.map((t) => ({ ...t, title: "Loading..." }));
    const windows = new Map(this.state.windows);
    windows.set(windowId, {
      tabs,
      activeTabId: windowState.activeTabId,
      favicons: new Map(),
    });
    this.state = { ...this.state, windows };
    this.#persistWindows(windows);
  }

  unregisterWindow(windowId: string): void {
    if (!this.state.windows.has(windowId)) {
      return;
    }

    const windows = new Map(this.state.windows);
    windows.delete(windowId);
    this.state = { ...this.state, windows };
    this.#persistWindows(windows);
  }

  setSuppressClosedWindowCapture(value: boolean): void {
    this.#suppressClosedWindowCapture = value;
  }

  captureClosedWindow(windowId: string): void {
    if (this.#suppressClosedWindowCapture) {
      return;
    }

    const windowState = this.state.windows.get(windowId);
    if (!windowState) {
      return;
    }

    const closedWindow: PersistedWindow = {
      id: windowId,
      tabs: windowState.tabs.map(({ id, path }) => ({ id, path })),
      activeTabId: windowState.activeTabId,
    };

    this.#closedWindows.push(closedWindow);
    this.#closedTabsByWindow.delete(windowId);
  }

  popClosedWindow(): PersistedWindow | undefined {
    return this.#closedWindows.pop();
  }

  pushClosedTab(windowId: string, tab: PersistedTab): void {
    const closedTabs = this.#closedTabsByWindow.get(windowId) ?? [];
    closedTabs.push(tab);
    this.#closedTabsByWindow.set(windowId, closedTabs);
  }

  popClosedTab(windowId: string): PersistedTab | undefined {
    const closedTabs = this.#closedTabsByWindow.get(windowId);
    if (!closedTabs || closedTabs.length === 0) {
      return undefined;
    }

    const tab = closedTabs.pop();
    if (closedTabs.length === 0) {
      this.#closedTabsByWindow.delete(windowId);
    }

    return tab;
  }

  clearAllWindows(): void {
    const windows = new Map<string, WindowTabState>();
    this.state = { ...this.state, windows };
    this.#persistWindows(windows);
    this.#closedTabsByWindow.clear();
    this.#closedWindows = [];
  }

  addTab(windowId: string, path: string = "/", title: string = "New Tab"): string {
    const windowState = this.state.windows.get(windowId);
    if (!windowState) {
      return "";
    }

    const id = generateTabId();
    const newTab: Tab = { id, path, title };
    const newTabs = [...windowState.tabs, newTab];

    this.#updateWindowState(windowId, {
      ...windowState,
      tabs: newTabs,
    });

    return id;
  }

  #persistWindows(windows: Map<string, WindowTabState> = this.state.windows): void {
    const persistedWindows: PersistedWindow[] = Array.from(windows.entries()).map(([id, win]) => ({
      id,
      tabs: win.tabs.map(({ id: tabId, path }) => ({ id: tabId, path })),
      activeTabId: win.activeTabId,
    }));
    this.persistStore.set("windows", persistedWindows);
  }

  #updateWindowState(
    windowId: string,
    nextState: WindowTabState,
    { persist = true }: { persist?: boolean } = {}
  ): void {
    const windows = new Map(this.state.windows);
    windows.set(windowId, nextState);
    this.state = { ...this.state, windows };
    if (persist) {
      this.#persistWindows(windows);
    }
  }

  removeTab(windowId: string, id: string): { nextActiveId: string | undefined; wasActive: boolean } | undefined {
    const windowState = this.state.windows.get(windowId);
    if (!windowState) {
      return undefined;
    }

    const { tabs, activeTabId, favicons } = windowState;
    const tabIndex = tabs.findIndex((t) => t.id === id);

    // Don't close if it's the only tab
    if (tabs.length <= 1) {
      return undefined;
    }

    const wasActive = activeTabId === id;
    let nextActiveId: string | undefined = undefined;

    if (wasActive) {
      const newActiveIndex = Math.min(tabIndex, tabs.length - 2);
      const remainingTabs = tabs.filter((t) => t.id !== id);
      nextActiveId = remainingTabs[newActiveIndex]?.id ?? undefined;
    }

    const newTabs = tabs.filter((t) => t.id !== id);
    const newFavicons = new Map(favicons);
    newFavicons.delete(id);
    const newActiveTabId = wasActive ? nextActiveId : activeTabId;

    this.#updateWindowState(windowId, {
      tabs: newTabs,
      activeTabId: newActiveTabId,
      favicons: newFavicons,
    });

    return { nextActiveId, wasActive };
  }

  setActiveTab(windowId: string, id: string): void {
    const windowState = this.state.windows.get(windowId);
    if (!windowState) {
      return;
    }
    if (windowState.activeTabId === id) {
      return;
    }

    this.#updateWindowState(windowId, { ...windowState, activeTabId: id });
  }

  updateTabTitle(windowId: string, id: string, title: string): void {
    const windowState = this.state.windows.get(windowId);
    if (!windowState) {
      return;
    }
    const tabIndex = windowState.tabs.findIndex((t) => t.id === id);
    if (tabIndex === -1) {
      return;
    }

    const newTabs = [...windowState.tabs];
    newTabs[tabIndex] = { ...newTabs[tabIndex], title };
    this.#updateWindowState(
      windowId,
      {
        ...windowState,
        tabs: newTabs,
      },
      { persist: false }
    );
  }

  updateTabPath(windowId: string, id: string, path: string): void {
    const windowState = this.state.windows.get(windowId);
    if (!windowState) {
      return;
    }
    const tabIndex = windowState.tabs.findIndex((t) => t.id === id);
    if (tabIndex === -1) {
      return;
    }
    if (windowState.tabs[tabIndex].path === path) {
      return;
    }

    const newTabs = [...windowState.tabs];
    newTabs[tabIndex] = { ...newTabs[tabIndex], path };
    this.#updateWindowState(windowId, { ...windowState, tabs: newTabs });
  }

  setFavicon(windowId: string, id: string, favicon: string): void {
    const windowState = this.state.windows.get(windowId);
    if (!windowState) {
      return;
    }
    const newFavicons = new Map(windowState.favicons);
    newFavicons.set(id, favicon);
    this.#updateWindowState(
      windowId,
      {
        ...windowState,
        favicons: newFavicons,
      },
      { persist: false }
    );
  }

  moveTab(windowId: string, tabId: string, toIndex: number): void {
    const windowState = this.state.windows.get(windowId);
    if (!windowState) {
      return;
    }

    const fromIndex = windowState.tabs.findIndex((t) => t.id === tabId);
    if (fromIndex === -1 || toIndex === fromIndex) {
      return;
    }

    const clampedTo = Math.max(0, Math.min(toIndex, windowState.tabs.length - 1));
    const newTabs = [...windowState.tabs];
    const [moved] = newTabs.splice(fromIndex, 1);
    newTabs.splice(clampedTo, 0, moved);

    this.#updateWindowState(windowId, { ...windowState, tabs: newTabs });
  }

  removeOtherTabs(windowId: string, keepId: string): Tab[] {
    const windowState = this.state.windows.get(windowId);
    if (!windowState) {
      return [];
    }

    const { tabs, favicons } = windowState;
    const keepTab = tabs.find((t) => t.id === keepId);
    if (!keepTab) {
      return [];
    }

    const removedTabs = tabs.filter((t) => t.id !== keepId);
    const newFavicons = new Map<string, string>();
    const keepFavicon = favicons.get(keepId);
    if (keepFavicon) {
      newFavicons.set(keepId, keepFavicon);
    }

    this.#updateWindowState(windowId, {
      tabs: [keepTab],
      activeTabId: keepId,
      favicons: newFavicons,
    });

    return removedTabs;
  }

  removeAllTabs(windowId: string): Tab[] {
    const windowState = this.state.windows.get(windowId);
    if (!windowState) {
      return [];
    }

    const removedTabs = [...windowState.tabs];
    this.#updateWindowState(windowId, {
      tabs: [],
      activeTabId: undefined,
      favicons: new Map(),
    });

    return removedTabs;
  }

  clearTabs(windowId: string): void {
    const windowState = this.state.windows.get(windowId);
    if (!windowState) {
      return;
    }
    this.#updateWindowState(windowId, {
      tabs: [],
      activeTabId: undefined,
      favicons: new Map(),
    });
  }

  getWindowIds(): string[] {
    return Array.from(this.state.windows.keys());
  }

  getTabs(windowId: string): Tab[] {
    return this.state.windows.get(windowId)?.tabs ?? [];
  }

  getTabsWithFavicons(windowId: string): TabWithFavicon[] {
    const windowState = this.state.windows.get(windowId);
    if (!windowState) {
      return [];
    }
    return windowState.tabs.map((tab) => ({
      ...tab,
      favicon: windowState.favicons.get(tab.id),
    }));
  }

  getActiveTabId(windowId: string): string | undefined {
    return this.state.windows.get(windowId)?.activeTabId;
  }

  getTabById(windowId: string, id: string): Tab | undefined {
    return this.state.windows.get(windowId)?.tabs.find((t) => t.id === id);
  }

  getNextTabId(windowId: string): string | undefined {
    const windowState = this.state.windows.get(windowId);
    if (!windowState) {
      return undefined;
    }
    const { tabs, activeTabId } = windowState;
    if (tabs.length <= 1) {
      return undefined;
    }

    const currentIndex = tabs.findIndex((t) => t.id === activeTabId);
    const nextIndex = (currentIndex + 1) % tabs.length;
    return tabs[nextIndex].id;
  }

  getPreviousTabId(windowId: string): string | undefined {
    const windowState = this.state.windows.get(windowId);
    if (!windowState) {
      return undefined;
    }
    const { tabs, activeTabId } = windowState;
    if (tabs.length <= 1) {
      return undefined;
    }

    const currentIndex = tabs.findIndex((t) => t.id === activeTabId);
    const prevIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    return tabs[prevIndex].id;
  }

  getTabIdByIndex(windowId: string, index: number): string | undefined {
    const tabs = this.state.windows.get(windowId)?.tabs ?? [];
    if (index >= 0 && index < tabs.length) {
      return tabs[index]?.id;
    }
    return undefined;
  }
}
