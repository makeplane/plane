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
  IProfileIssuesFilterStore,
  IProfileIssuesStore,
  IProjectArchivedIssuesStore,
  IProjectDraftIssuesStore,
  IProjectIssuesFilterStore,
  IProjectIssuesStore,
  IViewIssuesFilterStore,
  IViewIssuesStore,
} from "store/issues";
import { observer } from "mobx-react-lite";
import { IIssueResponse } from "store/issues/types";
import { EProjectStore } from "store/command-palette.store";
import { IssuePeekOverview } from "components/issues";
import { useRouter } from "next/router";
import { EUserWorkspaceRoles } from "constants/workspace";

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
    | IViewIssuesFilterStore
    | IProfileIssuesFilterStore;
  issueStore:
    | IProjectIssuesStore
    | IModuleIssuesStore
    | ICycleIssuesStore
    | IViewIssuesStore
    | IProjectArchivedIssuesStore
    | IProjectDraftIssuesStore
    | IProfileIssuesStore;
  QuickActions: FC<IQuickActionProps>;
  issueActions: {
    [EIssueActions.DELETE]: (group_by: string | null, issue: IIssue) => Promise<void>;
    [EIssueActions.UPDATE]?: (group_by: string | null, issue: IIssue) => Promise<void>;
    [EIssueActions.REMOVE]?: (group_by: string | null, issue: IIssue) => Promise<void>;
  };
  getProjects: (projectStore: IProjectStore) => IProject[] | null;
  viewId?: string;
  currentStore: EProjectStore;
  addIssuesToView?: (issueIds: string[]) => Promise<IIssue>;
  canEditPropertiesBasedOnProject?: (projectId: string) => boolean;
}

export const BaseListRoot = observer((props: IBaseListRoot) => {
  const {
    issueFilterStore,
    issueStore,
    QuickActions,
    issueActions,
    getProjects,
    viewId,
    currentStore,
    addIssuesToView,
    canEditPropertiesBasedOnProject,
  } = props;
  // router
  const router = useRouter();
  const { workspaceSlug, peekIssueId, peekProjectId } = router.query;
  // mobx store
  const {
    project: projectStore,
    projectMember: { projectMembers },
    projectState: projectStateStore,
    projectLabel: { projectLabels },
    user: userStore,
  } = useMobxStore();

  const { currentProjectRole } = userStore;
  const isEditingAllowed = !!currentProjectRole && currentProjectRole >= EUserWorkspaceRoles.MEMBER;

  const issueIds = issueStore?.getIssuesIds || [];
  const issues = issueStore?.getIssues;

  const { enableInlineEditing, enableQuickAdd, enableIssueCreation } = issueStore?.viewFlags || {};
  const canEditProperties = (projectId: string | undefined) => {
    const isEditingAllowedBasedOnProject =
      canEditPropertiesBasedOnProject && projectId ? canEditPropertiesBasedOnProject(projectId) : isEditingAllowed;

    return enableInlineEditing && isEditingAllowedBasedOnProject;
  };

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
      await issueActions[action]!(group_by, issue);
    }
  };

  return (
    <>
      {issueStore?.loader === "init-loader" ? (
        <div className="flex h-full w-full items-center justify-center">
          <Spinner />
        </div>
      ) : (
        <div className={`relative h-full w-full bg-custom-background-90`}>
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
            viewId={viewId}
            quickAddCallback={issueStore?.quickAddIssue}
            enableIssueQuickAdd={!!enableQuickAdd}
            canEditProperties={canEditProperties}
            disableIssueCreation={!enableIssueCreation || !isEditingAllowed}
            currentStore={currentStore}
            addIssuesToView={addIssuesToView}
          />
        </div>
      )}

      {workspaceSlug && peekIssueId && peekProjectId && (
        <IssuePeekOverview
          workspaceSlug={workspaceSlug.toString()}
          projectId={peekProjectId.toString()}
          issueId={peekIssueId.toString()}
          handleIssue={async (issueToUpdate, action: EIssueActions) =>
            await handleIssues(issueToUpdate as IIssue, action)
          }
        />
      )}
    </>
  );
});
