// types
import type { TPowerKCommandConfig, TPowerKContext } from "@/components/power-k/core/types";
// local imports
import { TPowerKCreationCommandKeys, usePowerKCreationCommandsRecord } from "./command";

export const usePowerKCreationCommands = (context: TPowerKContext): TPowerKCommandConfig[] => {
  const optionsList: Record<TPowerKCreationCommandKeys, TPowerKCommandConfig> =
    usePowerKCreationCommandsRecord(context);
  return [
    optionsList["work_item"],
    optionsList["page"],
    optionsList["view"],
    optionsList["cycle"],
    optionsList["module"],
    optionsList["project"],
    optionsList["workspace"],
  ];
};
