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
import { IPC_CHANNELS } from "./constants/ipc";

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
  closeOtherTabs: (id: string) => void;
  closeAllTabs: () => void;
  reloadTab: (id: string) => void;
  copyTabLink: (id: string) => void;
  showContextMenu: (id: string) => void;
  switchTab: (id: string) => void;
  moveTab: (tabId: string, toIndex: number) => void;
  goBack: () => void;
  goForward: () => void;
}

const api: TabBarAPI = {
  onStateUpdated: (callback: (state: TabBarState) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, state: TabBarState) => callback(state);
    ipcRenderer.on(IPC_CHANNELS.TABBAR_STATE_UPDATED, handler);
    return () => ipcRenderer.removeListener(IPC_CHANNELS.TABBAR_STATE_UPDATED, handler);
  },

  createTab: () => ipcRenderer.send(IPC_CHANNELS.TAB_CREATE, "/"),
  closeTab: (id: string) => ipcRenderer.send(IPC_CHANNELS.TAB_CLOSE, id),
  closeOtherTabs: (id: string) => ipcRenderer.send(IPC_CHANNELS.TAB_CLOSE_OTHERS, id),
  closeAllTabs: () => ipcRenderer.send(IPC_CHANNELS.TAB_CLOSE_ALL),
  reloadTab: (id: string) => ipcRenderer.send(IPC_CHANNELS.TAB_RELOAD, id),
  copyTabLink: (id: string) => ipcRenderer.send(IPC_CHANNELS.TAB_COPY_LINK, id),
  showContextMenu: (id: string) => ipcRenderer.send(IPC_CHANNELS.TAB_CONTEXT_MENU, id),
  switchTab: (id: string) => ipcRenderer.send(IPC_CHANNELS.TAB_SWITCH, id),
  moveTab: (tabId: string, toIndex: number) => ipcRenderer.send(IPC_CHANNELS.TAB_MOVE, tabId, toIndex),
  goBack: () => ipcRenderer.send(IPC_CHANNELS.NAV_BACK),
  goForward: () => ipcRenderer.send(IPC_CHANNELS.NAV_FORWARD),
};

contextBridge.exposeInMainWorld("tabBarAPI", api);
