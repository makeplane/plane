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

import { Image, BrainCog, Cog, Mail, CreditCard, Users, SlidersHorizontal, ShieldHalf } from "lucide-react";
// plane imports
import { LockIcon, WorkspaceIcon } from "@plane/propel/icons";
// types
import type { TSidebarMenuItem } from "./types";

export type TCoreSidebarMenuKey =
  | "general"
  | "configurations"
  | "email"
  | "workspace"
  | "authentication"
  | "ai"
  | "image"
  | "billing"
  | "user-management"
  | "security";

export const coreSidebarMenuLinks: Record<TCoreSidebarMenuKey, TSidebarMenuItem> = {
  general: {
    Icon: Cog,
    name: "General",
    description: "Identify your instances and get key details.",
    href: `/general/`,
  },
  configurations: {
    Icon: SlidersHorizontal,
    name: "Configurations",
    description: "Manage project and system configurations.",
    href: `/configurations/`,
  },
  email: {
    Icon: Mail,
    name: "Email",
    description: "Configure your SMTP controls.",
    href: `/email/`,
  },
  workspace: {
    Icon: WorkspaceIcon,
    name: "Workspaces",
    description: "Manage all workspaces on this instance.",
    href: `/workspace/`,
  },
  authentication: {
    Icon: LockIcon,
    name: "Authentication",
    description: "Configure authentication modes.",
    href: `/authentication/`,
  },
  ai: {
    Icon: BrainCog,
    name: "Artificial intelligence",
    description: "Configure your OpenAI creds.",
    href: `/ai/`,
    deprecated: true,
  },
  image: {
    Icon: Image,
    name: "Images in Plane",
    description: "Allow third-party image libraries.",
    href: `/image/`,
  },
  billing: {
    Icon: CreditCard,
    name: "Billing",
    description: "Active plans",
    href: `/billing/`,
  },
  "user-management": {
    Icon: Users,
    name: "User Management",
    description: "Instance user management",
    href: `/user-management/`,
  },
  security: {
    Icon: ShieldHalf,
    name: "Security",
    description: "Instance security settings",
    href: `/security/`,
  },
};
