import { List } from "./default";
import { FC, useCallback } from "react";
import { useRouter } from "next/router";
import { TIssue } from "@plane/types";
import { Spinner } from "@plane/ui";
import { IQuickActionProps } from "./list-view-types";
import { observer } from "mobx-react-lite";
import { IssuePeekOverview } from "components/issues";
import { EUserProjectRoles } from "constants/project";
import { useIssues, useUser } from "hooks/store";
import { IProjectIssues, IProjectIssuesFilter } from "store/issue/project";
import { ICycleIssues, ICycleIssuesFilter } from "store/issue/cycle";
import { IModuleIssues, IModuleIssuesFilter } from "store/issue/module";
import { IProfileIssues, IProfileIssuesFilter } from "store/issue/profile";
import { IProjectViewIssues, IProjectViewIssuesFilter } from "store/issue/project-views";
import { IDraftIssuesFilter, IDraftIssues } from "store/issue/draft";
import { IArchivedIssuesFilter, IArchivedIssues } from "store/issue/archived";
import { TCreateModalStoreTypes } from "constants/issue";

enum EIssueActions {
  UPDATE = "update",
  DELETE = "delete",
  REMOVE = "remove",
}

interface IBaseListRoot {
  issuesFilter:
    | IProjectIssuesFilter
    | IModuleIssuesFilter
    | ICycleIssuesFilter
    | IProjectViewIssuesFilter
    | IProfileIssuesFilter
    | IDraftIssuesFilter
    | IArchivedIssuesFilter;
  issues:
    | IProjectIssues
    | ICycleIssues
    | IModuleIssues
    | IProjectViewIssues
    | IProfileIssues
    | IDraftIssues
    | IArchivedIssues;
  QuickActions: FC<IQuickActionProps>;
  issueActions: {
    [EIssueActions.DELETE]: (issue: TIssue) => Promise<void>;
    [EIssueActions.UPDATE]?: (issue: TIssue) => Promise<void>;
    [EIssueActions.REMOVE]?: (issue: TIssue) => Promise<void>;
  };
  viewId?: string;
  currentStore: TCreateModalStoreTypes;
  addIssuesToView?: (issueIds: string[]) => Promise<TIssue>;
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

  const { issueMap } = useIssues();

  const isEditingAllowed = !!currentProjectRole && currentProjectRole >= EUserProjectRoles.MEMBER;

  const issueIds = issues?.groupedIssueIds || [];

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
    async (issue: TIssue, action: EIssueActions) => {
      if (issueActions[action]) {
        await issueActions[action]!(issue);
      }
    },
    [issueActions]
  );

  const renderQuickActions = useCallback(
    (issue: TIssue) => (
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [handleIssues]
  );

  return (
    <>
      <div className={`relative h-full w-full bg-custom-background-90`}>
        <List
          issuesMap={issueMap}
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

      {/* {workspaceSlug && peekIssueId && peekProjectId && (
        <IssuePeekOverview
          workspaceSlug={workspaceSlug.toString()}
          projectId={peekProjectId.toString()}
          issueId={peekIssueId.toString()}
          handleIssue={async (issueToUpdate) => await handleIssues(issueToUpdate as TIssue, EIssueActions.UPDATE)}
        />
      )} */}
    </>
  );
});
