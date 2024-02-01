import { List } from "./default";
import { FC, useCallback } from "react";
import { observer } from "mobx-react-lite";
// types
import { TIssue } from "@plane/types";
import { IProjectIssues, IProjectIssuesFilter } from "store/issue/project";
import { ICycleIssues, ICycleIssuesFilter } from "store/issue/cycle";
import { IModuleIssues, IModuleIssuesFilter } from "store/issue/module";
import { IProfileIssues, IProfileIssuesFilter } from "store/issue/profile";
import { IProjectViewIssues, IProjectViewIssuesFilter } from "store/issue/project-views";
import { IDraftIssuesFilter, IDraftIssues } from "store/issue/draft";
import { IArchivedIssuesFilter, IArchivedIssues } from "store/issue/archived";
// components
import { IQuickActionProps } from "./list-view-types";
// constants
import { EUserProjectRoles } from "constants/project";
import { TCreateModalStoreTypes } from "constants/issue";
// hooks
import { useIssues, useUser } from "hooks/store";

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
  storeType: TCreateModalStoreTypes;
  addIssuesToView?: (issueIds: string[]) => Promise<any>;
  canEditPropertiesBasedOnProject?: (projectId: string) => boolean;
}

export const BaseListRoot = observer((props: IBaseListRoot) => {
  const {
    issuesFilter,
    issues,
    QuickActions,
    issueActions,
    viewId,
    storeType,
    addIssuesToView,
    canEditPropertiesBasedOnProject,
  } = props;
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
          storeType={storeType}
          addIssuesToView={addIssuesToView}
        />
      </div>
    </>
  );
});
