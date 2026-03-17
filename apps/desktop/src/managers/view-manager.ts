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

import { BrowserWindow, WebContents, WebContentsView, shell, clipboard } from "electron";
import path from "path";
import { TabStore } from "../stores/tab-store";
import { NavigationStore } from "../stores/navigation-store";
import { InstanceStore } from "../stores/instance-store";
import { assert } from "../utils/assert";
import { isAssetPath } from "../utils/url";
import { IPC_CHANNELS } from "../constants/ipc";
import type { WindowLayoutMode } from "../stores/types";

const TAB_BAR_HEIGHT = 44;

/**
 * Plane cloud deployment hosts.
 * Self-hosted instances always serve app, api and assets from the same hostname,
 * so cross-host handling is only needed for cloud hosts.
 */
const CLOUD_APP_HOST = "app.plane.so";
const CLOUD_API_HOST = "api.plane.so";

export class ViewManager {
  #views: Map<string, WebContentsView> = new Map();
  #loadedTabs: Set<string> = new Set();
  #visibleTabId: string | undefined = undefined;
  #mainWindow: BrowserWindow | undefined = undefined;
  #tabBarView: WebContentsView | undefined = undefined;
  #unsubscribeTabStore: (() => void) | undefined = undefined;
  #unsubscribeNavigationStore: (() => void) | undefined = undefined;
  #unsubscribeInstanceStore: (() => void) | undefined = undefined;
  #onTabLoadedCallback: ((id: string) => void) | undefined = undefined;
  #layoutMode: WindowLayoutMode = "setup";
  #resizeHandler: (() => void) | undefined = undefined;
  #windowId: string;
  #restoreClosedWindow: () => boolean;

  readonly #preload = path.join(__dirname, "preload.js");
  readonly #tabBarPreload = path.join(__dirname, "tab-bar-preload.js");
  readonly #setupPage = path.join(__dirname, "setup.html");
  readonly #tabBarPage = path.join(__dirname, "tab-bar.html");

  #tabStore: TabStore;
  #navigationStore: NavigationStore;
  #instanceStore: InstanceStore;

  constructor(
    windowId: string,
    tabStore: TabStore,
    navigationStore: NavigationStore,
    instanceStore: InstanceStore,
    restoreClosedWindow: () => boolean
  ) {
    this.#windowId = windowId;
    this.#tabStore = tabStore;
    this.#navigationStore = navigationStore;
    this.#instanceStore = instanceStore;
    this.#restoreClosedWindow = restoreClosedWindow;
  }

  onTabLoaded(callback: (id: string) => void): void {
    this.#onTabLoadedCallback = callback;
  }

  get #window(): BrowserWindow {
    assert(this.#mainWindow, "ViewManager not initialized - mainWindow not available");
    return this.#mainWindow;
  }

  /**
   * Compute the layout mode based on whether an instance URL is configured
   */
  #computeLayoutMode(): WindowLayoutMode {
    return this.#instanceStore.getInstanceUrl() ? "app" : "setup";
  }

  /**
   * Get the tab bar height based on current layout mode
   * Returns 0 in setup mode (tab bar hidden), TAB_BAR_HEIGHT in app mode
   */
  #getTabBarHeight(): number {
    return this.#layoutMode === "app" ? TAB_BAR_HEIGHT : 0;
  }

  /**
   * Update the layout mode and refresh all view bounds accordingly
   */
  #updateLayoutMode(): void {
    const newMode = this.#computeLayoutMode();
    if (newMode === this.#layoutMode) {
      return;
    }

    this.#layoutMode = newMode;
    this.#updateTabBarBounds();

    const activeView = this.getActiveView();
    if (!activeView) {
      return;
    }

    this.#updateContentBounds(activeView);
  }

  initialize(window: BrowserWindow): void {
    this.#mainWindow = window;
    this.#layoutMode = this.#computeLayoutMode();

    this.#createTabBarView();
    this.#setupResizeHandler();
    this.#loadPersistedTabs();

    this.#unsubscribeTabStore = this.#tabStore.subscribe(() => {
      this.#onTabStoreChanged();
    });

    this.#unsubscribeNavigationStore = this.#navigationStore.subscribe(() => {
      this.#sendStateToTabBar();
    });

    this.#unsubscribeInstanceStore = this.#instanceStore.subscribe(() => {
      this.#updateLayoutMode();
    });
  }

  destroy(): void {
    if (this.#unsubscribeTabStore) {
      this.#unsubscribeTabStore();
      this.#unsubscribeTabStore = undefined;
    }

    if (this.#unsubscribeNavigationStore) {
      this.#unsubscribeNavigationStore();
      this.#unsubscribeNavigationStore = undefined;
    }

    if (this.#unsubscribeInstanceStore) {
      this.#unsubscribeInstanceStore();
      this.#unsubscribeInstanceStore = undefined;
    }

    if (this.#resizeHandler && this.#mainWindow) {
      this.#mainWindow.removeListener("resize", this.#resizeHandler);
      this.#resizeHandler = undefined;
    }

    for (const [id, view] of this.#views.entries()) {
      this.#destroyView(id, view);
    }
    this.#visibleTabId = undefined;

    this.#destroyTabBarView();
    this.#onTabLoadedCallback = undefined;
    this.#mainWindow = undefined;
  }

  /**
   * Destroy a WebContentsView and its renderer process
   * Removes from parent, cleans up event listeners, and closes webContents
   */
  #destroyView(id: string, view: WebContentsView): void {
    try {
      this.#mainWindow?.contentView.removeChildView(view);
    } catch {
      // View may already be removed from parent
    }

    view.webContents.removeAllListeners();

    try {
      view.webContents.close({ waitForBeforeUnload: false });
    } catch {
      // WebContents may already be destroyed (e.g., renderer crash)
    }

    this.#views.delete(id);
    this.#loadedTabs.delete(id);
  }

  /**
   * Destroy the tab bar view and its renderer process
   */
  #destroyTabBarView(): void {
    if (!this.#tabBarView) {
      return;
    }

    try {
      this.#mainWindow?.contentView.removeChildView(this.#tabBarView);
    } catch {
      // Tab bar may already be removed
    }

    this.#tabBarView.webContents.removeAllListeners();

    try {
      this.#tabBarView.webContents.close({ waitForBeforeUnload: false });
    } catch {
      // WebContents may already be destroyed (e.g., renderer crash)
    }

    this.#tabBarView = undefined;
  }

  #createTabBarView(): void {
    this.#tabBarView = new WebContentsView({
      webPreferences: {
        preload: this.#tabBarPreload,
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: false,
      },
    });

    this.#window.contentView.addChildView(this.#tabBarView);
    this.#setupTabIndexShortcuts(this.#tabBarView.webContents);
    this.#updateTabBarBounds();

    void this.#tabBarView.webContents.loadFile(this.#tabBarPage);

    this.#tabBarView.webContents.once("did-finish-load", () => {
      this.#sendStateToTabBar();
    });
  }

  #updateTabBarBounds(): void {
    if (!this.#tabBarView) {
      return;
    }

    const { width } = this.#window.getContentBounds();
    const height = this.#getTabBarHeight();
    this.#tabBarView.setBounds({ x: 0, y: 0, width, height });
    this.#tabBarView.setVisible(this.#layoutMode === "app");
  }

  #sendStateToTabBar(): void {
    if (!this.#tabBarView) {
      return;
    }

    const tabs = this.#tabStore.getTabsWithFavicons(this.#windowId).map((tab) => ({
      ...tab,
      isLoading: !this.#loadedTabs.has(tab.id),
    }));

    const state = {
      tabs,
      activeTabId: this.#tabStore.getActiveTabId(this.#windowId),
      canGoBack: this.#navigationStore.state.canGoBack,
      canGoForward: this.#navigationStore.state.canGoForward,
      platform: process.platform,
    };

    this.#tabBarView.webContents.send(IPC_CHANNELS.TABBAR_STATE_UPDATED, state);
  }

  #onTabStoreChanged(): void {
    const activeTabId = this.#tabStore.getActiveTabId(this.#windowId);
    this.#onActiveTabChanged(activeTabId);
    this.#sendStateToTabBar();
  }

  #loadPersistedTabs(): void {
    const instanceUrl = this.#instanceStore.getInstanceUrl();
    const tabs = this.#tabStore.getTabs(this.#windowId);

    if (!instanceUrl || tabs.length === 0) {
      this.createTab("/");
      return;
    }

    for (const tab of tabs) {
      this.#createTabView(tab.id, tab.path);
    }

    const activeTabId = this.#tabStore.getActiveTabId(this.#windowId);

    if (activeTabId && this.#views.has(activeTabId)) {
      this.#tabStore.setActiveTab(this.#windowId, activeTabId);
      return;
    }

    if (tabs.length > 0) {
      this.#tabStore.setActiveTab(this.#windowId, tabs[0].id);
    }
  }

  createTab(tabPath: string = "/"): string {
    const id = this.#tabStore.addTab(this.#windowId, tabPath, "New Tab");
    if (!id) {
      return "";
    }
    this.#createTabView(id, tabPath);
    this.#tabStore.setActiveTab(this.#windowId, id);
    return id;
  }

  #createTabView(id: string, tabPath: string): void {
    const instanceUrl = this.#instanceStore.getInstanceUrl();

    const view = new WebContentsView({
      webPreferences: {
        preload: this.#preload,
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: false,
      },
    });

    this.#views.set(id, view);
    this.#window.contentView.addChildView(view);
    this.#updateContentBounds(view);
    this.#setupTabIndexShortcuts(view.webContents);

    const tabBarHeight = this.#getTabBarHeight();
    view.setBounds({ x: 0, y: tabBarHeight, width: 0, height: 0 });

    view.webContents.once("did-stop-loading", () => {
      this.#loadedTabs.add(id);
      this.#onTabLoadedCallback?.(id);
      this.#sendStateToTabBar();

      if (this.#tabStore.getActiveTabId(this.#windowId) !== id) {
        return;
      }

      this.#showView(id);
    });

    if (!instanceUrl) {
      void view.webContents.loadFile(this.#setupPage);
      return;
    }

    const fullUrl = new URL(tabPath, instanceUrl).href;
    void view.webContents.loadURL(fullUrl);
    this.#setupViewHandlers(view, id, instanceUrl);
  }

  #setupViewHandlers(view: WebContentsView, id: string, instanceUrl: string): void {
    view.webContents.setWindowOpenHandler(({ url: targetUrl }) => {
      // Non-HTTP(S) URLs (mailto:, plane://, etc.): let Electron handle normally
      if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
        return { action: "allow" };
      }

      switch (classifyDesktopNavigation(instanceUrl, targetUrl)) {
        case "same_host_asset":
        case "cloud_cross_host_asset":
          view.webContents.downloadURL(targetUrl);
          return { action: "deny" };

        case "cloud_cross_host_auth":
          // Auth redirect via window.open: open in a new in-app tab.
          // The full URL is passed so the cross-host auth page loads correctly;
          // tab path is corrected via did-navigate once auth redirects back to the instance.
          this.createTab(targetUrl);
          return { action: "deny" };

        case "same_host_page": {
          const { pathname, search, hash } = new URL(targetUrl);
          this.createTab(pathname + search + hash || "/");
          return { action: "deny" };
        }

        case "external_cross_host":
        case "invalid_url":
        default:
          void shell.openExternal(targetUrl);
          return { action: "deny" };
      }
    });

    view.webContents.on("will-navigate", (event, targetUrl) => {
      switch (classifyDesktopNavigation(instanceUrl, targetUrl)) {
        case "same_host_asset":
        case "cloud_cross_host_asset":
          event.preventDefault();
          view.webContents.downloadURL(targetUrl);
          return;

        case "same_host_page":
        case "cloud_cross_host_auth":
          return; // allow navigation to proceed in-app

        case "external_cross_host":
          event.preventDefault();
          void shell.openExternal(targetUrl);
          return;

        case "invalid_url":
        default:
          return; // passthrough for unparseable URLs
      }
    });

    view.webContents.on("page-title-updated", (_event, pageTitle) => {
      this.#tabStore.updateTabTitle(this.#windowId, id, pageTitle);
    });

    view.webContents.on("page-favicon-updated", (_event, favicons) => {
      const favicon = favicons.find(
        (f) => f.startsWith("https://") || f.startsWith("http://") || f.startsWith("data:")
      );
      if (!favicon) {
        return;
      }

      this.#tabStore.setFavicon(this.#windowId, id, favicon);
    });

    view.webContents.on("did-navigate", (_event, url) => {
      this.#updateTabPath(id, url);

      if (id !== this.#tabStore.getActiveTabId(this.#windowId)) {
        return;
      }

      this.updateNavigationState();
    });

    view.webContents.on("did-navigate-in-page", (_event, url) => {
      this.#updateTabPath(id, url);

      if (id !== this.#tabStore.getActiveTabId(this.#windowId)) {
        return;
      }

      this.updateNavigationState();
    });
  }

  #setupTabIndexShortcuts(contents: WebContents): void {
    contents.on("before-input-event", (event, input) => {
      if (input.type !== "keyDown") {
        return;
      }
      if ((!input.control && !input.meta) || input.alt) {
        return;
      }

      if (input.code === "KeyW" || input.key?.toLowerCase() === "w") {
        const activeTabId = this.#tabStore.getActiveTabId(this.#windowId);
        if (!activeTabId) {
          return;
        }

        this.closeTab(activeTabId);
        event.preventDefault();
        return;
      }

      if ((input.code === "KeyT" || input.key?.toLowerCase() === "t") && input.shift) {
        if (this.restoreLastClosedTab()) {
          event.preventDefault();
          return;
        }

        if (this.#restoreClosedWindow()) {
          event.preventDefault();
        }
        return;
      }

      const digit = (() => {
        if (input.code) {
          const codeMatch = input.code.match(/^(Digit|Numpad)(\d)$/);
          if (codeMatch) return Number(codeMatch[2]);
        }
        if (typeof input.key === "string" && /^\d$/.test(input.key)) {
          return Number(input.key);
        }
        const keyCode = (input as { keyCode?: number }).keyCode;
        if (typeof keyCode === "number") {
          if (keyCode >= 48 && keyCode <= 57) {
            return keyCode - 48;
          }
          if (keyCode >= 96 && keyCode <= 105) {
            return keyCode - 96;
          }
        }
        return undefined;
      })();
      if (digit === undefined) {
        return;
      }

      if (digit >= 1 && digit <= 8) {
        const tabId = this.#tabStore.getTabIdByIndex(this.#windowId, digit - 1);
        if (!tabId) {
          return;
        }

        this.switchTab(tabId);
        event.preventDefault();
        return;
      }

      if (digit === 9) {
        const tabs = this.#tabStore.getTabs(this.#windowId);
        const lastIndex = tabs.length - 1;
        if (lastIndex < 0) {
          return;
        }

        const tabId = this.#tabStore.getTabIdByIndex(this.#windowId, lastIndex);
        if (!tabId) {
          return;
        }

        this.switchTab(tabId);
        event.preventDefault();
      }
    });
  }

  #updateTabPath(id: string, fullUrl: string): void {
    const instanceUrl = this.#instanceStore.getInstanceUrl();
    if (!instanceUrl) {
      return;
    }

    let url: URL;
    try {
      url = new URL(fullUrl);
    } catch {
      return;
    }

    const instance = new URL(instanceUrl);
    if (url.origin !== instance.origin) {
      return;
    }

    const newPath = url.pathname + url.search + url.hash;
    this.#tabStore.updateTabPath(this.#windowId, id, newPath);
  }

  closeTab(id: string): void {
    const tabs = this.#tabStore.getTabs(this.#windowId);
    if (tabs.length <= 1) {
      this.#window.close();
      return;
    }

    const closedTab = this.#tabStore.getTabById(this.#windowId, id);
    if (closedTab) {
      this.#tabStore.pushClosedTab(this.#windowId, { id: closedTab.id, path: closedTab.path });
    }

    const view = this.#views.get(id);
    if (!view) {
      return;
    }

    const result = this.#tabStore.removeTab(this.#windowId, id);
    if (!result) {
      return;
    }

    this.#destroyView(id, view);

    if (this.#visibleTabId !== id) {
      return;
    }

    this.#visibleTabId = undefined;
  }

  moveTab(tabId: string, toIndex: number): void {
    this.#tabStore.moveTab(this.#windowId, tabId, toIndex);
  }

  switchTab(id: string): void {
    this.#tabStore.setActiveTab(this.#windowId, id);
    this.updateNavigationState();
  }

  restoreLastClosedTab(): boolean {
    const closedTab = this.#tabStore.popClosedTab(this.#windowId);
    if (!closedTab) {
      return false;
    }

    this.createTab(closedTab.path);
    return true;
  }

  closeOtherTabs(keepId: string): void {
    const removedTabs = this.#tabStore.removeOtherTabs(this.#windowId, keepId);

    for (const tab of removedTabs) {
      this.#tabStore.pushClosedTab(this.#windowId, { id: tab.id, path: tab.path });
      const view = this.#views.get(tab.id);
      if (view) {
        this.#destroyView(tab.id, view);
      }
    }

    // Ensure the kept tab is visible even if it hasn't finished loading yet,
    // so the window doesn't show a blank area after destroying the other views.
    this.#showView(keepId);
  }

  closeAllTabs(): void {
    const removedTabs = this.#tabStore.removeAllTabs(this.#windowId);

    for (const tab of removedTabs) {
      this.#tabStore.pushClosedTab(this.#windowId, { id: tab.id, path: tab.path });
      const view = this.#views.get(tab.id);
      if (view) {
        this.#destroyView(tab.id, view);
      }
    }

    this.#visibleTabId = undefined;
    this.createTab("/");
  }

  reloadTab(id: string): void {
    const view = this.#views.get(id);
    if (!view) {
      return;
    }

    view.webContents.reload();
  }

  getTabCount(): number {
    return this.#tabStore.getTabs(this.#windowId).length;
  }

  copyTabLink(id: string): void {
    const tab = this.#tabStore.getTabById(this.#windowId, id);
    if (!tab) {
      return;
    }

    const instanceUrl = this.#instanceStore.getInstanceUrl();
    if (!instanceUrl) {
      return;
    }

    const fullUrl = new URL(tab.path, instanceUrl).href;
    clipboard.writeText(fullUrl);
  }

  #onActiveTabChanged(activeTabId: string | undefined): void {
    if (!activeTabId) {
      this.#showView(undefined);
      return;
    }

    if (!this.#loadedTabs.has(activeTabId)) {
      return;
    }

    this.#showView(activeTabId);
  }

  #showView(tabId: string | undefined): void {
    if (tabId === this.#visibleTabId) {
      return;
    }

    const tabBarHeight = this.#getTabBarHeight();

    for (const [viewId, view] of this.#views) {
      if (viewId === tabId) continue;

      view.setBounds({ x: 0, y: tabBarHeight, width: 0, height: 0 });
    }

    if (tabId) {
      const targetView = this.#views.get(tabId);
      if (!targetView) {
        return;
      }

      this.#updateContentBounds(targetView);
      targetView.webContents.focus();
    }

    this.#visibleTabId = tabId;
  }

  updateNavigationState(): void {
    const view = this.getActiveView();
    const canGoBack = view?.webContents.navigationHistory.canGoBack() ?? false;
    const canGoForward = view?.webContents.navigationHistory.canGoForward() ?? false;
    this.#navigationStore.update(canGoBack, canGoForward);
  }

  getActiveView(): WebContentsView | undefined {
    const activeTabId = this.#tabStore.getActiveTabId(this.#windowId);
    if (!activeTabId) {
      return undefined;
    }

    return this.#views.get(activeTabId);
  }

  getAllViews(): WebContentsView[] {
    return Array.from(this.#views.values());
  }

  isTabLoaded(id: string): boolean {
    return this.#loadedTabs.has(id);
  }

  goBack(): void {
    const view = this.getActiveView();
    if (!view) {
      return;
    }
    if (!view.webContents.navigationHistory.canGoBack()) {
      return;
    }

    view.webContents.navigationHistory.goBack();
  }

  goForward(): void {
    const view = this.getActiveView();
    if (!view) {
      return;
    }
    if (!view.webContents.navigationHistory.canGoForward()) {
      return;
    }

    view.webContents.navigationHistory.goForward();
  }

  navigateToPath(planePath: string): void {
    const instanceUrl = this.#instanceStore.getInstanceUrl();
    if (!instanceUrl) {
      return;
    }

    const view = this.getActiveView();
    if (!view) {
      return;
    }

    const fullUrl = new URL(planePath, instanceUrl).href;
    void view.webContents.loadURL(fullUrl);
  }

  handleInstanceUrlChanged(): void {
    this.#updateLayoutMode();

    for (const [id, view] of this.#views.entries()) {
      this.#destroyView(id, view);
    }

    this.#visibleTabId = undefined;
    this.#tabStore.clearTabs(this.#windowId);
    this.createTab("/");
  }

  #setupResizeHandler(): void {
    this.#resizeHandler = () => {
      this.#updateTabBarBounds();

      const activeView = this.getActiveView();
      if (!activeView) {
        return;
      }

      this.#updateContentBounds(activeView);
    };

    this.#window.on("resize", this.#resizeHandler);
  }

  #updateContentBounds(view: WebContentsView): void {
    const { width, height } = this.#window.getContentBounds();
    const tabBarHeight = this.#getTabBarHeight();
    view.setBounds({ x: 0, y: tabBarHeight, width, height: height - tabBarHeight });
  }
}

/**
 * How the desktop app should handle a given navigation URL.
 *
 * - "same_host_page":         Same hostname as instance, not an asset          → navigate in-app.
 * - "same_host_asset":        Same hostname as instance, URL is a file/asset   → trigger download.
 * - "cloud_cross_host_auth":  api.plane.so URL under /auth/                    → allow in-app (auth flow).
 * - "cloud_cross_host_asset": api.plane.so URL that is a file/asset            → trigger download.
 * - "external_cross_host":    Unrecognised different hostname                  → open in system browser.
 * - "invalid_url":            Unparseable URL                                  → passthrough.
 */
type DesktopNavigationKind =
  | "same_host_page"
  | "same_host_asset"
  | "cloud_cross_host_auth"
  | "cloud_cross_host_asset"
  | "external_cross_host"
  | "invalid_url";

/**
 * Classifies a navigation URL so the desktop app can decide how to handle it.
 * Single source of truth used by both setWindowOpenHandler and will-navigate.
 *
 * @param instanceUrl Full URL of the configured Plane instance (e.g. "https://app.plane.so").
 * @param targetUrl   The URL being navigated to.
 */
function classifyDesktopNavigation(instanceUrl: string, targetUrl: string): DesktopNavigationKind {
  try {
    const instance = new URL(instanceUrl);
    const target = new URL(targetUrl);
    const isSameHost = target.hostname === instance.hostname;
    const isCloudPair = instance.hostname === CLOUD_APP_HOST && target.hostname === CLOUD_API_HOST;
    const isAsset = isAssetPath(targetUrl);
    const isAuth = target.pathname.startsWith("/auth/");

    if (isSameHost) {
      return isAsset ? "same_host_asset" : "same_host_page";
    }

    if (isCloudPair) {
      // Auth paths take priority: /auth/ navigation must stay in-app even if the path
      // has a file-like suffix (unlikely, but explicit ordering makes intent clear).
      if (isAuth) {
        return "cloud_cross_host_auth";
      }
      if (isAsset) {
        return "cloud_cross_host_asset";
      }
    }

    return "external_cross_host";
  } catch {
    return "invalid_url";
  }
}
