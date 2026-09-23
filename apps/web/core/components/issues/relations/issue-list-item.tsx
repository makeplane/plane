/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import { CloseOutline, DeleteOutline, EditOutline, LinkOutline, MoreHorizontalOutline } from "@makeplane/propel/icons";
// plane imports
import { Icon } from "@makeplane/propel/components/icon";
import { IconButton } from "@makeplane/propel/components/icon-button";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@makeplane/propel/components/menu";
import { Tooltip } from "@makeplane/propel/components/tooltip";
import type { TIssueRelationTypes } from "@plane/types";
import type { TIssue, TIssueServiceType } from "@plane/types";
import { EIssueServiceType } from "@plane/types";
import { ControlLink } from "@plane/blocks/layout";
import { generateWorkItemLink } from "@plane/utils";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useProject } from "@/hooks/store/use-project";
import useIssuePeekOverviewRedirection from "@/hooks/use-issue-peek-overview-redirection";
import { usePlatformOS } from "@/hooks/use-platform-os";
// components
import { IssueIdentifier } from "@/components/issues/issue-detail/issue-identifier";
// local imports
import { useRelationOperations } from "../issue-detail-widgets/relations/helper";
import { RelationIssueProperty } from "./properties";

type Props = {
  workspaceSlug: string;
  issueId: string;
  relationKey: TIssueRelationTypes;
  relationIssueId: string;
  disabled: boolean;
  handleIssueCrudState: (
    key: "update" | "delete" | "removeRelation",
    issueId: string,
    issue?: TIssue | null,
    relationKey?: TIssueRelationTypes | null,
    relationIssueId?: string | null
  ) => void;
  issueServiceType?: TIssueServiceType;
};

export const RelationIssueListItem = observer(function RelationIssueListItem(props: Props) {
  const {
    workspaceSlug,
    issueId,
    relationKey,
    relationIssueId,
    disabled = false,
    handleIssueCrudState,
    issueServiceType = EIssueServiceType.ISSUES,
  } = props;

  const { t } = useTranslation();

  // store hooks
  const {
    issue: { getIssueById },
    removeRelation,
    toggleCreateIssueModal,
    toggleDeleteIssueModal,
  } = useIssueDetail(issueServiceType);
  const project = useProject();
  const { isMobile } = usePlatformOS();
  // derived values
  const issue = getIssueById(relationIssueId);
  const { handleRedirection } = useIssuePeekOverviewRedirection(!!issue?.is_epic);
  const issueOperations = useRelationOperations(issue?.is_epic ? EIssueServiceType.EPICS : EIssueServiceType.ISSUES);
  const projectDetail = (issue && issue.project_id && project.getProjectById(issue.project_id)) || undefined;
  const projectId = issue?.project_id;

  if (!issue || !projectId) return <></>;

  const workItemLink = generateWorkItemLink({
    workspaceSlug: workspaceSlug.toString(),
    projectId: issue?.project_id,
    issueId: issue?.id,
    projectIdentifier: projectDetail?.identifier,
    sequenceId: issue?.sequence_id,
    isEpic: issue?.is_epic,
  });

  // handlers
  const handleIssuePeekOverview = (issue: TIssue) => {
    if (issue.is_epic) {
      // open epics in new tab
      window.open(workItemLink, "_blank");
      return;
    }
    handleRedirection(workspaceSlug, issue, isMobile);
  };

  const handleEditIssue = (e: React.MouseEvent<HTMLElement, MouseEvent>) => {
    e.stopPropagation();
    e.preventDefault();
    handleIssueCrudState("update", relationIssueId, { ...issue });
    toggleCreateIssueModal(true);
  };

  const handleDeleteIssue = (e: React.MouseEvent<HTMLElement, MouseEvent>) => {
    e.stopPropagation();
    e.preventDefault();
    handleIssueCrudState("delete", relationIssueId, issue);
    toggleDeleteIssueModal(relationIssueId);
    handleIssueCrudState("removeRelation", issueId, issue, relationKey, relationIssueId);
  };

  const handleCopyIssueLink = (e: React.MouseEvent<HTMLElement, MouseEvent>) => {
    e.stopPropagation();
    e.preventDefault();
    issueOperations.copyLink(workItemLink);
  };

  const handleRemoveRelation = (e: React.MouseEvent<HTMLElement, MouseEvent>) => {
    e.preventDefault();
    e.stopPropagation();
    removeRelation(workspaceSlug, projectId, issueId, relationKey, relationIssueId);
  };

  return (
    <div key={relationIssueId}>
      <ControlLink
        id={`issue-${issue.id}`}
        href={workItemLink}
        onClick={() => handleIssuePeekOverview(issue)}
        className="w-full cursor-pointer"
      >
        {issue && (
          <div className="group relative flex h-full min-h-11 w-full items-center px-1.5 py-1 transition-all hover:bg-surface-2">
            <span className="size-5 flex-shrink-0" />
            <div className="flex min-w-0 flex-1 cursor-pointer items-center gap-3">
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

              <Tooltip label={issue.name} layout="stacked" disabled={isMobile}>
                <span className="w-0 flex-1 truncate text-13 text-primary">{issue.name}</span>
              </Tooltip>
            </div>
            {/* The row's ControlLink activates on click and on Enter/Space, so a property picker's
                own activation must not reach it. */}
            <div
              role="presentation"
              className="flex-shrink-0 text-13"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") e.stopPropagation();
              }}
            >
              <RelationIssueProperty
                workspaceSlug={workspaceSlug}
                issueId={relationIssueId}
                disabled={disabled}
                issueOperations={issueOperations}
                issueServiceType={issueServiceType}
              />
            </div>
            {/* The row's ControlLink activates on click and on Enter/Space, so the menu's own
                activation must not reach it. */}
            <div
              role="presentation"
              className="flex-shrink-0 pl-2 text-13"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") e.stopPropagation();
              }}
            >
              <Menu>
                {/* Icon-only trigger, so it needs an explicit accessible name. */}
                <MenuTrigger
                  render={
                    <IconButton
                      variant="ghost"
                      size="sm"
                      aria-label={t("aria_labels.common.more_actions")}
                      icon={<Icon icon={MoreHorizontalOutline} />}
                    />
                  }
                />
                <MenuContent side="bottom" align="end">
                  {!disabled && (
                    <MenuItem
                      icon={<Icon icon={EditOutline} />}
                      label={t("common.actions.edit")}
                      onClick={handleEditIssue}
                    />
                  )}
                  <MenuItem
                    icon={<Icon icon={LinkOutline} />}
                    label={t("common.actions.copy_link")}
                    onClick={handleCopyIssueLink}
                  />
                  {!disabled && (
                    <MenuItem
                      icon={<Icon icon={CloseOutline} />}
                      label={t("common.actions.remove_relation")}
                      onClick={handleRemoveRelation}
                    />
                  )}
                  {!disabled && (
                    <MenuItem
                      icon={<Icon icon={DeleteOutline} />}
                      label={t("common.actions.delete")}
                      onClick={handleDeleteIssue}
                    />
                  )}
                </MenuContent>
              </Menu>
            </div>
          </div>
        )}
      </ControlLink>
    </div>
  );
});
