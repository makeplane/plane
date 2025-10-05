import { Home, FolderKanban } from "lucide-react";
// plane web imports
import { usePowerKCreationCommands } from "@/plane-web/components/command-palette/power-k/commands/creation-commands";
// local imports
import type { TPowerKCommandConfig, TPowerKContext } from "../core/types";

/**
 * Example commands demonstrating all patterns
 *
 * 15 commands total:
 * - 5 Navigation (gd, gm, op, oc, gc)
 * - 3 Creation (c, p, q)
 * - 5 Work Item Actions - Contextual (s, p, i, cmd+delete, cmd+shift+,)
 * - 2 General ([, cmd+k)
 */

function getExampleCommands(): TPowerKCommandConfig[] {
  return [
    {
      id: "nav-dashboard",
      i18n_title: "Go to Dashboard",
      i18n_description: "Navigate to workspace dashboard",
      icon: Home,
      keySequence: "gd",
      group: "navigation",
      type: "action",
      action: (ctx) => {
        ctx.router.push(`/${ctx.params.workspaceSlug?.toString()}`);
        ctx.closePalette();
      },
      isEnabled: (ctx) => Boolean(ctx.params.workspaceSlug?.toString()),
      isVisible: (ctx) => Boolean(ctx.params.workspaceSlug?.toString()),
    },
    {
      id: "nav-open-project",
      i18n_title: "Open project",
      i18n_description: "Search and navigate to a project",
      icon: FolderKanban,
      keySequence: "op",
      group: "navigation",
      page: "select-project",
      type: "change-page",
      onSelect: (projectId: string, ctx) => {
        ctx.router.push(`/${ctx.params.workspaceSlug?.toString()}/projects/${projectId}/issues`);
        ctx.closePalette();
      },
      isEnabled: (ctx) => Boolean(ctx.params.workspaceSlug?.toString()),
      isVisible: (ctx) => Boolean(ctx.params.workspaceSlug?.toString()),
    },
  ];
}

export const usePowerKCommands = (context: TPowerKContext): TPowerKCommandConfig[] => {
  const creationCommands = usePowerKCreationCommands(context);

  return [...getExampleCommands(), ...creationCommands];
};
