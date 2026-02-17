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
import { useParams } from "react-router";
import useSWRImmutable from "swr/immutable";
// plane imports
import { Popover } from "@plane/propel/popover";
import type { TEditorWorkItemMention } from "@plane/types";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useProject } from "@/hooks/store/use-project";
import { useProjectState } from "@/hooks/store/use-project-state";
// services
import { WorkspaceService } from "@/services/workspace.service";
// local imports
import type { TEditorMentionComponentProps } from "../root";
import { EditorWorkItemMentionContent } from "./content";
import { EditorWorkItemMentionPreview } from "./preview";
// services init
const workspaceService = new WorkspaceService();

export const EditorWorkItemMention = observer(function EditorWorkItemMention(props: TEditorMentionComponentProps) {
  const { entity_identifier: workItemId, getMentionDetails } = props;
  // params
  const { workspaceSlug } = useParams();
  // store hooks
  const {
    issue: { getIssueById },
  } = useIssueDetail();
  const { getStateById } = useProjectState();
  const { getProjectIdentifierById } = useProject();
  // construct formatted work item details from store data
  const workItemDetailsFromStore = getIssueById(workItemId);
  const stateDetails = workItemDetailsFromStore ? getStateById(workItemDetailsFromStore?.state_id) : undefined;
  const projectIdentifier = workItemDetailsFromStore?.project_id
    ? getProjectIdentifierById(workItemDetailsFromStore.project_id)
    : undefined;
  const formattedWorkItemDetails: TEditorWorkItemMention | undefined =
    workItemDetailsFromStore && stateDetails && projectIdentifier
      ? {
          ...workItemDetailsFromStore,
          state__group: stateDetails?.group,
          state__name: stateDetails?.name,
          state__color: stateDetails?.color,
          project__identifier: projectIdentifier,
        }
      : undefined;
  // derived values
  const savedWorkItemDetails = formattedWorkItemDetails || getMentionDetails?.("issue_mention", workItemId);
  // fetch work item details
  const {
    data: fetchedWorkItemDetails,
    isLoading: isFetchingWorkItemDetails,
    error: errorFetchingWorkItemDetails,
  } = useSWRImmutable(
    workspaceSlug && !savedWorkItemDetails ? `WORK_ITEM_MENTION_DETAILS_${workItemId}` : null,
    workspaceSlug && !savedWorkItemDetails
      ? () => workspaceService.retrieveWorkspaceWorkItem(workspaceSlug, workItemId)
      : null,
    {
      shouldRetryOnError: false,
    }
  );
  const workItemDetails = savedWorkItemDetails || fetchedWorkItemDetails;

  return (
    <div className="not-prose inline! px-1 py-0.5 rounded bg-accent-primary/10 border border-strong-1 no-underline cursor-pointer max-w-full truncate">
      <Popover>
        <Popover.Trigger className="truncate" nativeButton={false} delay={100} openOnHover>
          {workItemDetails && !errorFetchingWorkItemDetails ? (
            <EditorWorkItemMentionContent workItemDetails={workItemDetails} />
          ) : (
            <span className="text-tertiary">{isFetchingWorkItemDetails ? "..." : "work item not found"}</span>
          )}
        </Popover.Trigger>
        <Popover.Content side="bottom" align="start">
          <div className="p-3 space-y-2 w-72 rounded-lg shadow-raised-200 bg-surface-1 border-[0.5px] border-subtle-1">
            {workItemDetails ? (
              <EditorWorkItemMentionPreview workItemDetails={workItemDetails} />
            ) : (
              <p className="text-tertiary text-13">
                The mentioned work item is not found. It&apos;s either deleted or not accessible to you.
              </p>
            )}
          </div>
        </Popover.Content>
      </Popover>
    </div>
  );
});
