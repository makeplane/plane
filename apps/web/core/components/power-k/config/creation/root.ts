// types
import type { TPowerKCommandConfig, TPowerKContext } from "@/components/power-k/core/types";
// local imports
import { TPowerKCreationCommandKeys, usePowerKCreationCommandsRecord } from "./command";

export const usePowerKCreationCommands = (context: TPowerKContext): TPowerKCommandConfig[] => {
  const optionsList: Record<TPowerKCreationCommandKeys, TPowerKCommandConfig> =
    usePowerKCreationCommandsRecord(context);
  return [
    optionsList["create-work_item"],
    optionsList["create-page"],
    optionsList["create-view"],
    optionsList["create-cycle"],
    optionsList["create-module"],
    optionsList["create-project"],
    optionsList["create-workspace"],
  ];
};
