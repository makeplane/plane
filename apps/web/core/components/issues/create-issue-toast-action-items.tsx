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

import React, { useCallback, useRef, useState } from "react";
import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import { Button, getButtonStyling } from "@plane/propel/button";
import { cn, copyTextToClipboard, copyUrlToClipboard, generateWorkItemLink } from "@plane/utils";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useProject } from "@/hooks/store/use-project";

type TCreateIssueToastActionItems = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  isEpic?: boolean;
};

export const CreateIssueToastActionItems = observer(function CreateIssueToastActionItems(
  props: TCreateIssueToastActionItems
) {
  const { workspaceSlug, issueId, isEpic = false } = props;
  const { t } = useTranslation();
  // state
  const [linkCopied, setLinkCopied] = useState(false);
  const [idCopied, setIdCopied] = useState(false);
  // refs for timeout cleanup
  const linkTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // store hooks
  const {
    issue: { getIssueById },
  } = useIssueDetail();
  const { getProjectIdentifierById } = useProject();

  // derived values
  const issue = getIssueById(issueId);
  const projectIdentifier = getProjectIdentifierById(issue?.project_id);

  const workItemLink = generateWorkItemLink({
    workspaceSlug,
    projectId: issue?.project_id,
    issueId,
    projectIdentifier,
    sequenceId: issue?.sequence_id,
    isEpic,
  });

  const workItemIdentifier = projectIdentifier && issue?.sequence_id ? `${projectIdentifier}-${issue.sequence_id}` : "";

  const handleCopyLink = useCallback(
    async (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      try {
        await copyUrlToClipboard(workItemLink);
        setLinkCopied(true);
        if (linkTimerRef.current) clearTimeout(linkTimerRef.current);
        linkTimerRef.current = setTimeout(() => setLinkCopied(false), 3000);
      } catch (_error) {
        setLinkCopied(false);
      }
      e.preventDefault();
      e.stopPropagation();
    },
    [workItemLink]
  );

  const handleCopyId = useCallback(
    async (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      try {
        await copyTextToClipboard(workItemIdentifier);
        setIdCopied(true);
        if (idTimerRef.current) clearTimeout(idTimerRef.current);
        idTimerRef.current = setTimeout(() => setIdCopied(false), 3000);
      } catch (_error) {
        setIdCopied(false);
      }
      e.preventDefault();
      e.stopPropagation();
    },
    [workItemIdentifier]
  );

  if (!issue) return null;

  return (
    <div className="flex items-center justify-between text-11 text-secondary w-full">
      <div className="flex items-center gap-1">
        <a
          href={workItemLink}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(getButtonStyling("ghost", "sm"), "text-accent-primary no-underline")}
        >
          {t("common.view")}
        </a>

        <Button variant="ghost" size="sm" onClick={handleCopyLink} disabled={linkCopied}>
          {linkCopied ? t("common.copied") : t("common.actions.copy_link")}
        </Button>
      </div>

      {workItemIdentifier && (
        <Button variant="ghost" size="sm" onClick={handleCopyId} disabled={idCopied}>
          {idCopied ? t("common.actions.id_copied") : workItemIdentifier}
        </Button>
      )}
    </div>
  );
});
