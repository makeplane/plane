// components
import { SingleBoard } from "components/core/views/board-view/single-board";
// icons
import { getStateGroupIcon } from "components/icons";
// helpers
import { addSpaceIfCamelCase } from "helpers/string.helper";
// types
import { ICurrentUserResponse, IIssue, IIssueViewProps, IState, UserAuth } from "types";

type Props = {
  addIssueToGroup: (groupTitle: string) => void;
  disableUserActions: boolean;
  dragDisabled: boolean;
  handleIssueAction: (issue: IIssue, action: "copy" | "delete" | "edit") => void;
  handleTrashBox: (isDragging: boolean) => void;
  openIssuesListModal?: (() => void) | null;
  removeIssue: ((bridgeId: string, issueId: string) => void) | null;
  states: IState[] | undefined;
  user: ICurrentUserResponse | undefined;
  userAuth: UserAuth;
  viewProps: IIssueViewProps;
};

export const AllBoards: React.FC<Props> = ({
  addIssueToGroup,
  disableUserActions,
  dragDisabled,
  handleIssueAction,
  handleTrashBox,
  openIssuesListModal,
  removeIssue,
  states,
  user,
  userAuth,
  viewProps,
}) => {
  const { groupByProperty: selectedGroup, groupedIssues, showEmptyGroups } = viewProps;

  return (
    <>
      {groupedIssues ? (
        <div className="horizontal-scroll-enable flex h-full gap-x-4 p-8">
          {Object.keys(groupedIssues).map((singleGroup, index) => {
            const currentState =
              selectedGroup === "state" ? states?.find((s) => s.id === singleGroup) : null;

            if (!showEmptyGroups && groupedIssues[singleGroup].length === 0) return null;

            return (
              <SingleBoard
                key={index}
                addIssueToGroup={() => addIssueToGroup(singleGroup)}
                currentState={currentState}
                disableUserActions={disableUserActions}
                dragDisabled={dragDisabled}
                groupTitle={singleGroup}
                handleIssueAction={handleIssueAction}
                handleTrashBox={handleTrashBox}
                openIssuesListModal={openIssuesListModal ?? null}
                removeIssue={removeIssue}
                user={user}
                userAuth={userAuth}
                viewProps={viewProps}
              />
            );
          })}
          {!showEmptyGroups && (
            <div className="h-full w-96 flex-shrink-0 space-y-2 p-1">
              <h2 className="text-lg font-semibold">Hidden groups</h2>
              <div className="space-y-3">
                {Object.keys(groupedIssues).map((singleGroup, index) => {
                  const currentState =
                    selectedGroup === "state" ? states?.find((s) => s.id === singleGroup) : null;

                  if (groupedIssues[singleGroup].length === 0)
                    return (
                      <div
                        key={index}
                        className="flex items-center justify-between gap-2 rounded bg-custom-background-90 p-2 shadow"
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
                        <span className="text-xs text-custom-text-200">0</span>
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
