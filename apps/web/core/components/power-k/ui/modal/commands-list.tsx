import type { TPowerKCommandConfig, TPowerKContext, TPowerKPageType } from "../../core/types";
import { PowerKModalPagesList } from "../pages";
import { PowerKContextBasedPagesList } from "../pages/context-based";
import { PowerKModalSearchMenu } from "./search-menu";

export type TPowerKCommandsListProps = {
  activePage: TPowerKPageType | null;
  context: TPowerKContext;
  handleCommandSelect: (command: TPowerKCommandConfig) => void;
  handlePageDataSelection: (data: unknown) => void;
  isWorkspaceLevel: boolean;
  searchTerm: string;
  setSearchTerm: (value: string) => void;
};

export const ProjectsAppPowerKCommandsList: React.FC<TPowerKCommandsListProps> = (props) => {
  const {
    activePage,
    context,
    handleCommandSelect,
    handlePageDataSelection,
    isWorkspaceLevel,
    searchTerm,
    setSearchTerm,
  } = props;

  return (
    <>
      <PowerKModalSearchMenu
        activePage={activePage}
        context={context}
        isWorkspaceLevel={!context.params.projectId || isWorkspaceLevel}
        searchTerm={searchTerm}
        updateSearchTerm={setSearchTerm}
      />
      <PowerKContextBasedPagesList
        activeContext={context.activeContext}
        activePage={activePage}
        handleSelection={handlePageDataSelection}
      />
      <PowerKModalPagesList
        activePage={activePage}
        context={context}
        onPageDataSelect={handlePageDataSelection}
        onCommandSelect={handleCommandSelect}
      />
    </>
  );
};
