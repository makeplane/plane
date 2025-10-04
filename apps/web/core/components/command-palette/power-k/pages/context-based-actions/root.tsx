// plane web imports
import { PowerKContextBasedActionsExtended } from "@/plane-web/components/command-palette/power-k/context-based-actions";
// local imports
import type { TPowerKPageKeys } from "../../types";
import { PowerKWorkItemActionsMenu } from "./work-item/root";

type Props = {
  activePage: TPowerKPageKeys | undefined;
  handleClose: () => void;
  handleUpdateSearchTerm: (searchTerm: string) => void;
  handleUpdatePage: (page: TPowerKPageKeys) => void;
};

export const PowerKContextBasedActions: React.FC<Props> = (props) => {
  const { activePage, handleClose, handleUpdateSearchTerm, handleUpdatePage } = props;

  return (
    <>
      <PowerKWorkItemActionsMenu
        activePage={activePage}
        handleClose={handleClose}
        handleUpdatePage={handleUpdatePage}
        handleUpdateSearchTerm={handleUpdateSearchTerm}
      />
      <PowerKContextBasedActionsExtended
        activePage={activePage}
        handleClose={handleClose}
        handleUpdatePage={handleUpdatePage}
        handleUpdateSearchTerm={handleUpdateSearchTerm}
      />
    </>
  );
};
