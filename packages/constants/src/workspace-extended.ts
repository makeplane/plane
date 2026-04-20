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

import type { IWorkspaceSidebarNavigationItem } from "./workspace";

export const EXTENDED_WORKSPACE_SIDEBAR_DYNAMIC_NAVIGATION_ITEMS: Record<string, IWorkspaceSidebarNavigationItem> = {
  dashboards: {
    key: "dashboards",
    labelTranslationKey: "workspace_dashboards",
    href: `/dashboards/`,
    highlight: (pathname: string, url: string) => pathname.includes(url),
  },
  "active-cycles": {
    key: "active-cycles",
    labelTranslationKey: "cycles",
    href: `/active-cycles/`,
    highlight: (pathname: string, url: string) => pathname.includes(url),
  },
  initiatives: {
    key: "initiatives",
    labelTranslationKey: "initiatives.label",
    href: `/initiatives/`,
    highlight: (pathname: string, url: string) => pathname.includes(url),
  },
  teamspaces: {
    key: "team_spaces",
    labelTranslationKey: "teamspaces.label",
    href: `/teamspaces/`,
    highlight: (pathname: string, url: string) => pathname.includes(url),
  },
  customers: {
    key: "customers",
    labelTranslationKey: "sidebar.customers",
    href: `/customers/`,
    highlight: (pathname: string, url: string) => pathname.includes(url),
  },
};

export const EXTENDED_WORKSPACE_SIDEBAR_STATIC_NAVIGATION_ITEMS: Record<string, IWorkspaceSidebarNavigationItem> = {
  "pi-chat": {
    key: "pi_chat",
    labelTranslationKey: "pi_chat",
    href: `/ai-chat/`,
    highlight: (pathname: string, url: string) => pathname.includes(url),
  },
};

export const EXTENDED_WORKSPACE_RESULT_ENTITIES = {
  epic: [],
  team: [],
  initiative: [],
};
