import { Image, BrainCog, Cog, Mail, Users, Shield } from "lucide-react";
// plane imports
import { LockIcon, WorkspaceIcon } from "@plane/propel/icons";
// types
import type { TSidebarMenuItem } from "./types";

export type TCoreSidebarMenuKey = "general" | "email" | "workspace" | "authentication" | "ai" | "image" | "assignmentGroups" | "cabGroups";

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
    name: "Images in WinSecOps",
    description: "Allow third-party image libraries.",
    href: `/image/`,
  },
  assignmentGroups: {
    Icon: Users,
    name: "Assignment Groups",
    description: "Manage assignment groups for change management.",
    href: `/assignment-groups/`,
  },
  cabGroups: {
    Icon: Shield,
    name: "CAB Groups",
    description: "Manage Change Advisory Board groups.",
    href: `/cab-groups/`,
  },
};
