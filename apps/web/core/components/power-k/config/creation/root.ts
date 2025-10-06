// types
import type { TPowerKCommandConfig, TPowerKContext } from "@/components/power-k/core/types";
// local imports
import { TPowerKCreationCommandKeys, usePowerKCreationCommandsRecord } from "./command";

export const usePowerKCreationCommands = (context: TPowerKContext): TPowerKCommandConfig[] => {
  const optionsList: Record<TPowerKCreationCommandKeys, TPowerKCommandConfig> =
    usePowerKCreationCommandsRecord(context);
  return [
    optionsList["create_work_item"],
    optionsList["create_page"],
    optionsList["create_view"],
    optionsList["create_cycle"],
    optionsList["create_module"],
    optionsList["create_project"],
    optionsList["create_workspace"],
  ];
};
