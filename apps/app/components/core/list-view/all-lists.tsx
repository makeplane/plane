// hooks
import useIssuesView from "hooks/use-issues-view";
// components
import { SingleList } from "components/core/list-view/single-list";
// types
import { IIssue, IState, UserAuth } from "types";

// types
type Props = {
  type: "issue" | "cycle" | "module";
  states: IState[] | undefined;
  addIssueToState: (groupTitle: string) => void;
  makeIssueCopy: (issue: IIssue) => void;
  handleEditIssue: (issue: IIssue) => void;
  handleDeleteIssue: (issue: IIssue) => void;
  openIssuesListModal?: (() => void) | null;
  removeIssue: ((bridgeId: string) => void) | null;
  isCompleted?: boolean;
  userAuth: UserAuth;
};

export const AllLists: React.FC<Props> = ({
  type,
  states,
  addIssueToState,
  makeIssueCopy,
  openIssuesListModal,
  handleEditIssue,
  handleDeleteIssue,
  removeIssue,
  isCompleted = false,
  userAuth,
}) => {
  const { groupedByIssues, groupByProperty: selectedGroup, showEmptyGroups } = useIssuesView();

  return (
    <>
      {groupedByIssues && (
        <div className="flex flex-col space-y-5">
          {Object.keys(groupedByIssues).map((singleGroup) => {
            const currentState =
              selectedGroup === "state" ? states?.find((s) => s.id === singleGroup) : null;

            if (!showEmptyGroups && groupedByIssues[singleGroup].length === 0) return null;

            return (
              <SingleList
                key={singleGroup}
                type={type}
                groupTitle={singleGroup}
                groupedByIssues={groupedByIssues}
                selectedGroup={selectedGroup}
                currentState={currentState}
                addIssueToState={() => addIssueToState(singleGroup)}
                makeIssueCopy={makeIssueCopy}
                handleEditIssue={handleEditIssue}
                handleDeleteIssue={handleDeleteIssue}
                openIssuesListModal={type !== "issue" ? openIssuesListModal : null}
                removeIssue={removeIssue}
                isCompleted={isCompleted}
                userAuth={userAuth}
              />
            );
          })}
        </div>
      )}
    </>
  );
};
