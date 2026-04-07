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

import { useState } from "react";
import { observer } from "mobx-react";
import { MinusCircle } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import type { TIssue } from "@plane/types";
// ui
import { ControlLink, CustomMenu } from "@plane/ui";
// helpers
import { cn, generateWorkItemLink } from "@plane/utils";
// hooks
import { useAppRouter } from "@/hooks/use-app-router";
import { useIssues } from "@/hooks/store/use-issues";
import { useProject } from "@/hooks/store/use-project";
import useIssuePeekOverviewRedirection from "@/hooks/use-issue-peek-overview-redirection";
import { usePlatformOS } from "@/hooks/use-platform-os";
// plane web components
import { IssueIdentifier } from "@/components/issues/issue-detail/issue-identifier";
// types
import type { TIssueOperations } from "../root";
import { IssueParentSiblings } from "./siblings";

export type TIssueParentDetail = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  issue: TIssue;
  issueOperations: TIssueOperations;
};

export const IssueParentDetail = observer(function IssueParentDetail(props: TIssueParentDetail) {
  const { workspaceSlug, projectId, issueId, issue, issueOperations } = props;
  // router
  const router = useAppRouter();
  const { t } = useTranslation();
  // state
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  // hooks
  const { getWorkItemById } = useIssues();
  const { handleRedirection } = useIssuePeekOverviewRedirection();
  const { isMobile } = usePlatformOS();
  const { getProjectIdentifierById } = useProject();

  // derived values
  const parentIssue = issue.parent_id ? getWorkItemById(issue.parent_id) : undefined;
  const isParentEpic = parentIssue?.is_epic;
  const projectIdentifier = getProjectIdentifierById(parentIssue?.project_id);

  if (!parentIssue) return <></>;

  const workItemLink = generateWorkItemLink({
    workspaceSlug,
    projectId: parentIssue?.project_id,
    issueId: parentIssue.id,
    projectIdentifier,
    sequenceId: parentIssue.sequence_id,
    isEpic: isParentEpic,
  });

  const handleParentIssueClick = () => {
    if (isParentEpic) router.push(workItemLink);
    else handleRedirection(workspaceSlug, parentIssue, isMobile);
  };

  return (
    <div className="group/parent flex items-center gap-0.5">
      <ControlLink href={workItemLink} onClick={handleParentIssueClick} className="flex items-center gap-1.5">
        {parentIssue.project_id && (
          <IssueIdentifier
            projectId={parentIssue.project_id}
            issueId={parentIssue.id}
            size="md"
            variant="secondary"
            showWorkItemTypeName
          />
        )}
      </ControlLink>

      <CustomMenu
        onOpen={() => setIsMenuOpen(true)}
        onMenuClose={() => setIsMenuOpen(false)}
        ellipsis
        placement="bottom-end"
        optionsClassName="p-1.5"
        buttonClassName={cn("group-hover/parent:block transition-opacity", {
          hidden: !isMenuOpen,
        })}
      >
        <div className="border-b border-strong text-11 font-medium text-secondary">{t("issue.sibling.label")}</div>

        <IssueParentSiblings workspaceSlug={workspaceSlug} currentIssue={issue} parentIssue={parentIssue} />

        <CustomMenu.MenuItem
          onClick={() =>
            issueOperations.update(workspaceSlug, projectId, issueId, {
              parent_id: null,
            })
          }
          className="flex items-center gap-2 py-2 text-danger-primary"
        >
          <MinusCircle className="h-4 w-4" />
          <span>{t("issue.remove.parent.label")}</span>
        </CustomMenu.MenuItem>
      </CustomMenu>
    </div>
  );
});
