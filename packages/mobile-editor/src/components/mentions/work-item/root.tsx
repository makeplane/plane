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
import { useCallback, useEffect, useMemo, useState } from "react";
// constants
import { CallbackHandlerStrings } from "@/constants/callback-handler-strings";
// helpers
import { callNative } from "@/helpers";
// store
import { useMentions } from "@/hooks/store";
// local types
import type { TWorkItemMentionResponse } from "@/types";
// local imports
import type { TEditorMentionComponentProps } from "../mention-root";
import { EditorWorkItemMentionContent } from "./content";

export const EditorWorkItemMention: React.FC<TEditorMentionComponentProps> = observer((props) => {
  const { entity_identifier: workItemId, getMentionDetails, workspaceSlug } = props;

  const [workItemDetails, setWorkItemDetails] = useState<TWorkItemMentionResponse | undefined>(undefined);
  const [isFetchingWorkItemDetails, setIsFetchingWorkItemDetails] = useState<boolean>(true);
  const { fetchWorkItemMentionById, isFetchingMentions } = useMentions();
  // derived values
  const savedWorkItemDetails = useMemo(
    () => getMentionDetails?.("issue_mention", workItemId),
    [getMentionDetails, workItemId]
  );

  // fetch work item mention details
  const fetchWorkItemDetails = useCallback(async () => {
    try {
      setIsFetchingWorkItemDetails(true);
      await fetchWorkItemMentionById(workItemId);
      const fetchedWorkItemDetails = getMentionDetails?.("issue_mention", workItemId);
      setWorkItemDetails(fetchedWorkItemDetails);
    } catch (error) {
      console.error(error);
    } finally {
      setIsFetchingWorkItemDetails(false);
    }
  }, [workItemId, getMentionDetails, fetchWorkItemMentionById]);

  // get the issue details from the native code.
  useEffect(() => {
    if (!workItemDetails && !savedWorkItemDetails && !isFetchingMentions) void fetchWorkItemDetails();
    else if (savedWorkItemDetails) {
      setIsFetchingWorkItemDetails(false);
      setWorkItemDetails(savedWorkItemDetails);
    }
  }, [workItemDetails, fetchWorkItemDetails, savedWorkItemDetails, isFetchingMentions]);

  const handleClick = useCallback(() => {
    if (!workItemDetails || !workItemDetails.projectId) return;
    void callNative(
      CallbackHandlerStrings.onOpenWorkItemDetails,
      JSON.stringify({
        workItemId: workItemDetails.id,
        projectId: workItemDetails.projectId,
      })
    );
  }, [workItemDetails]);

  return (
    <div
      onClick={handleClick}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          handleClick();
        }
      }}
      role="button"
      tabIndex={0}
      className="not-prose !inline px-1 py-0.5 rounded bg-custom-primary-100/10 border border-custom-border-200 no-underline cursor-pointer"
    >
      {workItemDetails ? (
        <EditorWorkItemMentionContent workItemDetails={workItemDetails} workspaceSlug={workspaceSlug} />
      ) : (
        <span className="text-custom-text-300">{isFetchingWorkItemDetails ? "..." : "work item not found"}</span>
      )}
    </div>
  );
});
