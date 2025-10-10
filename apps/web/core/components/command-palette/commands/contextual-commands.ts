"use client";

import { LinkIcon, Signal, Trash2, UserMinus2, UserPlus2, Users, Archive, Copy } from "lucide-react";
import { DoubleCircleIcon } from "@plane/propel/icons";
import { CommandConfig } from "../types";

/**
 * Contextual commands - Commands that appear only in specific contexts
 * These are context-aware actions for issues, cycles, modules, projects, etc.
 */

// ============================================================================
// Issue Contextual Commands
// ============================================================================

export const createIssueContextualCommands = (
  currentUserId: string,
  updateIssue: (updates: any) => Promise<void>,
  toggleDeleteIssueModal: (open: boolean) => void,
  copyIssueUrl: () => void
): CommandConfig[] => [
  {
    id: "issue-change-state",
    type: "contextual",
    group: "contextual",
    title: "Change state",
    description: "Change the state of this work item",
    icon: DoubleCircleIcon,
    showOnRoutes: ["issue"],
    steps: [
      {
        type: "select-state",
        placeholder: "Select state",
        dataKey: "stateId",
      },
      {
        type: "action",
        action: async (context) => {
          if (context.stepData?.stateId) {
            await updateIssue({ state: context.stepData.stateId });
          }
        },
      },
    ],
    isVisible: (context) => Boolean(context.issueId),
  },

  {
    id: "issue-change-priority",
    type: "contextual",
    group: "contextual",
    title: "Change priority",
    description: "Change the priority of this work item",
    icon: Signal,
    showOnRoutes: ["issue"],
    steps: [
      {
        type: "select-priority",
        placeholder: "Select priority",
        dataKey: "priority",
      },
      {
        type: "action",
        action: async (context) => {
          if (context.stepData?.priority) {
            await updateIssue({ priority: context.stepData.priority });
          }
        },
      },
    ],
    isVisible: (context) => Boolean(context.issueId),
  },

  {
    id: "issue-change-assignee",
    type: "contextual",
    group: "contextual",
    title: "Assign to",
    description: "Change assignees for this work item",
    icon: Users,
    showOnRoutes: ["issue"],
    steps: [
      {
        type: "select-assignee",
        placeholder: "Select assignee",
        dataKey: "assigneeIds",
      },
      {
        type: "action",
        action: async (context) => {
          if (context.stepData?.assigneeIds) {
            await updateIssue({ assignee_ids: context.stepData.assigneeIds });
          }
        },
      },
    ],
    isVisible: (context) => Boolean(context.issueId),
  },

  {
    id: "issue-assign-to-me",
    type: "contextual",
    group: "contextual",
    title: "Assign to me",
    description: "Assign this work item to yourself",
    icon: UserPlus2,
    showOnRoutes: ["issue"],
    steps: [
      {
        type: "action",
        action: async (context) => {
          // This will be implemented with actual issue data
          await updateIssue({ assignee_ids: [currentUserId] });
        },
      },
    ],
    isVisible: (context) => Boolean(context.issueId),
  },

  {
    id: "issue-unassign-from-me",
    type: "contextual",
    group: "contextual",
    title: "Unassign from me",
    description: "Remove yourself from assignees",
    icon: UserMinus2,
    showOnRoutes: ["issue"],
    steps: [
      {
        type: "action",
        action: async (context) => {
          // This will be implemented with actual issue data
          // to remove current user from assignees
        },
      },
    ],
    isVisible: (context) => Boolean(context.issueId),
  },

  {
    id: "issue-copy-url",
    type: "contextual",
    group: "contextual",
    title: "Copy work item URL",
    description: "Copy the URL of this work item to clipboard",
    icon: LinkIcon,
    showOnRoutes: ["issue"],
    steps: [
      {
        type: "action",
        action: () => {
          copyIssueUrl();
        },
      },
    ],
    isVisible: (context) => Boolean(context.issueId),
  },

  {
    id: "issue-delete",
    type: "contextual",
    group: "contextual",
    title: "Delete work item",
    description: "Delete this work item",
    icon: Trash2,
    showOnRoutes: ["issue"],
    steps: [
      {
        type: "modal",
        modalAction: () => {
          toggleDeleteIssueModal(true);
        },
      },
    ],
    isVisible: (context) => Boolean(context.issueId),
  },
];

// ============================================================================
// Cycle Contextual Commands
// ============================================================================

export const createCycleContextualCommands = (
  archiveCycle: (cycleId: string) => Promise<void>,
  copyCycleUrl: () => void,
  toggleDeleteCycleModal: (open: boolean) => void
): CommandConfig[] => [
  {
    id: "cycle-copy-url",
    type: "contextual",
    group: "contextual",
    title: "Copy cycle URL",
    description: "Copy the URL of this cycle to clipboard",
    icon: LinkIcon,
    showOnRoutes: ["cycle"],
    steps: [
      {
        type: "action",
        action: () => {
          copyCycleUrl();
        },
      },
    ],
    isVisible: (context) => Boolean(context.cycleId),
  },

  {
    id: "cycle-archive",
    type: "contextual",
    group: "contextual",
    title: "Archive cycle",
    description: "Archive this cycle",
    icon: Archive,
    showOnRoutes: ["cycle"],
    steps: [
      {
        type: "action",
        action: async (context) => {
          if (context.cycleId) {
            await archiveCycle(context.cycleId);
          }
        },
      },
    ],
    isVisible: (context) => Boolean(context.cycleId),
  },

  {
    id: "cycle-delete",
    type: "contextual",
    group: "contextual",
    title: "Delete cycle",
    description: "Delete this cycle",
    icon: Trash2,
    showOnRoutes: ["cycle"],
    steps: [
      {
        type: "modal",
        modalAction: () => {
          toggleDeleteCycleModal(true);
        },
      },
    ],
    isVisible: (context) => Boolean(context.cycleId),
  },
];

// ============================================================================
// Module Contextual Commands
// ============================================================================

export const createModuleContextualCommands = (
  archiveModule: (moduleId: string) => Promise<void>,
  copyModuleUrl: () => void,
  toggleDeleteModuleModal: (open: boolean) => void
): CommandConfig[] => [
  {
    id: "module-copy-url",
    type: "contextual",
    group: "contextual",
    title: "Copy module URL",
    description: "Copy the URL of this module to clipboard",
    icon: LinkIcon,
    showOnRoutes: ["module"],
    steps: [
      {
        type: "action",
        action: () => {
          copyModuleUrl();
        },
      },
    ],
    isVisible: (context) => Boolean(context.moduleId),
  },

  {
    id: "module-archive",
    type: "contextual",
    group: "contextual",
    title: "Archive module",
    description: "Archive this module",
    icon: Archive,
    showOnRoutes: ["module"],
    steps: [
      {
        type: "action",
        action: async (context) => {
          if (context.moduleId) {
            await archiveModule(context.moduleId);
          }
        },
      },
    ],
    isVisible: (context) => Boolean(context.moduleId),
  },

  {
    id: "module-delete",
    type: "contextual",
    group: "contextual",
    title: "Delete module",
    description: "Delete this module",
    icon: Trash2,
    showOnRoutes: ["module"],
    steps: [
      {
        type: "modal",
        modalAction: () => {
          toggleDeleteModuleModal(true);
        },
      },
    ],
    isVisible: (context) => Boolean(context.moduleId),
  },
];

// ============================================================================
// Project Contextual Commands
// ============================================================================

export const createProjectContextualCommands = (
  copyProjectUrl: () => void,
  leaveProject: () => Promise<void>,
  archiveProject: () => Promise<void>
): CommandConfig[] => [
  {
    id: "project-copy-url",
    type: "contextual",
    group: "contextual",
    title: "Copy project URL",
    description: "Copy the URL of this project to clipboard",
    icon: Copy,
    showOnRoutes: ["project"],
    steps: [
      {
        type: "action",
        action: () => {
          copyProjectUrl();
        },
      },
    ],
    isVisible: (context) => Boolean(context.projectId),
  },

  {
    id: "project-leave",
    type: "contextual",
    group: "contextual",
    title: "Leave project",
    description: "Leave this project",
    icon: UserMinus2,
    showOnRoutes: ["project"],
    steps: [
      {
        type: "action",
        action: async () => {
          await leaveProject();
        },
      },
    ],
    isVisible: (context) => Boolean(context.projectId),
    isEnabled: (context) => !Boolean(context.canPerformProjectActions), // Only non-admins can leave
  },

  {
    id: "project-archive",
    type: "contextual",
    group: "contextual",
    title: "Archive project",
    description: "Archive this project",
    icon: Archive,
    showOnRoutes: ["project"],
    steps: [
      {
        type: "action",
        action: async () => {
          await archiveProject();
        },
      },
    ],
    isVisible: (context) => Boolean(context.projectId),
    isEnabled: (context) => Boolean(context.canPerformProjectActions),
  },
];
