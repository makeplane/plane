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

import { contextBridge, ipcRenderer } from "electron";

interface TabBarState {
  tabs: Array<{
    id: string;
    path: string;
    title: string;
    favicon?: string;
    isLoading: boolean;
  }>;
  activeTabId: string | undefined;
  canGoBack: boolean;
  canGoForward: boolean;
  platform: NodeJS.Platform;
}

interface TabBarAPI {
  onStateUpdated: (callback: (state: TabBarState) => void) => () => void;
  createTab: () => void;
  closeTab: (id: string) => void;
  switchTab: (id: string) => void;
  goBack: () => void;
  goForward: () => void;
}

const api: TabBarAPI = {
  onStateUpdated: (callback: (state: TabBarState) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, state: TabBarState) => callback(state);
    ipcRenderer.on("tabbar:state-updated", handler);
    return () => ipcRenderer.removeListener("tabbar:state-updated", handler);
  },

  createTab: () => ipcRenderer.send("tab:create", "/"),
  closeTab: (id: string) => ipcRenderer.send("tab:close", id),
  switchTab: (id: string) => ipcRenderer.send("tab:switch", id),
  goBack: () => ipcRenderer.send("nav:back"),
  goForward: () => ipcRenderer.send("nav:forward"),
};

contextBridge.exposeInMainWorld("tabBarAPI", api);
