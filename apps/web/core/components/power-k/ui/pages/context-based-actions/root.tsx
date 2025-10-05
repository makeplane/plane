// components
import type { TPowerKCommandConfig, TPowerKContextType, TPowerKPageType } from "@/components/power-k/core/types";
// plane web imports
import { PowerKContextBasedActionsExtended } from "@/plane-web/components/command-palette/power-k/context-based-actions";
// local imports
import { PowerKCycleActionsMenu } from "./cycle";
import { PowerKModuleActionsMenu } from "./module";
import { PowerKPageActionsMenu } from "./page";
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
  const { activeContext, activePage, handleClose, handleSelection, handleUpdateSearchTerm, handleUpdatePage } = props;

  return (
    <>
      {activeContext === "work-item" && (
        <PowerKWorkItemActionsMenu activePage={activePage} handleSelection={handleSelection} />
      )}
      {activeContext === "cycle" && (
        <PowerKCycleActionsMenu
          activePage={activePage}
          handleClose={handleClose}
          handleUpdatePage={handleUpdatePage}
          handleUpdateSearchTerm={handleUpdateSearchTerm}
        />
      )}
      {activeContext === "module" && (
        <PowerKModuleActionsMenu
          activePage={activePage}
          handleClose={handleClose}
          handleUpdatePage={handleUpdatePage}
          handleUpdateSearchTerm={handleUpdateSearchTerm}
        />
      )}
      {activeContext === "page" && (
        <PowerKPageActionsMenu
          activePage={activePage}
          handleClose={handleClose}
          handleUpdatePage={handleUpdatePage}
          handleUpdateSearchTerm={handleUpdateSearchTerm}
        />
      )}
      <PowerKContextBasedActionsExtended {...props} />
    </>
  );
};

export const usePowerKContextBasedActions = (): TPowerKCommandConfig[] => {
  const workItemCommands = usePowerKWorkItemContextBasedCommands();

  return [...workItemCommands];
};
