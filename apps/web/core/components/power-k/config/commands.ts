// plane web imports
import { usePowerKCreationCommands } from "@/plane-web/components/command-palette/power-k/commands/creation-commands";
import { usePowerKNavigationCommands } from "@/plane-web/components/command-palette/power-k/commands/navigation-commands";
// local imports
import type { TPowerKCommandConfig, TPowerKContext } from "../core/types";
import { usePowerKContextBasedActions } from "../ui/pages/context-based-actions";

export const usePowerKCommands = (context: TPowerKContext): TPowerKCommandConfig[] => {
  const navigationCommands = usePowerKNavigationCommands();
  const creationCommands = usePowerKCreationCommands(context);
  const contextualCommands = usePowerKContextBasedActions();

  return [...navigationCommands, ...creationCommands, ...contextualCommands];
};
