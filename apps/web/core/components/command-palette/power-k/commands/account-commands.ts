"use client";

import { FolderPlus, Settings } from "lucide-react";
// local imports
import type { CommandConfig } from "../types";

export const createAccountCommands = (
  createNewWorkspace: () => void,
  openThemeSettings: () => void
): CommandConfig[] => [
  {
    id: "create-workspace",
    type: "creation",
    group: "account",
    title: "Create new workspace",
    description: "Create a new workspace",
    icon: FolderPlus,
    isEnabled: () => true,
    isVisible: () => true,
    action: createNewWorkspace,
  },
  {
    id: "change-theme",
    type: "settings",
    group: "account",
    title: "Change interface theme",
    description: "Change the interface theme",
    icon: Settings,
    isEnabled: () => true,
    isVisible: () => true,
    action: openThemeSettings,
  },
];
