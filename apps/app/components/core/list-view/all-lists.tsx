// hooks
import useIssueView from "hooks/use-issue-view";
// components
import { SingleList } from "components/core/list-view/single-list";
// types
import { IIssue, IProjectMember, IState, UserAuth } from "types";

// types
type Props = {
  type: "issue" | "cycle" | "module";
  issues: IIssue[];
  states: IState[] | undefined;
  members: IProjectMember[] | undefined;
  addIssueToState: (groupTitle: string, stateId: string | null) => void;
  handleEditIssue: (issue: IIssue) => void;
  handleDeleteIssue: (issue: IIssue) => void;
  openIssuesListModal?: (() => void) | null;
  removeIssue: ((bridgeId: string) => void) | null;
  userAuth: UserAuth;
};

export const AllLists: React.FC<Props> = ({
  type,
  issues,
  states,
  members,
  addIssueToState,
  openIssuesListModal,
  handleEditIssue,
  handleDeleteIssue,
  removeIssue,
  userAuth,
}) => {
  const { groupedByIssues, groupByProperty: selectedGroup } = useIssueView(issues);

  return (
    <div className="flex flex-col space-y-5">
      {Object.keys(groupedByIssues).map((singleGroup) => {
        const stateId =
          selectedGroup === "state_detail.name"
            ? states?.find((s) => s.name === singleGroup)?.id ?? null
            : null;

        return (
          <SingleList
            key={singleGroup}
            type={type}
            groupTitle={singleGroup}
            groupedByIssues={groupedByIssues}
            selectedGroup={selectedGroup}
            members={members}
            addIssueToState={() => addIssueToState(singleGroup, stateId)}
            handleEditIssue={handleEditIssue}
            handleDeleteIssue={handleDeleteIssue}
            openIssuesListModal={type !== "issue" ? openIssuesListModal : null}
            removeIssue={removeIssue}
            userAuth={userAuth}
          />
        );
      })}
    </div>
  );
};
