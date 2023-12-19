import { List } from "./default";
import { FC, useCallback } from "react";
import { IIssue } from "types";
import { Spinner } from "@plane/ui";
import { IQuickActionProps } from "./list-view-types";
import {
  ICycleIssuesFilterStore,
  IModuleIssuesFilterStore,
  IProfileIssuesFilterStore,
  IProjectIssuesFilterStore,
  IViewIssuesFilterStore,
} from "store_legacy/issues";
import { observer } from "mobx-react-lite";
import { EProjectStore } from "store/application/command-palette.store";
import { IssuePeekOverview } from "components/issues";
import { useRouter } from "next/router";
import { EUserProjectRoles } from "constants/project";
import { IProjectIssues } from "store/issue/project";
import { useIssues } from "hooks/store/use-issues";
import { useUser } from "hooks/store";

enum EIssueActions {
  UPDATE = "update",
  DELETE = "delete",
  REMOVE = "remove",
}

interface IBaseListRoot {
  issuesFilter:
    | IProjectIssuesFilterStore
    | IModuleIssuesFilterStore
    | ICycleIssuesFilterStore
    | IViewIssuesFilterStore
    | IProfileIssuesFilterStore;
  issues: IProjectIssues;
  QuickActions: FC<IQuickActionProps>;
  issueActions: {
    [EIssueActions.DELETE]: (issue: IIssue) => Promise<void>;
    [EIssueActions.UPDATE]?: (issue: IIssue) => Promise<void>;
    [EIssueActions.REMOVE]?: (issue: IIssue) => Promise<void>;
  };
  viewId?: string;
  currentStore: EProjectStore;
  addIssuesToView?: (issueIds: string[]) => Promise<IIssue>;
  canEditPropertiesBasedOnProject?: (projectId: string) => boolean;
}

export const BaseListRoot = observer((props: IBaseListRoot) => {
  const {
    issuesFilter,
    issues,
    QuickActions,
    issueActions,
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
    membership: { currentProjectRole },
  } = useUser();

  const {
    issuesMap: { allIssues: issuesMap },
  } = useIssues();

  const isEditingAllowed = !!currentProjectRole && currentProjectRole >= EUserProjectRoles.MEMBER;

  const issueIds = issues?.getIssuesIds || [];

  const { enableInlineEditing, enableQuickAdd, enableIssueCreation } = issues?.viewFlags || {};
  const canEditProperties = useCallback(
    (projectId: string | undefined) => {
      const isEditingAllowedBasedOnProject =
        canEditPropertiesBasedOnProject && projectId ? canEditPropertiesBasedOnProject(projectId) : isEditingAllowed;

      return enableInlineEditing && isEditingAllowedBasedOnProject;
    },
    [canEditPropertiesBasedOnProject, enableInlineEditing, isEditingAllowed]
  );

  const displayFilters = issuesFilter?.issueFilters?.displayFilters;
  const displayProperties = issuesFilter?.issueFilters?.displayProperties;

  const group_by = displayFilters?.group_by || null;
  const showEmptyGroup = displayFilters?.show_empty_groups ?? false;

  const handleIssues = useCallback(
    async (issue: IIssue, action: EIssueActions) => {
      if (issueActions[action]) {
        await issueActions[action]!(issue);
      }
    },
    [issueActions]
  );

  const renderQuickActions = useCallback(
    (issue: IIssue) => (
      <QuickActions
        issue={issue}
        handleDelete={async () => handleIssues(issue, EIssueActions.DELETE)}
        handleUpdate={
          issueActions[EIssueActions.UPDATE] ? async (data) => handleIssues(data, EIssueActions.UPDATE) : undefined
        }
        handleRemoveFromView={
          issueActions[EIssueActions.REMOVE] ? async () => handleIssues(issue, EIssueActions.REMOVE) : undefined
        }
      />
    ),
    [handleIssues]
  );

  return (
    <>
      {issues?.loader === "init-loader" ? (
        <div className="flex h-full w-full items-center justify-center">
          <Spinner />
        </div>
      ) : (
        <div className={`relative h-full w-full bg-custom-background-90`}>
          <List
            issuesMap={issuesMap}
            displayProperties={displayProperties}
            group_by={group_by}
            handleIssues={handleIssues}
            quickActions={renderQuickActions}
            issueIds={issueIds}
            showEmptyGroup={showEmptyGroup}
            viewId={viewId}
            quickAddCallback={issues?.quickAddIssue}
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
          handleIssue={async (issueToUpdate) => await handleIssues(issueToUpdate as IIssue, EIssueActions.UPDATE)}
        />
      )}
    </>
  );
});
