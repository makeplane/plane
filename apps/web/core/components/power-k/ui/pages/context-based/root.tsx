// components
import type { TPowerKCommandConfig, TPowerKContextType, TPowerKPageType } from "@/components/power-k/core/types";
// plane web imports
import { PowerKContextBasedActionsExtended } from "@/plane-web/components/command-palette/power-k/context-based-actions";
// local imports
import { usePowerKCycleContextBasedActions } from "./cycle/commands";
import { PowerKModuleContextBasedPages } from "./module";
import { usePowerKModuleContextBasedActions } from "./module/commands";
import { usePowerKPageContextBasedActions } from "./page/commands";
import { PowerKWorkItemContextBasedPages } from "./work-item";
import { usePowerKWorkItemContextBasedCommands } from "./work-item/commands";

export type ContextBasedActionsProps = {
  activePage: TPowerKPageType | null;
  activeContext: TPowerKContextType | null;
  handleSelection: (data: unknown) => void;
};

export const PowerKContextBasedPagesList: React.FC<ContextBasedActionsProps> = (props) => {
  const { activeContext, activePage, handleSelection } = props;

  return (
    <>
      {activeContext === "work-item" && (
        <PowerKWorkItemContextBasedPages activePage={activePage} handleSelection={handleSelection} />
      )}
      {activeContext === "module" && (
        <PowerKModuleContextBasedPages activePage={activePage} handleSelection={handleSelection} />
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
