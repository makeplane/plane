// hooks
import useProjectIssuesView from "hooks/use-project-issues-view";
// components
import { SingleBoard } from "components/core/board-view/single-board";
// types
import { IIssue, IProjectMember, IState, UserAuth } from "types";

type Props = {
  type: "issue" | "cycle" | "module";
  issues: IIssue[];
  states: IState[] | undefined;
  addIssueToState: (groupTitle: string) => void;
  handleEditIssue: (issue: IIssue) => void;
  openIssuesListModal?: (() => void) | null;
  handleDeleteIssue: (issue: IIssue) => void;
  handleTrashBox: (isDragging: boolean) => void;
  removeIssue: ((bridgeId: string) => void) | null;
  userAuth: UserAuth;
};

export const AllBoards: React.FC<Props> = ({
  type,
  issues,
  states,
  addIssueToState,
  handleEditIssue,
  openIssuesListModal,
  handleDeleteIssue,
  handleTrashBox,
  removeIssue,
  userAuth,
}) => {
  const { groupedByIssues, groupByProperty: selectedGroup, orderBy } = useProjectIssuesView();

  return (
    <div className="h-[calc(100vh-157px)] lg:h-[calc(100vh-115px)] w-full">
      <div className="h-full w-full overflow-hidden">
        <div className="h-full w-full">
          <div className="flex h-full gap-x-9 overflow-x-auto overflow-y-hidden">
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
      </div>
    </div>
  );
};
