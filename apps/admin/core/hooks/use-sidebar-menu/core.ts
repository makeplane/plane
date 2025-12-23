import { Image, BrainCog, Cog, Lock, Mail } from "lucide-react";
// plane imports
import { WorkspaceIcon } from "@plane/propel/icons";
// types
import type { TSidebarMenuItem } from "./types";

export type TCoreSidebarMenuKey = "general" | "email" | "workspace" | "authentication" | "ai" | "image";

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
    Icon: Lock,
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
};
