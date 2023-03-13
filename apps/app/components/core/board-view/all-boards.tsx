// hooks
import useIssueView from "hooks/use-issue-view";
// components
import { SingleBoard } from "components/core/board-view/single-board";
// types
import { IIssue, IProjectMember, IState, UserAuth } from "types";

type Props = {
  type: "issue" | "cycle" | "module";
  issues: IIssue[];
  states: IState[] | undefined;
  members: IProjectMember[] | undefined;
  addIssueToState: (groupTitle: string, stateId: string | null) => void;
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
  issues,
  states,
  members,
  addIssueToState,
  makeIssueCopy,
  handleEditIssue,
  openIssuesListModal,
  handleDeleteIssue,
  handleTrashBox,
  removeIssue,
  userAuth,
}) => {
  const { groupedByIssues, groupByProperty: selectedGroup, orderBy } = useIssueView(issues);

  return (
    <>
      {groupedByIssues ? (
        <div className="h-[calc(100vh-140px)] w-full">
          <div className="horizontal-scroll-enable flex h-full gap-x-3.5 overflow-x-auto overflow-y-hidden">
            {Object.keys(groupedByIssues).map((singleGroup, index) => {
              const currentState =
                selectedGroup === "state_detail.name"
                  ? states?.find((s) => s.name === singleGroup)
                  : null;

              const stateId =
                selectedGroup === "state_detail.name"
                  ? states?.find((s) => s.name === singleGroup)?.id ?? null
                  : null;

              const bgColor =
                selectedGroup === "state_detail.name"
                  ? states?.find((s) => s.name === singleGroup)?.color
                  : "#000000";

              return (
                <SingleBoard
                  key={index}
                  type={type}
                  currentState={currentState}
                  bgColor={bgColor}
                  groupTitle={singleGroup}
                  groupedByIssues={groupedByIssues}
                  selectedGroup={selectedGroup}
                  members={members}
                  handleEditIssue={handleEditIssue}
                  makeIssueCopy={makeIssueCopy}
                  addIssueToState={() => addIssueToState(singleGroup, stateId)}
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
      ) : (
        <div className="flex h-full w-full items-center justify-center">Loading...</div>
      )}
    </>
  );
};
