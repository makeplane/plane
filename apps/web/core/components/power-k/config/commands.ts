import { Home, FolderKanban, Layers, Plus, FolderPlus, Settings, Link, Trash2, SidebarOpen } from "lucide-react";
import { ContrastIcon, LayersIcon, DoubleCircleIcon } from "@plane/propel/icons";
import type { TPowerKCommandConfig } from "../core/types";

/**
 * Example commands demonstrating all patterns
 *
 * 15 commands total:
 * - 5 Navigation (gd, gm, op, oc, gc)
 * - 3 Creation (c, p, q)
 * - 5 Work Item Actions - Contextual (s, p, i, cmd+delete, cmd+shift+,)
 * - 2 General ([, cmd+k)
 */

export function getExampleCommands(
  // Modal toggles (from Plane stores)
  toggleCreateIssueModal: (open: boolean) => void,
  toggleCreateProjectModal: (open: boolean) => void,
  toggleCreateCycleModal: (open: boolean) => void,
  deleteIssue: (issueId: string) => void
): TPowerKCommandConfig[] {
  return [
    // ========================================================================
    // NAVIGATION (5 commands)
    // ========================================================================
    {
      id: "nav-dashboard",
      title: "Go to Dashboard",
      description: "Navigate to workspace dashboard",
      icon: Home,
      keySequence: "gd",
      group: "navigation",
      showInSearch: true,
      action: (ctx) => {
        ctx.router.push(`/${ctx.workspaceSlug}`);
        ctx.closePalette();
      },
      isVisible: (ctx) => Boolean(ctx.workspaceSlug),
    },

    {
      id: "nav-my-issues",
      title: "Go to my issues",
      description: "View all issues assigned to you",
      icon: Layers,
      keySequence: "gm",
      group: "navigation",
      showInSearch: true,
      searchTerms: ["assigned", "my work items"],
      action: (ctx) => {
        ctx.router.push(`/${ctx.workspaceSlug}/workspace-views/assigned`);
        ctx.closePalette();
      },
      isVisible: (ctx) => Boolean(ctx.workspaceSlug),
    },

    {
      id: "nav-open-project",
      title: "Open project",
      description: "Search and navigate to a project",
      icon: FolderKanban,
      keySequence: "op",
      group: "navigation",
      showInSearch: true,
      page: "select-project",
      onSelect: (projectId: string, ctx) => {
        ctx.router.push(`/${ctx.workspaceSlug}/projects/${projectId}/issues`);
        ctx.closePalette();
      },
      isVisible: (ctx) => Boolean(ctx.workspaceSlug),
    },

    {
      id: "nav-open-cycle",
      title: "Open cycle",
      description: "Search and navigate to a cycle",
      icon: ContrastIcon,
      keySequence: "oc",
      group: "navigation",
      showInSearch: true,
      page: "select-cycle",
      onSelect: (cycleId: string, ctx) => {
        ctx.router.push(`/${ctx.workspaceSlug}/projects/${ctx.projectId}/cycles/${cycleId}`);
        ctx.closePalette();
      },
      isVisible: (ctx) => Boolean(ctx.workspaceSlug && ctx.projectId),
    },

    {
      id: "nav-cycles",
      title: "Go to cycles",
      description: "View all cycles in current project",
      icon: ContrastIcon,
      keySequence: "gc",
      group: "navigation",
      showInSearch: true,
      action: (ctx) => {
        ctx.router.push(`/${ctx.workspaceSlug}/projects/${ctx.projectId}/cycles`);
        ctx.closePalette();
      },
      isVisible: (ctx) => Boolean(ctx.workspaceSlug && ctx.projectId),
    },

    // ========================================================================
    // CREATION (3 commands)
    // ========================================================================
    {
      id: "create-issue",
      title: "Create work item",
      description: "Create a new work item in the current project",
      icon: LayersIcon,
      shortcut: "c",
      group: "create",
      showInSearch: true,
      searchTerms: ["new issue", "add issue"],
      action: (ctx) => {
        ctx.closePalette();
        toggleCreateIssueModal(true);
      },
      isVisible: (ctx) => Boolean(ctx.workspaceSlug),
      isEnabled: (ctx) => Boolean(ctx.canPerformAnyCreateAction),
    },

    {
      id: "create-project",
      title: "Create project",
      description: "Create a new project in the current workspace",
      icon: FolderPlus,
      shortcut: "p",
      group: "create",
      showInSearch: true,
      searchTerms: ["new project", "add project"],
      action: (ctx) => {
        ctx.closePalette();
        toggleCreateProjectModal(true);
      },
      isVisible: (ctx) => Boolean(ctx.workspaceSlug),
      isEnabled: (ctx) => Boolean(ctx.canPerformWorkspaceActions),
    },

    {
      id: "create-cycle",
      title: "Create cycle",
      description: "Create a new cycle in the current project",
      icon: ContrastIcon,
      shortcut: "q",
      group: "create",
      showInSearch: true,
      searchTerms: ["new cycle", "add cycle"],
      action: (ctx) => {
        ctx.closePalette();
        toggleCreateCycleModal(true);
      },
      isVisible: (ctx) => Boolean(ctx.workspaceSlug && ctx.projectId),
      isEnabled: (ctx) => Boolean(ctx.canPerformProjectActions),
    },

    // ========================================================================
    // WORK ITEM ACTIONS - Contextual (5 commands)
    // These only show when a work item is active
    // ========================================================================
    {
      id: "change-state",
      title: "Change state",
      description: "Change the state of the current work item",
      icon: DoubleCircleIcon,
      shortcut: "s",
      group: "work-item",
      contextType: "work-item",
      showInSearch: true,
      page: "select-state",
      onSelect: (stateId: string, ctx) => {
        // This would call updateIssue from the store
        console.log("Update issue state:", ctx.issueId, stateId);
        ctx.closePalette();
      },
      isEnabled: (ctx) => Boolean(ctx.canPerformProjectActions),
    },

    {
      id: "change-priority",
      title: "Change priority",
      description: "Change the priority of the current work item",
      icon: Settings,
      shortcut: "p",
      group: "work-item",
      contextType: "work-item",
      showInSearch: true,
      page: "select-priority",
      onSelect: (priority: string, ctx) => {
        // This would call updateIssue from the store
        console.log("Update issue priority:", ctx.issueId, priority);
        ctx.closePalette();
      },
      isEnabled: (ctx) => Boolean(ctx.canPerformProjectActions),
    },

    {
      id: "assign-to-me",
      title: "Assign to me",
      description: "Assign the current work item to yourself",
      icon: Plus,
      shortcut: "i",
      group: "work-item",
      contextType: "work-item",
      showInSearch: true,
      action: (ctx) => {
        // This would call updateIssue from the store
        console.log("Assign to me:", ctx.issueId, ctx.currentUserId);
        ctx.closePalette();
      },
      isEnabled: (ctx) => Boolean(ctx.canPerformProjectActions && ctx.currentUserId),
    },

    {
      id: "delete-issue",
      title: "Delete work item",
      description: "Delete the current work item",
      icon: Trash2,
      modifierShortcut: "cmd+backspace",
      group: "work-item",
      contextType: "work-item",
      showInSearch: true,
      action: (ctx) => {
        console.log("Delete issue:", ctx);
        if (ctx.issueId) {
          deleteIssue(ctx.issueId);
        }
        ctx.closePalette();
      },
      isEnabled: (ctx) => Boolean(ctx.canPerformProjectActions),
    },

    {
      id: "copy-issue-link",
      title: "Copy work item link",
      description: "Copy the current work item URL to clipboard",
      icon: Link,
      modifierShortcut: "cmd+shift+,",
      group: "work-item",
      contextType: "work-item",
      showInSearch: true,
      action: () => {
        const url = window.location.href;
        navigator.clipboard.writeText(url).then(() => {
          console.log("Copied to clipboard:", url);
        });
      },
    },

    // ========================================================================
    // GENERAL (2 commands)
    // ========================================================================
    {
      id: "toggle-sidebar",
      title: "Toggle left sidebar",
      description: "Show or hide the left sidebar",
      icon: SidebarOpen,
      shortcut: "[",
      group: "general",
      showInSearch: true,
      action: () => {
        // This would toggle sidebar from app theme store
        console.log("Toggle sidebar");
      },
    },

    {
      id: "open-command-palette",
      title: "Open command palette",
      description: "Open the command palette",
      icon: Settings,
      modifierShortcut: "cmd+k",
      group: "general",
      showInSearch: false, // Don't show in search (it's already open!)
      action: (ctx) => {
        // This opens the palette (handled by shortcut handler)
      },
    },
  ];
}
