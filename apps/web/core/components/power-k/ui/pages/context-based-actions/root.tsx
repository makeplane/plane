// components
import type { TPowerKCommandConfig, TPowerKContextType, TPowerKPageType } from "@/components/power-k/core/types";
// plane web imports
import { PowerKContextBasedActionsExtended } from "@/plane-web/components/command-palette/power-k/context-based-actions";
// local imports
import { usePowerKCycleContextBasedActions } from "./cycle/commands";
import { PowerKModuleActionsMenu } from "./module";
import { usePowerKModuleContextBasedActions } from "./module/commands";
import { usePowerKPageContextBasedActions } from "./page/commands";
import { PowerKWorkItemActionsMenu } from "./work-item";
import { usePowerKWorkItemContextBasedCommands } from "./work-item/commands";

export type ContextBasedActionsProps = {
  activePage: TPowerKPageType | null;
  activeContext: TPowerKContextType | null;
  handleClose: () => void;
  handleSelection: (data: unknown) => void;
  handleUpdateSearchTerm: (searchTerm: string) => void;
  handleUpdatePage: (page: TPowerKPageType) => void;
};

export const PowerKContextBasedActions: React.FC<ContextBasedActionsProps> = (props) => {
  const { activeContext, activePage, handleSelection } = props;

  return (
    <>
      {activeContext === "work-item" && (
        <PowerKWorkItemActionsMenu activePage={activePage} handleSelection={handleSelection} />
      )}
      {activeContext === "module" && (
        <PowerKModuleActionsMenu activePage={activePage} handleSelection={handleSelection} />
      )}
      <PowerKContextBasedActionsExtended {...props} />
    </>
  );
};

export const usePowerKContextBasedActions = (): TPowerKCommandConfig[] => {
  const workItemCommands = usePowerKWorkItemContextBasedCommands();
  const cycleCommands = usePowerKCycleContextBasedActions();
  const moduleCommands = usePowerKModuleContextBasedActions();
  const pageCommands = usePowerKPageContextBasedActions();

  return [...workItemCommands, ...cycleCommands, ...moduleCommands, ...pageCommands];
};
