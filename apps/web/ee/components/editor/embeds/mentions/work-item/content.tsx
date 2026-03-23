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

import { useCallback } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import type { TEditorWorkItemMention } from "@plane/types";
import { formatProjectWorkItemIdentifierForDisplay } from "@plane/utils";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
// local imports
import { EditorWorkItemMentionLogo } from "./logo";

type Props = {
  workItemDetails: TEditorWorkItemMention;
};

export const EditorWorkItemMentionContent = observer(function EditorWorkItemMentionContent(props: Props) {
  const { workItemDetails } = props;
  // params
  const { workspaceSlug } = useParams();
  // store hooks
  const { setPeekIssue } = useIssueDetail();
  // handle click to open the peek overview
  const handleClick = useCallback(() => {
    if (!workItemDetails || !workItemDetails.project_id || !workspaceSlug) return;

    setPeekIssue({
      issueId: workItemDetails.id,
      projectId: workItemDetails?.project_id,
      workspaceSlug: workspaceSlug.toString(),
    });
  }, [workItemDetails, setPeekIssue, workspaceSlug]);

  return (
    <button
      type="button"
      className="group/work-item-mention not-prose inline-flex items-center gap-1 text-13 font-medium outline-none"
      onClick={handleClick}
    >
      <EditorWorkItemMentionLogo
        className="shrink-0 size-3"
        projectId={workItemDetails.project_id}
        stateColor={workItemDetails.state__color}
        stateGroup={workItemDetails.state__group}
        workItemTypeId={workItemDetails.type_id}
      />
      <span className="shrink-0 text-tertiary">
        {formatProjectWorkItemIdentifierForDisplay(workItemDetails.project__identifier, workItemDetails.sequence_id)}
      </span>
      <span className="text-secondary group-hover/work-item-mention:text-primary transition-colors truncate">
        {workItemDetails.name}
      </span>
    </button>
  );
});
