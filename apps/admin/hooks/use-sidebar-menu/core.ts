/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { BrainCog, Users } from "lucide-react";
// plane imports
import { ImageOutline, LockOutline, MailOutline, SettingsOutline, WorkspaceOutline } from "@makeplane/propel/icons";
// types
import type { TSidebarMenuItem } from "./types";

export type TCoreSidebarMenuKey = "general" | "email" | "workspace" | "users" | "authentication" | "ai" | "image";

export const coreSidebarMenuLinks: Record<TCoreSidebarMenuKey, TSidebarMenuItem> = {
  general: {
    Icon: SettingsOutline,
    name: "基本设置",
    description: "查看和配置系统基本信息。",
    href: `/general/`,
  },
  email: {
    Icon: MailOutline,
    name: "邮件服务",
    description: "配置系统邮件发送服务。",
    href: `/email/`,
  },
  workspace: {
    Icon: WorkspaceOutline,
    name: "工作空间管理",
    description: "创建和管理系统中的工作空间。",
    href: `/workspace/`,
  },
  users: {
    Icon: Users,
    name: "用户与角色",
    description: "为已有用户配置开发管理员、运维管理员和主 PI 身份。",
    href: `/users/`,
  },
  authentication: {
    Icon: LockOutline,
    name: "登录设置",
    description: "配置可用的登录方式。",
    href: `/authentication/`,
  },
  ai: {
    Icon: BrainCog,
    name: "人工智能",
    description: "配置 AI 服务连接。",
    href: `/ai/`,
  },
  image: {
    Icon: ImageOutline,
    name: "图片服务",
    description: "配置第三方图片资源。",
    href: `/image/`,
  },
};
