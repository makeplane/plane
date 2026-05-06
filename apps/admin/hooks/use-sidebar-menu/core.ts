/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import {
  Activity,
  Briefcase,
  CalendarDays,
  Image,
  BrainCog,
  Cog,
  Mail,
  Users,
  Network,
  UserCheck,
  Tag,
} from "lucide-react";
// plane imports
import { LockIcon, WorkspaceIcon } from "@plane/propel/icons";
// types
import type { TSidebarMenuItem } from "./types";

export type TCoreSidebarMenuKey =
  | "general"
  | "email"
  | "workspace"
  | "users"
  | "departments"
  | "staff"
  | "authentication"
  | "ai"
  | "image"
  | "monitoring"
  | "task-categories"
  | "job-positions"
  | "calendar";

export const coreSidebarMenuLinks: Record<TCoreSidebarMenuKey, TSidebarMenuItem> = {
  general: {
    Icon: Cog,
    name: "General",
    description: "Identify your instances and get key details.",
    href: `/general/`,
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
  users: {
    Icon: Users,
    name: "Users",
    description: "Manage all users on this instance.",
    href: `/users/`,
  },
  departments: {
    Icon: Network,
    name: "Departments",
    description: "Manage organizational departments.",
    href: `/departments/`,
  },
  staff: {
    Icon: UserCheck,
    name: "Staff",
    description: "Manage staff profiles across all departments.",
    href: `/staff/`,
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
  },
  image: {
    Icon: Image,
    name: "Images in Plane",
    description: "Allow third-party image libraries.",
    href: `/image/`,
  },
  monitoring: {
    Icon: Activity,
    name: "Monitoring",
    description: "System health and email metrics.",
    href: `/monitoring/`,
  },
  "task-categories": {
    Icon: Tag,
    name: "Task Categories",
    description: "Manage main and sub task categories for work items.",
    href: `/task-categories/`,
  },
  "job-positions": {
    Icon: Briefcase,
    name: "Job Positions",
    description: "Manage job positions and grades.",
    href: `/job-positions/`,
  },
  calendar: {
    Icon: CalendarDays,
    name: "Business Calendar",
    description: "Manage working schedules and public holidays.",
    href: `/calendar/`,
  },
};
