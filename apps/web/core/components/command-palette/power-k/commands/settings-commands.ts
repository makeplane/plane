"use client";

import { Settings } from "lucide-react";
// local imports
import type { CommandConfig } from "../types";

export const settingsCommandsRegistry = (
  openWorkspaceSettings: () => void,
  canPerformWorkspaceActions: () => boolean
): CommandConfig[] => [
  {
    id: "search-settings",
    type: "settings",
    group: "workspace",
    title: "Search settings",
    description: "Search workspace settings",
    icon: Settings,
    isEnabled: canPerformWorkspaceActions,
    isVisible: canPerformWorkspaceActions,
    action: openWorkspaceSettings,
  },
];
