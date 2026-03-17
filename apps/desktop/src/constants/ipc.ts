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

// IPC channel names as constants
export const IPC_CHANNELS = {
  OPEN_EXTERNAL: "open-external",
  INSTANCE_SET: "instance:set",
  INSTANCE_GET: "instance:get",
  TABBAR_STATE_UPDATED: "tabbar:state-updated",
  TAB_CREATE: "tab:create",
  TAB_CLOSE: "tab:close",
  TAB_CLOSE_OTHERS: "tab:close-others",
  TAB_CLOSE_ALL: "tab:close-all",
  TAB_RELOAD: "tab:reload",
  TAB_COPY_LINK: "tab:copy-link",
  TAB_CONTEXT_MENU: "tab:context-menu",
  TAB_SWITCH: "tab:switch",
  TAB_MOVE: "tab:move",
  NAV_BACK: "nav:back",
  NAV_FORWARD: "nav:forward",
  PKCE_START: "pkce:start-flow",
  PKCE_GET_VERIFIER: "pkce:get-verifier",
} as const;
