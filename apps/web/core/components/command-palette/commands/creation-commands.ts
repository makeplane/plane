"use client";

import { FolderPlus } from "lucide-react";
import { LayersIcon } from "@plane/propel/icons";
import { CommandConfig } from "../types";

export const createCreationCommands = (
  toggleCreateIssueModal: (open: boolean) => void,
  toggleCreateProjectModal: (open: boolean) => void,
  canPerformAnyCreateAction: () => boolean,
  canPerformWorkspaceActions: () => boolean,
  workspaceSlug?: string,
  workspaceProjectIds?: string[]
): CommandConfig[] => [
  {
    id: "create-work-item",
    type: "creation",
    group: "create",
    title: "Create new work item",
    description: "Create a new work item in the current project",
    icon: LayersIcon,
    shortcut: "c",
    isEnabled: canPerformAnyCreateAction,
    isVisible: () => Boolean(workspaceSlug && workspaceProjectIds && workspaceProjectIds.length > 0),
    action: () => toggleCreateIssueModal(true),
  },
  {
    id: "create-project",
    type: "creation",
    group: "project",
    title: "Create new project",
    description: "Create a new project in the current workspace",
    icon: FolderPlus,
    shortcut: "p",
    isEnabled: canPerformWorkspaceActions,
    isVisible: () => Boolean(workspaceSlug),
    action: () => toggleCreateProjectModal(true),
  },
];
