"use client";

import { FolderPlus, Settings } from "lucide-react";
// local imports
import type { CommandConfig, CommandExecutionContext } from "../types";

export const accountCommandsRegistry = (executionContext: CommandExecutionContext): CommandConfig[] => {
  const { closePalette, setPages, setPlaceholder, setSearchTerm, router } = executionContext;

  return [
    {
      id: "create-workspace",
      type: "creation",
      group: "account",
      title: "Create new workspace",
      description: "Create a new workspace",
      icon: FolderPlus,
      isEnabled: () => true,
      isVisible: () => true,
      action: () => {
        closePalette();
        router.push("/create-workspace");
      },
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
      action: () => {
        setPlaceholder("Change interface theme");
        setSearchTerm("");
        setPages((pages) => [...pages, "change-theme"]);
      },
    },
  ];
};
