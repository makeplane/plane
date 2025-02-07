import { useParams } from "next/navigation";
// plane types
import { TPowerKPageKeys } from "@plane/types";
// components
import { PowerKIssueActionsMenu } from "@/components/command-palette/power-k/context-based-actions";

type Props = {
  activePage: TPowerKPageKeys | undefined;
  handleClose: () => void;
  handleUpdateSearchTerm: (searchTerm: string) => void;
  handleUpdatePage: (page: TPowerKPageKeys) => void;
};

export const PowerKContextBasedActions: React.FC<Props> = (props) => {
  const { activePage, handleClose, handleUpdateSearchTerm, handleUpdatePage } = props;
  // navigation
  const { issueId } = useParams();

  return (
    <>
      {issueId && (
        <PowerKIssueActionsMenu
          handleClose={handleClose}
          activePage={activePage}
          handleUpdatePage={handleUpdatePage}
          issueId={issueId.toString()}
          handleUpdateSearchTerm={handleUpdateSearchTerm}
        />
      )}
      {/* {moduleId && (
        <PowerKModuleActionsMenu
          handleClose={handleClose}
          activePage={activePage}
          handleUpdatePage={handleUpdatePage}
          moduleId={moduleId.toString()}
          handleUpdateSearchTerm={handleUpdateSearchTerm}
        />
      )} */}
    </>
  );
};
