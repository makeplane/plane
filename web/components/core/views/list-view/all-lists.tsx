// components
import { SingleList } from "components/core/views/list-view/single-list";
// types
import { ICurrentUserResponse, IIssue, IIssueViewProps, IState, UserAuth } from "types";

// types
type Props = {
  states: IState[] | undefined;
  addIssueToGroup: (groupTitle: string) => void;
  handleIssueAction: (issue: IIssue, action: "copy" | "delete" | "edit") => void;
  openIssuesListModal?: (() => void) | null;
  removeIssue: ((bridgeId: string, issueId: string) => void) | null;
  disableUserActions: boolean;
  user: ICurrentUserResponse | undefined;
  userAuth: UserAuth;
  viewProps: IIssueViewProps;
};

export const AllLists: React.FC<Props> = ({
  addIssueToGroup,
  handleIssueAction,
  disableUserActions,
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
      {groupedIssues && (
        <div className="h-full overflow-y-auto">
          {Object.keys(groupedIssues).map((singleGroup) => {
            const currentState =
              selectedGroup === "state" ? states?.find((s) => s.id === singleGroup) : null;

            if (!showEmptyGroups && groupedIssues[singleGroup].length === 0) return null;

            return (
              <SingleList
                key={singleGroup}
                groupTitle={singleGroup}
                currentState={currentState}
                addIssueToGroup={() => addIssueToGroup(singleGroup)}
                handleIssueAction={handleIssueAction}
                openIssuesListModal={openIssuesListModal}
                removeIssue={removeIssue}
                disableUserActions={disableUserActions}
                user={user}
                userAuth={userAuth}
                viewProps={viewProps}
              />
            );
          })}
        </div>
      )}
    </>
  );
};
