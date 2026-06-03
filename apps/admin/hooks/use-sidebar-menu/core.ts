/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import {
  Activity,
  BookOpen,
  Briefcase,
  CalendarDays,
  Image,
  BrainCog,
  Cog,
  Mail,
  Users,
  Network,
  UserCheck,
  ShieldCheck,
  Tag,
  Gauge,
} from "lucide-react";
// plane imports
import { LockIcon, WorkspaceIcon } from "@plane/propel/icons";
// types
import type { TPermissionKey, TSidebarMenuItem } from "./types";

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
  | "help-center"
  | "job-positions"
  | "calendar"
  | "usage-monitor"
  | "administrators";

// Grantable permission keys — MUST mirror backend
// plane/license/menu_registry.py PERMISSION_KEYS exactly (12 keys; no
// standalone "authentication" — it is grouped under "settings").
export const PERMISSION_KEYS: TPermissionKey[] = [
  "settings",
  "workspace",
  "users",
  "departments",
  "staff",
  "monitoring",
  "task-categories",
  "help-center",
  "job-positions",
  "calendar",
  "usage-monitor",
  "administrators",
];

// Labels for the grant multi-select in the Administrators UI.
export const PERMISSION_LABELS: Record<TPermissionKey, string> = {
  settings: "Settings (General, Email, AI, Images, Authentication)",
  workspace: "Workspaces",
  users: "Users",
  departments: "Departments",
  staff: "Staff",
  monitoring: "Monitoring",
  "task-categories": "Task Categories",
  "help-center": "Help Center",
  "job-positions": "Job Positions",
  calendar: "Business Calendar",
  "usage-monitor": "Usage Monitor",
  administrators: "Administrators",
};

export const coreSidebarMenuLinks: Record<TCoreSidebarMenuKey, TSidebarMenuItem> = {
  general: {
    Icon: Cog,
    name: "General",
    description: "Identify your instances and get key details.",
    href: `/general/`,
    permission: "settings",
  },
  email: {
    Icon: Mail,
    name: "Email",
    description: "Configure your SMTP controls.",
    href: `/email/`,
    permission: "settings",
  },
  workspace: {
    Icon: WorkspaceIcon,
    name: "Workspaces",
    description: "Manage all workspaces on this instance.",
    href: `/workspace/`,
    permission: "workspace",
  },
  users: {
    Icon: Users,
    name: "Users",
    description: "Manage all users on this instance.",
    href: `/users/`,
    permission: "users",
  },
  departments: {
    Icon: Network,
    name: "Departments",
    description: "Manage organizational departments.",
    href: `/departments/`,
    permission: "departments",
  },
  staff: {
    Icon: UserCheck,
    name: "Staff",
    description: "Manage staff profiles across all departments.",
    href: `/staff/`,
    permission: "staff",
  },
  authentication: {
    Icon: LockIcon,
    name: "Authentication",
    description: "Configure authentication modes.",
    href: `/authentication/`,
    permission: "settings",
  },
  ai: {
    Icon: BrainCog,
    name: "Artificial intelligence",
    description: "Configure your OpenAI creds.",
    href: `/ai/`,
    permission: "settings",
  },
  image: {
    Icon: Image,
    name: "Images in Plane",
    description: "Allow third-party image libraries.",
    href: `/image/`,
    permission: "settings",
  },
  monitoring: {
    Icon: Activity,
    name: "Monitoring",
    description: "System health and email metrics.",
    href: `/monitoring/`,
    permission: "monitoring",
  },
  "task-categories": {
    Icon: Tag,
    name: "Task Categories",
    description: "Manage main and sub task categories for work items.",
    href: `/task-categories/`,
    permission: "task-categories",
  },
  "help-center": {
    Icon: BookOpen,
    name: "Help Center",
    description: "Author the shared multilingual help guide for all workspaces.",
    href: `/help-center/`,
    permission: "help-center",
  },
  "job-positions": {
    Icon: Briefcase,
    name: "Job Positions",
    description: "Manage job positions and grades.",
    href: `/job-positions/`,
    permission: "job-positions",
  },
  calendar: {
    Icon: CalendarDays,
    name: "Business Calendar",
    description: "Manage working schedules and public holidays.",
    href: `/calendar/`,
    permission: "calendar",
  },
  "usage-monitor": {
    Icon: Gauge,
    name: "Usage Monitor",
    description: "Track user activity and logged-time usage.",
    href: `/usage-monitor/`,
    permission: "usage-monitor",
  },
  administrators: {
    Icon: ShieldCheck,
    name: "Administrators",
    description: "Manage instance admins and their menu access.",
    href: `/administrators/`,
    permission: "administrators",
  },
};
