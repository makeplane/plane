// local imports
import type { TPowerKCommandConfig, TPowerKContext } from "../core/types";
import { usePowerKContextBasedActions } from "../ui/pages/context-based-actions";
import { usePowerKAccountCommands } from "./account-commands";
import { usePowerKCreationCommands } from "./creation/root";
import { usePowerKHelpCommands } from "./help-commands";
import { usePowerKNavigationCommands } from "./navigation/root";

export const usePowerKCommands = (context: TPowerKContext): TPowerKCommandConfig[] => {
  const navigationCommands = usePowerKNavigationCommands();
  const creationCommands = usePowerKCreationCommands(context);
  const contextualCommands = usePowerKContextBasedActions();
  const accountCommands = usePowerKAccountCommands();
  const helpCommands = usePowerKHelpCommands();

  return [...navigationCommands, ...creationCommands, ...contextualCommands, ...accountCommands, ...helpCommands];
};
