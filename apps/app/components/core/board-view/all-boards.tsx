// hooks
import useProjectIssuesView from "hooks/use-issues-view";
// components
import { SingleBoard } from "components/core/board-view/single-board";
// types
import { IIssue, IState, UserAuth } from "types";

type Props = {
  type: "issue" | "cycle" | "module";
  groupedByIssues: any;
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
  groupedByIssues,
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
  const { groupByProperty: selectedGroup, orderBy } = useProjectIssuesView();

  return (
    <>
      {groupedByIssues ? (
        <div className="h-[calc(100vh-140px)] w-full">
          <div className="horizontal-scroll-enable flex h-full gap-x-4 overflow-x-auto overflow-y-hidden">
            {Object.keys(groupedByIssues).map((singleGroup, index) => {
              const currentState =
                selectedGroup === "state" ? states?.find((s) => s.id === singleGroup) : null;

              return (
                <SingleBoard
                  key={index}
                  type={type}
                  currentState={currentState}
                  groupTitle={singleGroup}
                  groupedByIssues={groupedByIssues}
                  selectedGroup={selectedGroup}
                  handleEditIssue={handleEditIssue}
                  makeIssueCopy={makeIssueCopy}
                  addIssueToState={() => addIssueToState(singleGroup)}
                  handleDeleteIssue={handleDeleteIssue}
                  openIssuesListModal={openIssuesListModal ?? null}
                  orderBy={orderBy}
                  handleTrashBox={handleTrashBox}
                  removeIssue={removeIssue}
                  userAuth={userAuth}
                />
              );
            })}
          </div>
        </div>
      ) : null}
    </>
  );
};
