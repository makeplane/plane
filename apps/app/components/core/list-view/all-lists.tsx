// hooks
import useIssuesView from "hooks/use-issues-view";
// components
import { SingleList } from "components/core/list-view/single-list";
// types
import { IIssue, IProjectMember, IState, UserAuth } from "types";

// types
type Props = {
  type: "issue" | "cycle" | "module";
  states: IState[] | undefined;
  members: IProjectMember[] | undefined;
  addIssueToState: (groupTitle: string, stateId: string | null) => void;
  makeIssueCopy: (issue: IIssue) => void;
  handleEditIssue: (issue: IIssue) => void;
  handleDeleteIssue: (issue: IIssue) => void;
  openIssuesListModal?: (() => void) | null;
  removeIssue: ((bridgeId: string) => void) | null;
  userAuth: UserAuth;
};

export const AllLists: React.FC<Props> = ({
  type,
  states,
  members,
  addIssueToState,
  makeIssueCopy,
  openIssuesListModal,
  handleEditIssue,
  handleDeleteIssue,
  removeIssue,
  userAuth,
}) => {
  const { groupedByIssues, groupByProperty: selectedGroup } = useIssuesView();

  return (
    <>
      {groupedByIssues && (
        <div className="flex flex-col space-y-5">
          {Object.keys(groupedByIssues).map((singleGroup) => {
            const stateId = selectedGroup === "state" ? singleGroup : null;

            return (
              <SingleList
                key={singleGroup}
                type={type}
                groupTitle={singleGroup}
                groupedByIssues={groupedByIssues}
                selectedGroup={selectedGroup}
                members={members}
                addIssueToState={() => addIssueToState(singleGroup, stateId)}
                makeIssueCopy={makeIssueCopy}
                handleEditIssue={handleEditIssue}
                handleDeleteIssue={handleDeleteIssue}
                openIssuesListModal={type !== "issue" ? openIssuesListModal : null}
                removeIssue={removeIssue}
                userAuth={userAuth}
              />
            );
          })}
        </div>
      )}
    </>
  );
};
