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

/**
 * Type declarations for Plane Desktop Electron APIs
 *
 * These types are exposed by the desktop app's preload scripts
 * and are available on the window object when running in Electron.
 */
interface PlaneDesktopAPI {
  /** The current platform (darwin, win32, linux) */
  platform: NodeJS.Platform;
  /** Set the Plane instance URL */
  setInstanceUrl: (url: string) => void;
  /** Get the stored Plane instance URL */
  getInstanceUrl: () => Promise<string | null>;
  /** Open a URL in the system's default browser */
  openExternal: (url: string) => void;
  /** Start PKCE flow: generates code_verifier in main process, returns code_challenge */
  startPKCEFlow: () => Promise<{ code_challenge: string; challenge_method: string }>;
  /** Get the code_verifier for token exchange (single-use, clears after retrieval) */
  getCodeVerifier: () => Promise<string | null>;
  /** Set the app icon badge count (dock on macOS, taskbar on Linux) */
  setBadgeCount: (count: number) => void;
}

declare global {
  interface Window {
    /** Plane Desktop API - only available when running in Electron */
    planeDesktop?: PlaneDesktopAPI;
  }
}

export {};
