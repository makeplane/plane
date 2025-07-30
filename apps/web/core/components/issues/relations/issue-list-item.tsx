"use client";

import React, { FC } from "react";
import { observer } from "mobx-react";
import { X, Pencil, Trash, Link as LinkIcon } from "lucide-react";
// Plane
import { useTranslation } from "@plane/i18n";
import { EIssueServiceType, TIssue, TIssueServiceType } from "@plane/types";
import { ControlLink, CustomMenu, Tooltip } from "@plane/ui";
// components
import { generateWorkItemLink } from "@plane/utils";
import { RelationIssueProperty } from "@/components/issues/relations";
// helpers
// hooks
import { useIssueDetail, useProject } from "@/hooks/store";
import useIssuePeekOverviewRedirection from "@/hooks/use-issue-peek-overview-redirection";
import { usePlatformOS } from "@/hooks/use-platform-os";
// plane web components
import { IssueIdentifier } from "@/plane-web/components/issues";
import { TIssueRelationTypes } from "@/plane-web/types";
// local imports
import { useRelationOperations } from "../issue-detail-widgets/relations/helper";

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

export const RelationIssueListItem: FC<Props> = observer((props) => {
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
  const issueOperations = useRelationOperations(!!issue?.is_epic ? EIssueServiceType.EPICS : EIssueServiceType.ISSUES);
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

  const handleEditIssue = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.stopPropagation();
    e.preventDefault();
    handleIssueCrudState("update", relationIssueId, { ...issue });
    toggleCreateIssueModal(true);
  };

  const handleDeleteIssue = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.stopPropagation();
    e.preventDefault();
    handleIssueCrudState("delete", relationIssueId, issue);
    toggleDeleteIssueModal(relationIssueId);
    handleIssueCrudState("removeRelation", issueId, issue, relationKey, relationIssueId);
  };

  const handleCopyIssueLink = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.stopPropagation();
    e.preventDefault();
    issueOperations.copyLink(workItemLink);
  };

  const handleRemoveRelation = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
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
          <div className="group relative flex min-h-11 h-full w-full items-center gap-3 px-1.5 py-1 transition-all hover:bg-custom-background-90">
            <span className="size-5 flex-shrink-0" />
            <div className="flex w-full truncate cursor-pointer items-center gap-3">
              <div className="flex-shrink-0">
                {projectDetail && (
                  <IssueIdentifier
                    projectId={projectDetail.id}
                    issueTypeId={issue.type_id}
                    projectIdentifier={projectDetail.identifier}
                    issueSequenceId={issue.sequence_id}
                    textContainerClassName="text-xs text-custom-text-200"
                  />
                )}
              </div>

              <Tooltip tooltipContent={issue.name} isMobile={isMobile}>
                <span className="w-full truncate text-sm text-custom-text-100">{issue.name}</span>
              </Tooltip>
            </div>
            <div
              className="flex-shrink-0 text-sm"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
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
            <div className="flex-shrink-0 text-sm">
              <CustomMenu placement="bottom-end" ellipsis>
                {!disabled && (
                  <CustomMenu.MenuItem onClick={handleEditIssue}>
                    <div className="flex items-center gap-2">
                      <Pencil className="h-3.5 w-3.5" strokeWidth={2} />
                      <span>{t("common.actions.edit")}</span>
                    </div>
                  </CustomMenu.MenuItem>
                )}

                <CustomMenu.MenuItem onClick={handleCopyIssueLink}>
                  <div className="flex items-center gap-2">
                    <LinkIcon className="h-3.5 w-3.5" strokeWidth={2} />
                    <span>{t("common.actions.copy_link")}</span>
                  </div>
                </CustomMenu.MenuItem>

                {!disabled && (
                  <CustomMenu.MenuItem onClick={handleRemoveRelation}>
                    <div className="flex items-center gap-2">
                      <X className="h-3.5 w-3.5" strokeWidth={2} />
                      <span>{t("common.actions.remove_relation")}</span>
                    </div>
                  </CustomMenu.MenuItem>
                )}

                {!disabled && (
                  <CustomMenu.MenuItem onClick={handleDeleteIssue}>
                    <div className="flex items-center gap-2">
                      <Trash className="h-3.5 w-3.5" strokeWidth={2} />
                      <span>{t("common.actions.delete")}</span>
                    </div>
                  </CustomMenu.MenuItem>
                )}
              </CustomMenu>
            </div>
          </div>
        )}
      </ControlLink>
    </div>
  );
});
