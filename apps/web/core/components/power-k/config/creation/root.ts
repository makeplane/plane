// types
import type { TPowerKCommandConfig } from "@/components/power-k/core/types";
// local imports
import { usePowerKCreationCommandsRecord } from "./command";
import type { TPowerKCreationCommandKeys } from "./command";

export const usePowerKCreationCommands = (): TPowerKCommandConfig[] => {
  const optionsList: Record<TPowerKCreationCommandKeys, TPowerKCommandConfig> = usePowerKCreationCommandsRecord();
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
