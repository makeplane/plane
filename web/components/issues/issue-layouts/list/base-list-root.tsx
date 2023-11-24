import { List } from "./default";
import { useMobxStore } from "lib/mobx/store-provider";
import { ISSUE_PRIORITIES, ISSUE_STATE_GROUPS } from "constants/issue";
import { FC } from "react";
import { IIssue, IProject } from "types";
import { IProjectStore } from "store/project";
import { Spinner } from "@plane/ui";
import { IQuickActionProps } from "./list-view-types";
import {
  ICycleIssuesFilterStore,
  ICycleIssuesStore,
  IModuleIssuesFilterStore,
  IModuleIssuesStore,
  IProjectIssuesFilterStore,
  IProjectIssuesStore,
  IViewIssuesFilterStore,
  IViewIssuesStore,
} from "store/issues";
import { observer } from "mobx-react-lite";
import { IIssueResponse } from "store/issues/types";

enum EIssueActions {
  UPDATE = "update",
  DELETE = "delete",
  REMOVE = "remove",
}

interface IBaseListRoot {
  issueFilterStore:
    | IProjectIssuesFilterStore
    | IModuleIssuesFilterStore
    | ICycleIssuesFilterStore
    | IViewIssuesFilterStore;
  issueStore: IProjectIssuesStore | IModuleIssuesStore | ICycleIssuesStore | IViewIssuesStore;
  QuickActions: FC<IQuickActionProps>;
  issueActions: {
    [EIssueActions.DELETE]: (group_by: string | null, issue: IIssue) => void;
    [EIssueActions.UPDATE]?: (group_by: string | null, issue: IIssue) => void;
    [EIssueActions.REMOVE]?: (group_by: string | null, issue: IIssue) => void;
  };
  getProjects: (projectStore: IProjectStore) => IProject[] | null;
  viewId?: string;
}

export const BaseListRoot = observer((props: IBaseListRoot) => {
  const { issueFilterStore, issueStore, QuickActions, issueActions, getProjects, viewId } = props;

  const {
    project: projectStore,
    projectMember: { projectMembers },
    projectState: projectStateStore,
    projectLabel: { projectLabels },
  } = useMobxStore();

  const issueIds = issueStore.getIssuesIds || [];
  const issues = issueStore.getIssues;

  const displayFilters = issueFilterStore?.issueFilters?.displayFilters;
  const group_by = displayFilters?.group_by || null;
  const showEmptyGroup = displayFilters?.show_empty_groups ?? false;

  const displayProperties = issueFilterStore?.issueFilters?.displayProperties;

  const states = projectStateStore?.projectStates;
  const priorities = ISSUE_PRIORITIES;
  const labels = projectLabels;
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
      {issueStore.loader === "mutation" ? (
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
            quickAddCallback={issueStore.quickAddIssue}
            viewId={viewId}
          />
        </div>
      )}
    </>
  );
});
