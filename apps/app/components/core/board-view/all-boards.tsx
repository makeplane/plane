// hooks
import useProjectIssuesView from "hooks/use-issues-view";
// components
import { SingleBoard } from "components/core/board-view/single-board";
// types
import { IIssue, IState, UserAuth } from "types";

type Props = {
  type: "issue" | "cycle" | "module";
  states: IState[] | undefined;
  addIssueToState: (groupTitle: string) => void;
  makeIssueCopy: (issue: IIssue) => void;
  handleEditIssue: (issue: IIssue) => void;
  openIssuesListModal?: (() => void) | null;
  handleDeleteIssue: (issue: IIssue) => void;
  handleTrashBox: (isDragging: boolean) => void;
  removeIssue: ((bridgeId: string) => void) | null;
  userAuth: UserAuth;
};

export const AllBoards: React.FC<Props> = ({
  type,
  states,
  addIssueToState,
  makeIssueCopy,
  handleEditIssue,
  openIssuesListModal,
  handleDeleteIssue,
  handleTrashBox,
  removeIssue,
  userAuth,
}) => {
  const { groupedByIssues, groupByProperty: selectedGroup, orderBy } = useProjectIssuesView();

  return (
    <>
      {groupedByIssues ? (
        <div className="horizontal-scroll-enable flex h-[calc(100vh-140px)] gap-x-4">
          {Object.keys(groupedByIssues).map((singleGroup, index) => {
            const currentState =
              selectedGroup === "state" ? states?.find((s) => s.id === singleGroup) : null;

            return (
              <SingleBoard
                key={index}
                type={type}
                currentState={currentState}
                groupTitle={singleGroup}
                handleEditIssue={handleEditIssue}
                makeIssueCopy={makeIssueCopy}
                addIssueToState={() => addIssueToState(singleGroup)}
                handleDeleteIssue={handleDeleteIssue}
                openIssuesListModal={openIssuesListModal ?? null}
                handleTrashBox={handleTrashBox}
                removeIssue={removeIssue}
                userAuth={userAuth}
              />
            );
          })}
        </div>
      ) : null}
    </>
  );
};
