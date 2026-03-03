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

interface PlaneDesktopAPI {
  platform: NodeJS.Platform;
  setInstanceUrl: (url: string) => void;
  getInstanceUrl: () => Promise<string | undefined>;
  openExternal: (url: string) => void;
  startPKCEFlow: () => Promise<{ code_challenge: string; challenge_method: string }>;
  getCodeVerifier: () => Promise<string | null>;
}

const api: PlaneDesktopAPI = {
  platform: process.platform,

  // Instance
  setInstanceUrl: (url: string) => ipcRenderer.send(IPC_CHANNELS.INSTANCE_SET, url),
  getInstanceUrl: () => ipcRenderer.invoke(IPC_CHANNELS.INSTANCE_GET),

  // Utilities
  openExternal: (url: string) => ipcRenderer.send(IPC_CHANNELS.OPEN_EXTERNAL, url),

  // PKCE for desktop OAuth security
  startPKCEFlow: () => ipcRenderer.invoke(IPC_CHANNELS.PKCE_START),
  getCodeVerifier: () => ipcRenderer.invoke(IPC_CHANNELS.PKCE_GET_VERIFIER),
};

contextBridge.exposeInMainWorld("planeDesktop", api);
