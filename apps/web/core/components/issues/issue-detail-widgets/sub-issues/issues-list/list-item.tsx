/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { observer } from "mobx-react";
import { Loader } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { LinkIcon, EditIcon, TrashIcon, CloseIcon, ChevronRightIcon } from "@plane/propel/icons";
// plane imports
import { Tooltip } from "@plane/propel/tooltip";
import type { TIssue, TIssueServiceType, TSubIssueOperations } from "@plane/types";
import { EIssueServiceType, EIssuesStoreType } from "@plane/types";
import { ControlLink, CustomMenu } from "@plane/ui";
import { cn, generateWorkItemLink } from "@plane/utils";
// helpers
import { useSubIssueOperations } from "@/components/issues/issue-detail-widgets/sub-issues/helper";
import { WithDisplayPropertiesHOC } from "@/components/issues/issue-layouts/properties/with-display-properties-HOC";
import { IssueIdentifier } from "@/components/issues/issue-detail/issue-identifier";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useProject } from "@/hooks/store/use-project";
import useIssuePeekOverviewRedirection from "@/hooks/use-issue-peek-overview-redirection";
import { usePlatformOS } from "@/hooks/use-platform-os";
import { useEpicAnalytics } from "@/plane-web/hooks/store";
// local components
import { SubIssuesListItemProperties } from "./properties";
import { SubIssuesListRoot } from "./root";
import type { TWorkItemProperty } from "@/store/work-items/permissions/root";

type Props = {
  workspaceSlug: string;
  projectId: string;
  parentIssueId: string;
  rootIssueId: string;
  spacingLeft: number;
  permissions: {
    getCanView: (projectId: string, workItemId: string) => boolean;
    getCanEdit: (projectId: string, workItemId: string) => boolean;
    getCanEditProperty: (projectId: string, workItemId: string, property: TWorkItemProperty) => boolean;
    getCanDelete: (projectId: string, workItemId: string) => boolean;
    getCanRemove: (
      parentWorkItemProjectId: string,
      parentWorkItemId: string,
      projectId: string,
      workItemId: string
    ) => boolean;
  };
  handleIssueCrudState: (
    key: "create" | "existing" | "update" | "delete",
    issueId: string,
    issue?: TIssue | null
  ) => void;
  subIssueOperations: TSubIssueOperations;
  issueId: string;
  issueServiceType?: TIssueServiceType;
  storeType?: EIssuesStoreType;
};

export const SubIssuesListItem = observer(function SubIssuesListItem(props: Props) {
  const {
    workspaceSlug,
    projectId,
    parentIssueId,
    rootIssueId,
    issueId,
    spacingLeft = 10,
    permissions,
    handleIssueCrudState,
    subIssueOperations,
    issueServiceType = EIssueServiceType.ISSUES,
    storeType = EIssuesStoreType.PROJECT,
  } = props;
  const { t } = useTranslation();
  const {
    issue: { getIssueById },
    subIssues: {
      filters: { getSubIssueFilters },
    },
  } = useIssueDetail(issueServiceType);
  const {
    subIssues: { subIssueHelpersByIssueId, setSubIssueHelpers },
  } = useIssueDetail();
  const { fetchSubIssues } = useSubIssueOperations(EIssueServiceType.ISSUES);
  const { toggleCreateIssueModal, toggleDeleteIssueModal } = useIssueDetail(issueServiceType);
  const project = useProject();
  const { handleRedirection } = useIssuePeekOverviewRedirection();
  const { fetchEpicAnalytics } = useEpicAnalytics();
  const { isMobile } = usePlatformOS();
  const issue = getIssueById(issueId);
  const parentIssue = getIssueById(parentIssueId);

  // derived values
  const projectDetail = (issue && issue.project_id && project.getProjectById(issue.project_id)) || undefined;

  const subIssueHelpers = subIssueHelpersByIssueId(parentIssueId);
  const subIssueCount = issue?.sub_issues_count ?? 0;

  // derived values
  const subIssueFilters = getSubIssueFilters(parentIssueId);
  const displayProperties = subIssueFilters?.displayProperties ?? {};

  if (!issue || !issue.project_id) return <></>;

  const handleIssuePeekOverview = (issue: TIssue) => {
    if (canView) {
      handleRedirection(workspaceSlug, issue, isMobile);
    }
  };

  // check if current issue is the root issue
  const isCurrentIssueRoot = issueId === rootIssueId;

  // permissions
  const canView = permissions.getCanView(issue.project_id, issueId);
  const canEditProperty = permissions.getCanEditProperty.bind(permissions, issue.project_id, issueId);
  const canEdit = permissions.getCanEdit(issue.project_id, issueId);
  const canDelete = permissions.getCanDelete(issue.project_id, issueId);
  const canRemove = permissions.getCanRemove(projectId, parentIssueId, issue.project_id, issueId);

  // generate work item link
  const workItemLink = generateWorkItemLink({
    workspaceSlug,
    projectId: issue?.project_id,
    issueId: issue?.id,
    projectIdentifier: projectDetail?.identifier,
    sequenceId: issue?.sequence_id,
  });

  return (
    <div key={issueId}>
      <ControlLink
        id={`issue-${issue.id}`}
        href={workItemLink}
        onClick={() => handleIssuePeekOverview(issue)}
        className="w-full cursor-pointer"
        disabled={!canView}
      >
        {issue && (
          <div
            className={cn(
              "group relative flex min-h-11 h-full w-full items-center pr-2 py-1 transition-all hover:bg-surface-2",
              {
                "hover:cursor-not-allowed": !canView,
              }
            )}
            style={{ paddingLeft: `${spacingLeft}px` }}
          >
            <div className="flex size-5 items-center justify-center flex-shrink-0">
              {/* disable the chevron when current issue is also the root issue*/}
              {subIssueCount > 0 && !isCurrentIssueRoot && (
                <>
                  {subIssueHelpers.preview_loader.includes(issue.id) ? (
                    <div className="flex h-full w-full cursor-not-allowed items-center justify-center rounded-xs bg-layer-1 transition-all">
                      <Loader width={14} strokeWidth={2} className="animate-spin" />
                    </div>
                  ) : (
                    <div
                      className={cn(
                        "flex h-full w-full cursor-pointer items-center justify-center text-placeholder hover:text-tertiary",
                        {
                          "cursor-not-allowed": !canView,
                        }
                      )}
                      onClick={async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (!subIssueHelpers.issue_visibility.includes(issueId)) {
                          setSubIssueHelpers(parentIssueId, "preview_loader", issueId);
                          await fetchSubIssues(workspaceSlug, projectId, issueId);
                          setSubIssueHelpers(parentIssueId, "preview_loader", issueId);
                        }
                        setSubIssueHelpers(parentIssueId, "issue_visibility", issueId);
                      }}
                    >
                      <ChevronRightIcon
                        className={cn("size-3.5 transition-all", {
                          "rotate-90": subIssueHelpers.issue_visibility.includes(issue.id),
                        })}
                        strokeWidth={2.5}
                      />
                    </div>
                  )}
                </>
              )}
            </div>

            <div
              className={cn("flex w-full truncate cursor-pointer items-center gap-3", {
                "cursor-not-allowed": !canView,
              })}
            >
              <WithDisplayPropertiesHOC displayProperties={displayProperties || {}} displayPropertyKey="key">
                <div className="flex-shrink-0">
                  {projectDetail && (
                    <IssueIdentifier
                      projectId={projectDetail.id}
                      issueTypeId={issue.type_id}
                      projectIdentifier={projectDetail.identifier}
                      issueSequenceId={issue.sequence_id}
                      size="xs"
                      variant="secondary"
                    />
                  )}
                </div>
              </WithDisplayPropertiesHOC>
              <Tooltip tooltipContent={issue.name} isMobile={isMobile}>
                <span className="flex-1 w-0 truncate text-13 text-primary">{issue.name}</span>
              </Tooltip>
            </div>

            <div
              className="flex-shrink-0 text-13"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              <SubIssuesListItemProperties
                workspaceSlug={workspaceSlug}
                parentIssueId={parentIssueId}
                issueId={issueId}
                canEditProperty={canEditProperty}
                updateSubIssue={subIssueOperations.updateSubIssue}
                displayProperties={displayProperties}
                issue={issue}
              />
            </div>

            <div className="flex-shrink-0 text-13">
              <CustomMenu placement="top-end" ellipsis>
                {canEdit && (
                  <CustomMenu.MenuItem
                    onClick={() => {
                      handleIssueCrudState("update", parentIssueId, { ...issue });
                      toggleCreateIssueModal(true);
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <EditIcon className="h-3.5 w-3.5" strokeWidth={2} />
                      <span>{t("issue.edit")}</span>
                    </div>
                  </CustomMenu.MenuItem>
                )}

                <CustomMenu.MenuItem
                  onClick={() => {
                    subIssueOperations.copyLink(workItemLink);
                  }}
                >
                  <div className="flex items-center gap-2">
                    <LinkIcon className="h-3.5 w-3.5" strokeWidth={2} />
                    <span>{t("issue.copy_link")}</span>
                  </div>
                </CustomMenu.MenuItem>

                {canRemove && (
                  <CustomMenu.MenuItem
                    onClick={async () => {
                      if (issue.project_id)
                        await subIssueOperations
                          .removeSubIssue(workspaceSlug, issue.project_id, parentIssueId, issue.id)
                          .then(() => {
                            if (parentIssue?.is_epic) fetchEpicAnalytics(workspaceSlug, projectId, parentIssue.id);
                          });
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <CloseIcon className="h-3.5 w-3.5" strokeWidth={2} />
                      {issueServiceType === EIssueServiceType.ISSUES
                        ? t("issue.remove.parent.label")
                        : t("issue.remove.label")}
                    </div>
                  </CustomMenu.MenuItem>
                )}

                {canDelete && (
                  <CustomMenu.MenuItem
                    onClick={() => {
                      handleIssueCrudState("delete", parentIssueId, issue);
                      toggleDeleteIssueModal(issue.id);
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <TrashIcon className="h-3.5 w-3.5" strokeWidth={2} />
                      <span>{t("issue.delete.label")}</span>
                    </div>
                  </CustomMenu.MenuItem>
                )}
              </CustomMenu>
            </div>
          </div>
        )}
      </ControlLink>

      {/* should not expand the current issue if it is also the root issue*/}
      {subIssueHelpers.issue_visibility.includes(issueId) &&
        issue.project_id &&
        subIssueCount > 0 &&
        !isCurrentIssueRoot && (
          <SubIssuesListRoot
            storeType={storeType}
            workspaceSlug={workspaceSlug}
            projectId={issue.project_id}
            parentIssueId={issue.id}
            rootIssueId={rootIssueId}
            spacingLeft={spacingLeft + 22}
            permissions={permissions}
            handleIssueCrudState={handleIssueCrudState}
            subIssueOperations={subIssueOperations}
          />
        )}
    </div>
  );
});
