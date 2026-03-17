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

import { ipcMain, shell, IpcMainEvent, WebContents } from "electron";
import { InstanceStore } from "../stores/instance-store";
import { ViewManager } from "../managers/view-manager";
import { generateCodeVerifier, computeCodeChallenge } from "../utils/pkce";
import { IPC_CHANNELS } from "../constants/ipc";

export class IPCBridge {
  #instanceStore: InstanceStore;
  #resolveViewManager: (sender: WebContents) => ViewManager | undefined;
  #onInstanceUrlChanged: () => void;

  // Handler references for cleanup
  #openExternalHandler: ((event: IpcMainEvent, url: string) => void) | undefined = undefined;
  #instanceSetHandler: ((event: IpcMainEvent, url: string) => void) | undefined = undefined;
  #tabCreateHandler: ((event: IpcMainEvent, tabPath: string) => void) | undefined = undefined;
  #tabCloseHandler: ((event: IpcMainEvent, id: string) => void) | undefined = undefined;
  #tabSwitchHandler: ((event: IpcMainEvent, id: string) => void) | undefined = undefined;
  #navBackHandler: ((event: IpcMainEvent) => void) | undefined = undefined;
  #navForwardHandler: ((event: IpcMainEvent) => void) | undefined = undefined;

  // PKCE: stores the code_verifier for the current OAuth flow
  #pendingCodeVerifier: string | null = null;

  constructor(
    instanceStore: InstanceStore,
    resolveViewManager: (sender: WebContents) => ViewManager | undefined,
    onInstanceUrlChanged: () => void
  ) {
    this.#instanceStore = instanceStore;
    this.#resolveViewManager = resolveViewManager;
    this.#onInstanceUrlChanged = onInstanceUrlChanged;
    this.#setupIPCHandlers();
  }

  initialize(): void {
    // No-op - kept for API compatibility
  }

  destroy(): void {
    // Remove ipcMain.on() listeners
    if (this.#openExternalHandler) {
      ipcMain.removeListener(IPC_CHANNELS.OPEN_EXTERNAL, this.#openExternalHandler);
      this.#openExternalHandler = undefined;
    }

    if (this.#instanceSetHandler) {
      ipcMain.removeListener(IPC_CHANNELS.INSTANCE_SET, this.#instanceSetHandler);
      this.#instanceSetHandler = undefined;
    }

    if (this.#tabCreateHandler) {
      ipcMain.removeListener(IPC_CHANNELS.TAB_CREATE, this.#tabCreateHandler);
      this.#tabCreateHandler = undefined;
    }

    if (this.#tabCloseHandler) {
      ipcMain.removeListener(IPC_CHANNELS.TAB_CLOSE, this.#tabCloseHandler);
      this.#tabCloseHandler = undefined;
    }

    if (this.#tabSwitchHandler) {
      ipcMain.removeListener(IPC_CHANNELS.TAB_SWITCH, this.#tabSwitchHandler);
      this.#tabSwitchHandler = undefined;
    }

    if (this.#navBackHandler) {
      ipcMain.removeListener(IPC_CHANNELS.NAV_BACK, this.#navBackHandler);
      this.#navBackHandler = undefined;
    }

    if (this.#navForwardHandler) {
      ipcMain.removeListener(IPC_CHANNELS.NAV_FORWARD, this.#navForwardHandler);
      this.#navForwardHandler = undefined;
    }

    // Remove ipcMain.handle() handlers (do not require handler references)
    ipcMain.removeHandler(IPC_CHANNELS.INSTANCE_GET);
    ipcMain.removeHandler(IPC_CHANNELS.PKCE_START);
    ipcMain.removeHandler(IPC_CHANNELS.PKCE_GET_VERIFIER);

    this.#pendingCodeVerifier = null;
  }

  #setupIPCHandlers(): void {
    // open-external handler
    this.#openExternalHandler = (_event, url: string) => {
      // If URL is already absolute, open it directly
      if (url.startsWith("http://") || url.startsWith("https://")) {
        void shell.openExternal(url);
        return;
      }

      // Relative URL — resolve against the configured instance URL
      const instanceUrl = this.#instanceStore.getInstanceUrl();
      if (!instanceUrl) {
        console.error(`Cannot open relative URL "${url}" - no instance URL configured`);
        return;
      }

      try {
        const absoluteUrl = new URL(url, instanceUrl).href;
        void shell.openExternal(absoluteUrl);
      } catch {
        console.error(`Failed to resolve URL "${url}" against instance "${instanceUrl}"`);
      }
    };
    ipcMain.on(IPC_CHANNELS.OPEN_EXTERNAL, this.#openExternalHandler);

    // instance:set handler
    this.#instanceSetHandler = (_event, url: string) => {
      const success = this.#instanceStore.setInstanceUrl(url);
      if (success) {
        this.#onInstanceUrlChanged();
      }
    };
    ipcMain.on(IPC_CHANNELS.INSTANCE_SET, this.#instanceSetHandler);

    // instance:get handler (uses handle, not on)
    ipcMain.handle(IPC_CHANNELS.INSTANCE_GET, () => {
      return this.#instanceStore.getInstanceUrl();
    });

    // Tab management - called from tab bar preload
    this.#tabCreateHandler = (event, tabPath: string = "/") => {
      const viewManager = this.#resolveViewManager(event.sender);
      if (!viewManager) {
        return;
      }

      viewManager.createTab(tabPath);
    };
    ipcMain.on(IPC_CHANNELS.TAB_CREATE, this.#tabCreateHandler);

    this.#tabCloseHandler = (event, id: string) => {
      const viewManager = this.#resolveViewManager(event.sender);
      if (!viewManager) {
        return;
      }

      viewManager.closeTab(id);
    };
    ipcMain.on(IPC_CHANNELS.TAB_CLOSE, this.#tabCloseHandler);

    this.#tabSwitchHandler = (event, id: string) => {
      const viewManager = this.#resolveViewManager(event.sender);
      if (!viewManager) {
        return;
      }

      viewManager.switchTab(id);
    };
    ipcMain.on(IPC_CHANNELS.TAB_SWITCH, this.#tabSwitchHandler);

    // Navigation - called from tab bar preload
    this.#navBackHandler = (event) => {
      const viewManager = this.#resolveViewManager(event.sender);
      if (!viewManager) {
        return;
      }

      viewManager.goBack();
    };
    ipcMain.on(IPC_CHANNELS.NAV_BACK, this.#navBackHandler);

    this.#navForwardHandler = (event) => {
      const viewManager = this.#resolveViewManager(event.sender);
      if (!viewManager) {
        return;
      }

      viewManager.goForward();
    };
    ipcMain.on(IPC_CHANNELS.NAV_FORWARD, this.#navForwardHandler);

    // PKCE handlers for desktop OAuth security
    ipcMain.handle(IPC_CHANNELS.PKCE_START, () => {
      const codeVerifier = generateCodeVerifier();
      this.#pendingCodeVerifier = codeVerifier;
      const codeChallenge = computeCodeChallenge(codeVerifier);
      return { code_challenge: codeChallenge, challenge_method: "S256" };
    });

    ipcMain.handle(IPC_CHANNELS.PKCE_GET_VERIFIER, () => {
      const verifier = this.#pendingCodeVerifier;
      this.#pendingCodeVerifier = null;
      return verifier;
    });
  }
}
