/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
import { observer } from "mobx-react";
import Link from "next/link";

import { useTranslation } from "@plane/i18n";
import { CloseOutline, EditOutline } from "@makeplane/propel/icons";
// plane imports
import { Button } from "@makeplane/propel/elements/button";
import { Icon } from "@makeplane/propel/components/icon";
import { IconButton } from "@makeplane/propel/components/icon-button";
import { Tooltip } from "@makeplane/propel/components/tooltip";
import { cn } from "@plane/utils";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useProject } from "@/hooks/store/use-project";
import { usePlatformOS } from "@/hooks/use-platform-os";
// components
import { IssueIdentifier } from "@/components/issues/issue-detail/issue-identifier";
// local imports
import { ParentIssuesListModal } from "../parent-issues-list-modal";

type TIssueParentSelect = {
  className?: string;
  disabled?: boolean;
  issueId: string;
  projectId: string;
  workspaceSlug: string;
  handleParentIssue: (_issueId?: string | null) => Promise<void>;
  handleRemoveSubIssue: (
    workspaceSlug: string,
    projectId: string,
    parentIssueId: string,
    issueId: string
  ) => Promise<void>;
  workItemLink: string;
};

export const IssueParentSelect = observer(function IssueParentSelect(props: TIssueParentSelect) {
  const {
    className = "",
    disabled = false,
    issueId,
    projectId,
    workspaceSlug,
    handleParentIssue,
    handleRemoveSubIssue,
    workItemLink,
  } = props;
  const { t } = useTranslation();
  // store hooks
  const { getProjectById } = useProject();
  const {
    issue: { getIssueById },
  } = useIssueDetail();
  const { isParentIssueModalOpen, toggleParentIssueModal } = useIssueDetail();

  // derived values
  const issue = getIssueById(issueId);
  const parentIssue = issue?.parent_id ? getIssueById(issue.parent_id) : undefined;
  const parentIssueProjectDetails =
    parentIssue && parentIssue.project_id ? getProjectById(parentIssue.project_id) : undefined;
  const { isMobile } = usePlatformOS();

  if (!issue) return <></>;

  return (
    <>
      <ParentIssuesListModal
        projectId={projectId}
        issueId={issueId}
        isOpen={isParentIssueModalOpen === issueId}
        handleClose={() => toggleParentIssueModal(null)}
        onChange={(issue: any) => handleParentIssue(issue?.id)}
      />
      <div
        className={cn(
          "group flex h-8 w-full min-w-0 items-center justify-between gap-2 rounded-md",
          {
            "px-2": !!(issue.parent_id && parentIssue),
            "hover:bg-layer-transparent-hover": !disabled,
            "bg-layer-transparent-selected": isParentIssueModalOpen,
          },
          className
        )}
      >
        {issue.parent_id && parentIssue ? (
          <>
            <div className="flex h-full min-w-0 flex-1 items-center gap-1.5">
              <Tooltip label={`Title: ${parentIssue.name}`} layout="stacked" disabled={isMobile}>
                <Link
                  href={workItemLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={
                    parentIssue.project_id && parentIssueProjectDetails
                      ? undefined
                      : parentIssue.name?.trim() || t("common.parent")
                  }
                  onClick={(e) => e.stopPropagation()}
                >
                  {parentIssue?.project_id && parentIssueProjectDetails && (
                    <IssueIdentifier
                      projectId={parentIssue.project_id}
                      issueTypeId={parentIssue.type_id}
                      projectIdentifier={parentIssueProjectDetails?.identifier}
                      issueSequenceId={parentIssue.sequence_id}
                      size="xs"
                      variant="secondary"
                    />
                  )}
                </Link>
              </Tooltip>
              {!disabled && (
                <Tooltip label={t("common.remove")} side="bottom" disabled={isMobile}>
                  <IconButton
                    variant="ghost"
                    size="xs"
                    aria-label={t("common.remove")}
                    showTooltip={false}
                    icon={<Icon icon={CloseOutline} />}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleRemoveSubIssue(workspaceSlug, projectId, parentIssue.id, issueId);
                    }}
                  />
                </Tooltip>
              )}
            </div>
            {!disabled && (
              <div className="shrink-0 opacity-0 group-focus-within:opacity-100 group-hover:opacity-100">
                <IconButton
                  variant="ghost"
                  size="xs"
                  aria-label={t("change_parent_issue")}
                  showTooltip={!isMobile}
                  icon={<Icon icon={EditOutline} />}
                  onClick={() => toggleParentIssueModal(issue.id)}
                />
              </div>
            )}
          </>
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="md"
            stretch="full"
            onClick={() => toggleParentIssueModal(issue.id)}
            disabled={disabled}
          >
            <span className="grow text-left text-body-xs-regular text-placeholder">{t("issue.add.parent")}</span>
            {!disabled && (
              <span className="shrink-0 opacity-0 group-focus-within:opacity-100 group-hover:opacity-100">
                <Icon icon={EditOutline} />
              </span>
            )}
          </Button>
        )}
      </div>
    </>
  );
});
