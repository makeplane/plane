import { Home, FolderKanban } from "lucide-react";
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

export function getExampleCommands(): TPowerKCommandConfig[] {
  return [
    {
      id: "nav-dashboard",
      title: "Go to Dashboard",
      description: "Navigate to workspace dashboard",
      icon: Home,
      keySequence: "gd",
      group: "navigation",
      showInSearch: true,
      type: "action",
      action: (ctx) => {
        ctx.router.push(`/${ctx.params.workspaceSlug?.toString()}`);
        ctx.closePalette();
      },
      isVisible: (ctx) => Boolean(ctx.params.workspaceSlug?.toString()),
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
      type: "change-page",
      onSelect: (projectId: string, ctx) => {
        ctx.router.push(`/${ctx.params.workspaceSlug?.toString()}/projects/${projectId}/issues`);
        ctx.closePalette();
      },
      isVisible: (ctx) => Boolean(ctx.params.workspaceSlug?.toString()),
    },
  ];
}
