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
 */
export interface PlaneDesktopAPI {
  // Platform
  platform: NodeJS.Platform;

  // Instance
  setInstanceUrl: (url: string) => void;
  getInstanceUrl: () => Promise<string | undefined>;

  // Utilities
  openExternal: (url: string) => void;

  // PKCE for desktop OAuth security
  startPKCEFlow: () => Promise<{ code_challenge: string; challenge_method: string }>;
  getCodeVerifier: () => Promise<string | null>;
}

declare global {
  interface Window {
    planeDesktop?: PlaneDesktopAPI;
  }
}
