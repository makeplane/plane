"use client";

import { LogOut, UserPlus, Copy, SidebarIcon, Download, Moon, Sun, Monitor, UserMinus } from "lucide-react";
// local imports
import type { CommandConfig } from "../types";

/**
 * Extra action commands - Miscellaneous actions and utilities
 * These are commands that don't fit into other categories but provide important functionality
 */

export const extraCommandsRegistry = (
  signOut: () => void,
  toggleInviteModal: () => void,
  copyCurrentPageUrl: () => void,
  toggleSidebar: () => void,
  leaveWorkspace: () => Promise<void>,
  setTheme: (theme: "light" | "dark" | "system") => void
): CommandConfig[] => [
  // ============================================================================
  // User Account Actions
  // ============================================================================
  {
    id: "sign-out",
    type: "action",
    group: "account",
    title: "Sign out",
    description: "Sign out of your account",
    icon: LogOut,
    steps: [
      {
        type: "action",
        action: () => {
          signOut();
        },
      },
    ],
    isVisible: () => true,
  },

  // ============================================================================
  // Workspace Actions
  // ============================================================================
  {
    id: "invite-members",
    type: "action",
    group: "workspace",
    title: "Invite members",
    description: "Invite people to this workspace",
    icon: UserPlus,
    steps: [
      {
        type: "modal",
        modalAction: () => {
          toggleInviteModal();
        },
      },
    ],
    isVisible: (context) => Boolean(context.workspaceSlug),
    isEnabled: (context) => Boolean(context.canPerformWorkspaceActions),
  },

  {
    id: "leave-workspace",
    type: "action",
    group: "workspace",
    title: "Leave workspace",
    description: "Leave this workspace",
    icon: UserMinus,
    steps: [
      {
        type: "action",
        action: async () => {
          await leaveWorkspace();
        },
      },
    ],
    isVisible: (context) => Boolean(context.workspaceSlug),
    isEnabled: (context) => !Boolean(context.canPerformWorkspaceActions), // Only non-admins can leave
  },

  // ============================================================================
  // UI Actions
  // ============================================================================
  {
    id: "copy-page-url",
    type: "action",
    group: "help",
    title: "Copy page URL",
    description: "Copy the URL of the current page to clipboard",
    icon: Copy,
    steps: [
      {
        type: "action",
        action: () => {
          copyCurrentPageUrl();
        },
      },
    ],
    isVisible: () => true,
  },

  {
    id: "toggle-sidebar",
    type: "action",
    group: "help",
    title: "Toggle sidebar",
    description: "Show or hide the sidebar",
    icon: SidebarIcon,
    shortcut: "b",
    steps: [
      {
        type: "action",
        action: () => {
          toggleSidebar();
        },
      },
    ],
    isVisible: () => true,
  },

  // ============================================================================
  // Theme Actions
  // ============================================================================
  {
    id: "theme-light",
    type: "action",
    group: "account",
    title: "Switch to light theme",
    description: "Use light theme",
    icon: Sun,
    steps: [
      {
        type: "action",
        action: () => {
          setTheme("light");
        },
      },
    ],
    isVisible: () => true,
  },

  {
    id: "theme-dark",
    type: "action",
    group: "account",
    title: "Switch to dark theme",
    description: "Use dark theme",
    icon: Moon,
    steps: [
      {
        type: "action",
        action: () => {
          setTheme("dark");
        },
      },
    ],
    isVisible: () => true,
  },

  {
    id: "theme-system",
    type: "action",
    group: "account",
    title: "Use system theme",
    description: "Follow system theme preference",
    icon: Monitor,
    steps: [
      {
        type: "action",
        action: () => {
          setTheme("system");
        },
      },
    ],
    isVisible: () => true,
  },

  // ============================================================================
  // Download Links (Mobile & Desktop apps)
  // ============================================================================
  {
    id: "download-desktop-app",
    type: "action",
    group: "help",
    title: "Download desktop app",
    description: "Download Plane for desktop",
    icon: Download,
    steps: [
      {
        type: "action",
        action: () => {
          window.open("https://plane.so/downloads", "_blank");
        },
      },
    ],
    isVisible: () => true,
  },

  {
    id: "download-mobile-app",
    type: "action",
    group: "help",
    title: "Download mobile app",
    description: "Download Plane for mobile",
    icon: Download,
    steps: [
      {
        type: "action",
        action: () => {
          window.open("https://plane.so/downloads", "_blank");
        },
      },
    ],
    isVisible: () => true,
  },
];
