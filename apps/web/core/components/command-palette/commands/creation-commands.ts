"use client";

import { FolderPlus, FileText, Layers } from "lucide-react";
import { LayersIcon, ContrastIcon, DiceIcon } from "@plane/propel/icons";
import { CommandConfig, CommandExecutionContext } from "../types";

/**
 * Creation commands - Create any entity in the app
 * Uses the new modal step type for opening creation modals
 */
export const createCreationCommands = (
  executionContext: CommandExecutionContext,
  toggleCreateIssueModal: (open: boolean) => void,
  toggleCreateProjectModal: (open: boolean) => void,
  toggleCreateCycleModal: (open: boolean) => void,
  toggleCreateModuleModal: (open: boolean) => void,
  toggleCreateViewModal: (open: boolean) => void,
  toggleCreatePageModal: (params: { isOpen: boolean }) => void
): CommandConfig[] => [
  // ============================================================================
  // Work Item Creation
  // ============================================================================
  {
    id: "create-work-item",
    type: "creation",
    group: "create",
    title: "Create new work item",
    description: "Create a new work item in the current project",
    icon: LayersIcon,
    shortcut: "c",
    steps: [
      {
        type: "modal",
        modalAction: () => {
          executionContext.closePalette();
          toggleCreateIssueModal(true);
        },
      },
    ],
    isEnabled: (context) => Boolean(context.canPerformAnyCreateAction),
    isVisible: (context) => Boolean(context.workspaceSlug),
  },

  // ============================================================================
  // Project Creation
  // ============================================================================
  {
    id: "create-project",
    type: "creation",
    group: "create",
    title: "Create new project",
    description: "Create a new project in the current workspace",
    icon: FolderPlus,
    shortcut: "p",
    steps: [
      {
        type: "modal",
        modalAction: () => {
          executionContext.closePalette();
          toggleCreateProjectModal(true);
        },
      },
    ],
    isEnabled: (context) => Boolean(context.canPerformWorkspaceActions),
    isVisible: (context) => Boolean(context.workspaceSlug),
  },

  // ============================================================================
  // Cycle Creation (Project-level only)
  // ============================================================================
  {
    id: "create-cycle",
    type: "creation",
    group: "create",
    title: "Create new cycle",
    description: "Create a new cycle in the current project",
    icon: ContrastIcon,
    shortcut: "q",
    showOnRoutes: ["project", "cycle"],
    steps: [
      {
        type: "modal",
        modalAction: () => {
          executionContext.closePalette();
          toggleCreateCycleModal(true);
        },
      },
    ],
    isEnabled: (context) => Boolean(context.canPerformProjectActions),
    isVisible: (context) => Boolean(context.workspaceSlug && context.projectId),
  },

  // ============================================================================
  // Module Creation (Project-level only)
  // ============================================================================
  {
    id: "create-module",
    type: "creation",
    group: "create",
    title: "Create new module",
    description: "Create a new module in the current project",
    icon: DiceIcon,
    shortcut: "m",
    showOnRoutes: ["project", "module"],
    steps: [
      {
        type: "modal",
        modalAction: () => {
          executionContext.closePalette();
          toggleCreateModuleModal(true);
        },
      },
    ],
    isEnabled: (context) => Boolean(context.canPerformProjectActions),
    isVisible: (context) => Boolean(context.workspaceSlug && context.projectId),
  },

  // ============================================================================
  // View Creation (Project-level only)
  // ============================================================================
  {
    id: "create-view",
    type: "creation",
    group: "create",
    title: "Create new view",
    description: "Create a new view in the current project",
    icon: Layers,
    shortcut: "v",
    showOnRoutes: ["project", "view"],
    steps: [
      {
        type: "modal",
        modalAction: () => {
          executionContext.closePalette();
          toggleCreateViewModal(true);
        },
      },
    ],
    isEnabled: (context) => Boolean(context.canPerformProjectActions),
    isVisible: (context) => Boolean(context.workspaceSlug && context.projectId),
  },

  // ============================================================================
  // Page Creation (Project-level only)
  // ============================================================================
  {
    id: "create-page",
    type: "creation",
    group: "create",
    title: "Create new page",
    description: "Create a new page in the current project",
    icon: FileText,
    shortcut: "d",
    showOnRoutes: ["project", "page"],
    steps: [
      {
        type: "modal",
        modalAction: () => {
          executionContext.closePalette();
          toggleCreatePageModal({ isOpen: true });
        },
      },
    ],
    isEnabled: (context) => Boolean(context.canPerformProjectActions),
    isVisible: (context) => Boolean(context.workspaceSlug && context.projectId),
  },
];
