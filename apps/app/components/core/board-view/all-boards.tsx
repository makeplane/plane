// hooks
import useProjectIssuesView from "hooks/use-issues-view";
// components
import { SingleBoard } from "components/core/board-view/single-board";
// helpers
import { addSpaceIfCamelCase } from "helpers/string.helper";
// types
import { IIssue, IState, UserAuth } from "types";
import { getStateGroupIcon } from "components/icons";

type Props = {
  type: "issue" | "cycle" | "module";
  states: IState[] | undefined;
  addIssueToState: (groupTitle: string) => void;
  makeIssueCopy: (issue: IIssue) => void;
  handleEditIssue: (issue: IIssue) => void;
  openIssuesListModal?: (() => void) | null;
  handleDeleteIssue: (issue: IIssue) => void;
  handleTrashBox: (isDragging: boolean) => void;
  removeIssue: ((bridgeId: string, issueId: string) => void) | null;
  isCompleted?: boolean;
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
  isCompleted = false,
  userAuth,
}) => {
  const {
    groupedByIssues,
    groupByProperty: selectedGroup,
    showEmptyGroups,
  } = useProjectIssuesView();

  return (
    <>
      {groupedByIssues ? (
        <div className="horizontal-scroll-enable flex h-full gap-x-4 p-8">
          {Object.keys(groupedByIssues).map((singleGroup, index) => {
            const currentState =
              selectedGroup === "state" ? states?.find((s) => s.id === singleGroup) : null;

            if (!showEmptyGroups && groupedByIssues[singleGroup].length === 0) return null;

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
                isCompleted={isCompleted}
                userAuth={userAuth}
              />
            );
          })}
          {!showEmptyGroups && (
            <div className="h-full w-96 flex-shrink-0 space-y-3 p-1">
              <h2 className="text-lg font-semibold">Hidden groups</h2>
              <div className="space-y-3">
                {Object.keys(groupedByIssues).map((singleGroup, index) => {
                  const currentState =
                    selectedGroup === "state" ? states?.find((s) => s.id === singleGroup) : null;

                  if (groupedByIssues[singleGroup].length === 0)
                    return (
                      <div
                        key={index}
                        className="flex items-center justify-between gap-2 rounded bg-brand-surface-1 p-2 shadow"
                      >
                        <div className="flex items-center gap-2">
                          {currentState &&
                            getStateGroupIcon(currentState.group, "16", "16", currentState.color)}
                          <h4 className="text-sm capitalize">
                            {selectedGroup === "state"
                              ? addSpaceIfCamelCase(currentState?.name ?? "")
                              : addSpaceIfCamelCase(singleGroup)}
                          </h4>
                        </div>
                        <span className="text-xs text-brand-secondary">0</span>
                      </div>
                    );
                })}
              </div>
            </div>
          )}
        </div>
      ) : null}
    </>
  );
};
