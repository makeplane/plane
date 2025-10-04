"use client";

import { Search, FolderKanban, LayoutDashboard, Settings, FileText, Layers } from "lucide-react";
// plane imports
import { ContrastIcon, DiceIcon } from "@plane/propel/icons";
// local imports
import type { CommandConfig } from "../types";

/**
 * Navigation commands - Navigate to all pages in the app
 * Uses the new multi-step system for complex navigation flows
 */
export const navigationCommandsRegistry = (): CommandConfig[] => [
  // ============================================================================
  // Project Navigation
  // ============================================================================
  {
    id: "navigate-project",
    type: "navigation",
    group: "navigate",
    title: "Open project",
    description: "Search and navigate to a project",
    icon: Search,
    keySequence: "op",
    steps: [
      {
        type: "change-page-project",
        dataKey: "projectId",
      },
      {
        type: "navigate",
        route: "/:workspace/projects/:projectId/issues",
      },
    ],
    isVisible: (context) => Boolean(context.workspaceSlug),
  },

  // ============================================================================
  // Cycle Navigation
  // ============================================================================
  {
    id: "navigate-cycle",
    type: "navigation",
    group: "navigate",
    title: "Open cycle",
    description: "Search and navigate to a cycle",
    icon: ContrastIcon,
    keySequence: "oc",
    steps: [
      // If no project context, first select project
      {
        type: "change-page-project",
        condition: (context) => !context.projectId,
        dataKey: "projectId",
      },
      // Then select cycle
      {
        type: "change-page-cycle",
        dataKey: "cycleId",
      },
      // Navigate to cycle
      {
        type: "navigate",
        route: (context) => {
          const projectId = context.projectId || context.stepData?.projectId;
          const cycleId = context.stepData?.cycleId;
          return `/${context.workspaceSlug}/projects/${projectId}/cycles/${cycleId}`;
        },
      },
    ],
    isVisible: (context) => Boolean(context.workspaceSlug),
  },

  // ============================================================================
  // Module Navigation
  // ============================================================================
  {
    id: "navigate-module",
    type: "navigation",
    group: "navigate",
    title: "Open module",
    description: "Search and navigate to a module",
    icon: DiceIcon,
    keySequence: "om",
    steps: [
      // If no project context, first select project
      {
        type: "change-page-project",
        condition: (context) => !context.projectId,
        dataKey: "projectId",
      },
      // Then select module
      {
        type: "change-page-module",
        dataKey: "moduleId",
      },
      // Navigate to module
      {
        type: "navigate",
        route: (context) => {
          const projectId = context.projectId || context.stepData?.projectId;
          const moduleId = context.stepData?.moduleId;
          return `/${context.workspaceSlug}/projects/${projectId}/modules/${moduleId}`;
        },
      },
    ],
    isVisible: (context) => Boolean(context.workspaceSlug),
  },

  // ============================================================================
  // Issue Navigation (Recent)
  // ============================================================================
  {
    id: "navigate-issue",
    type: "navigation",
    group: "navigate",
    title: "Open recent work items",
    description: "Search and navigate to recent work items",
    icon: Layers,
    keySequence: "oi",
    steps: [
      {
        type: "change-page-issue",
        dataKey: "issueId",
      },
    ],
    isVisible: (context) => Boolean(context.workspaceSlug),
  },

  // ============================================================================
  // Direct Page Navigation (No selection required)
  // ============================================================================
  {
    id: "navigate-dashboard",
    type: "navigation",
    group: "navigate",
    title: "Go to dashboards",
    description: "Navigate to workspace dashboard",
    icon: LayoutDashboard,
    steps: [
      {
        type: "navigate",
        route: "/:workspace",
      },
    ],
    isVisible: (context) => Boolean(context.workspaceSlug),
  },

  {
    id: "navigate-all-issues",
    type: "navigation",
    group: "navigate",
    title: "Go to all work items",
    description: "View all work items across workspace",
    icon: Layers,
    steps: [
      {
        type: "navigate",
        route: "/:workspace/workspace-views/all-issues",
      },
    ],
    isVisible: (context) => Boolean(context.workspaceSlug),
  },

  {
    id: "navigate-assigned-issues",
    type: "navigation",
    group: "navigate",
    title: "Go to assigned work items",
    description: "View work items assigned to you",
    icon: Layers,
    steps: [
      {
        type: "navigate",
        route: "/:workspace/workspace-views/assigned",
      },
    ],
    isVisible: (context) => Boolean(context.workspaceSlug),
  },

  {
    id: "navigate-created-issues",
    type: "navigation",
    group: "navigate",
    title: "Go to created work items",
    description: "View work items created by you",
    icon: Layers,
    steps: [
      {
        type: "navigate",
        route: "/:workspace/workspace-views/created",
      },
    ],
    isVisible: (context) => Boolean(context.workspaceSlug),
  },

  {
    id: "navigate-subscribed-issues",
    type: "navigation",
    group: "navigate",
    title: "Go to subscribed work items",
    description: "View work items you're subscribed to",
    icon: Layers,
    steps: [
      {
        type: "navigate",
        route: "/:workspace/workspace-views/subscribed",
      },
    ],
    isVisible: (context) => Boolean(context.workspaceSlug),
  },

  {
    id: "navigate-projects-list",
    type: "navigation",
    group: "navigate",
    title: "Go to projects",
    description: "View all projects",
    icon: FolderKanban,
    steps: [
      {
        type: "navigate",
        route: "/:workspace/projects",
      },
    ],
    isVisible: (context) => Boolean(context.workspaceSlug),
  },

  // ============================================================================
  // Project-Level Navigation (Only visible in project context)
  // ============================================================================
  {
    id: "navigate-project-issues",
    type: "navigation",
    group: "navigate",
    title: "Go to work items",
    description: "Navigate to project work items",
    icon: Layers,
    showOnRoutes: ["project"],
    steps: [
      {
        type: "navigate",
        route: "/:workspace/projects/:project/issues",
      },
    ],
    isVisible: (context) => Boolean(context.workspaceSlug && context.projectId),
  },

  {
    id: "navigate-project-cycles",
    type: "navigation",
    group: "navigate",
    title: "Go to cycles",
    description: "Navigate to project cycles",
    icon: ContrastIcon,
    showOnRoutes: ["project"],
    steps: [
      {
        type: "navigate",
        route: "/:workspace/projects/:project/cycles",
      },
    ],
    isVisible: (context) => Boolean(context.workspaceSlug && context.projectId),
  },

  {
    id: "navigate-project-modules",
    type: "navigation",
    group: "navigate",
    title: "Go to modules",
    description: "Navigate to project modules",
    icon: DiceIcon,
    showOnRoutes: ["project"],
    steps: [
      {
        type: "navigate",
        route: "/:workspace/projects/:project/modules",
      },
    ],
    isVisible: (context) => Boolean(context.workspaceSlug && context.projectId),
  },

  {
    id: "navigate-project-views",
    type: "navigation",
    group: "navigate",
    title: "Go to views",
    description: "Navigate to project views",
    icon: Layers,
    showOnRoutes: ["project"],
    steps: [
      {
        type: "navigate",
        route: "/:workspace/projects/:project/views",
      },
    ],
    isVisible: (context) => Boolean(context.workspaceSlug && context.projectId),
  },

  {
    id: "navigate-project-pages",
    type: "navigation",
    group: "navigate",
    title: "Go to pages",
    description: "Navigate to project pages",
    icon: FileText,
    showOnRoutes: ["project"],
    steps: [
      {
        type: "navigate",
        route: "/:workspace/projects/:project/pages",
      },
    ],
    isVisible: (context) => Boolean(context.workspaceSlug && context.projectId),
  },

  {
    id: "navigate-project-settings",
    type: "navigation",
    group: "navigate",
    title: "Go to project settings",
    description: "Navigate to project settings",
    icon: Settings,
    showOnRoutes: ["project"],
    steps: [
      {
        type: "navigate",
        route: "/:workspace/projects/:project/settings",
      },
    ],
    isVisible: (context) => Boolean(context.workspaceSlug && context.projectId),
  },
];
