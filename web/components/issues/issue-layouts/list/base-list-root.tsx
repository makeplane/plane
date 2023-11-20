import { IIssueFilterStore, IIssueStore, IssueFilterStore } from "store/issue";
import { List } from "./default";
import { useMobxStore } from "lib/mobx/store-provider";
import { ISSUE_PRIORITIES, ISSUE_STATE_GROUPS } from "constants/issue";
import { FC } from "react";
import { IGroupedIssues, IIssue, IIssueResponse, IProject } from "types";
import { EIssueActions } from "./block";
import { IProjectStore } from "store/project";
import { Spinner } from "@plane/ui";
import { IQuickActionProps } from "./list-view-types";
import { IProfileIssueFilterStore, IProfileIssueStore } from "store/profile-issues";
import { IModuleIssueStore } from "store/module";
import { ICycleIssueStore } from "store/cycle";
import { IArchivedIssueFilterStore, IArchivedIssueStore } from "store/archived-issues";
import { IProjectIssuesStore } from "store/issues";

interface IBaseListRoot {
  issueStore:
    | IIssueStore
    | IProfileIssueStore
    | IModuleIssueStore
    | ICycleIssueStore
    | IArchivedIssueStore
    | IProjectIssuesStore;
  issueFilterStore: IssueFilterStore | IIssueFilterStore | IProfileIssueFilterStore | IArchivedIssueFilterStore;
  QuickActions: FC<IQuickActionProps>;
  issueActions: {
    [EIssueActions.DELETE]: (group_by: string | null, issue: IIssue) => void;
    [EIssueActions.UPDATE]?: (group_by: string | null, issue: IIssue) => void;
    [EIssueActions.REMOVE]?: (group_by: string | null, issue: IIssue) => void;
  };
  getProjects: (projectStore: IProjectStore) => IProject[] | null;
  showLoader?: boolean;
}

export const BaseListRoot = (props: IBaseListRoot) => {
  const { issueFilterStore, issueStore, QuickActions, issueActions, getProjects, showLoader } = props;

  const {
    project: projectStore,
    projectMember: { projectMembers },
    projectState: projectStateStore,
  } = useMobxStore();

  const issues = issueStore.getIssues;
  //temporary ignore to be removed after implementing other stores
  //@ts-ignore
  const issueIds = issueStore?.getIssueIds !== undefined ? issueStore?.getIssueIds : [];
  const userDisplayFilters = issueFilterStore?.userDisplayFilters;
  const group_by: string | null = userDisplayFilters?.group_by || null;
  const displayProperties = issueFilterStore?.userDisplayProperties;

  const showEmptyGroup = userDisplayFilters.show_empty_groups ?? false;

  const states = projectStateStore?.projectStates;
  const priorities = ISSUE_PRIORITIES;
  const labels = projectStore?.projectLabels;
  const stateGroups = ISSUE_STATE_GROUPS;

  const projects = getProjects(projectStore);

  const members = projectMembers?.map((m) => m.member) ?? null;
  const handleIssues = async (issue: IIssue, action: EIssueActions) => {
    if (issueActions[action]) {
      issueActions[action]!(group_by, issue);
    }
  };

  return (
    <>
      {showLoader && issueStore.loader === "mutation" ? (
        <div className="w-full h-full flex justify-center items-center">
          <Spinner />
        </div>
      ) : (
        <div className={`relative w-full h-full bg-custom-background-90`}>
          <List
            issues={issues as unknown as IIssueResponse}
            group_by={group_by}
            handleIssues={handleIssues}
            quickActions={(group_by, issue) => (
              <QuickActions
                issue={issue}
                handleDelete={async () => handleIssues(issue, EIssueActions.DELETE)}
                handleUpdate={
                  issueActions[EIssueActions.UPDATE]
                    ? async (data) => handleIssues(data, EIssueActions.UPDATE)
                    : undefined
                }
                handleRemoveFromView={
                  issueActions[EIssueActions.REMOVE] ? async () => handleIssues(issue, EIssueActions.REMOVE) : undefined
                }
              />
            )}
            displayProperties={displayProperties}
            states={states}
            stateGroups={stateGroups}
            priorities={priorities}
            labels={labels}
            members={members}
            projects={projects}
            issueIds={issueIds}
            showEmptyGroup={showEmptyGroup}
            enableIssueQuickAdd={true}
            isReadonly={false}
          />
        </div>
      )}
    </>
  );
};
