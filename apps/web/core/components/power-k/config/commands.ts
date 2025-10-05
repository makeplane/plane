// plane web imports
import { usePowerKCreationCommands } from "@/plane-web/components/command-palette/power-k/commands/creation-commands";
import { usePowerKNavigationCommands } from "@/plane-web/components/command-palette/power-k/commands/navigation-commands";
// local imports
import type { TPowerKCommandConfig, TPowerKContext } from "../core/types";
import { usePowerKContextBasedActions } from "../ui/pages/context-based-actions";
import { usePowerKHelpCommands } from "./help-commands";
import { usePowerKAccountCommands } from "./account-commands";

export const usePowerKCommands = (context: TPowerKContext): TPowerKCommandConfig[] => {
  const navigationCommands = usePowerKNavigationCommands();
  const creationCommands = usePowerKCreationCommands(context);
  const contextualCommands = usePowerKContextBasedActions();
  const accountCommands = usePowerKAccountCommands();
  const helpCommands = usePowerKHelpCommands();

  return [...navigationCommands, ...creationCommands, ...contextualCommands, ...accountCommands, ...helpCommands];
};
