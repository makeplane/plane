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
  openIssuesListModal?: (() => void) | null;
  handleDeleteIssue: (issue: IIssue) => void;
  handleTrashBox: (isDragging: boolean) => void;
  userAuth: UserAuth;
};

export const AllBoards: React.FC<Props> = ({
  type,
  issues,
  states,
  members,
  addIssueToState,
  openIssuesListModal,
  handleDeleteIssue,
  handleTrashBox,
  userAuth,
}) => {
  const { groupedByIssues, groupByProperty: selectedGroup, orderBy } = useIssueView(issues);

  return (
    <>
      {groupedByIssues ? (
        <div className="h-[calc(100vh-157px)] lg:h-[calc(100vh-115px)] w-full">
          <div className="h-full w-full overflow-hidden">
            <div className="h-full w-full">
              <div className="flex h-full gap-x-4 overflow-x-auto overflow-y-hidden">
                {Object.keys(groupedByIssues).map((singleGroup, index) => {
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
                      bgColor={bgColor}
                      groupTitle={singleGroup}
                      groupedByIssues={groupedByIssues}
                      selectedGroup={selectedGroup}
                      members={members}
                      addIssueToState={() => addIssueToState(singleGroup, stateId)}
                      handleDeleteIssue={handleDeleteIssue}
                      openIssuesListModal={openIssuesListModal ?? null}
                      orderBy={orderBy}
                      handleTrashBox={handleTrashBox}
                      userAuth={userAuth}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex h-full w-full items-center justify-center">Loading...</div>
      )}
    </>
  );
};
