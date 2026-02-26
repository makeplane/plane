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

import { AlertTriangle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
// plane types
import type { IIssueDisplayProperties } from "@plane/types";
import { Loader } from "@plane/ui";
// components
import { ClickableDiv } from "@/components/common";
import { IssueIdentifier } from "@/components/embed/issue/issue-identifier";
// constants
import { CallbackHandlerStrings } from "@/constants/callback-handler-strings";
import { ISSUE_DISPLAY_PROPERTIES } from "@/constants/issue";
// helpers
import { callNative } from "@/helpers";
// types
import type { TIssue } from "@/types/issue";

type Props = {
  issueId: string;
  projectId?: string;
  workspaceSlug?: string;
};

export const IssueEmbedCard: React.FC<Props> = (props) => {
  const { issueId, projectId, workspaceSlug } = props;

  // states
  const [issueDetails, setIssueDetails] = useState<TIssue | undefined>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  // issue display properties
  const displayProperties: IIssueDisplayProperties = {};

  ISSUE_DISPLAY_PROPERTIES.forEach((property) => {
    displayProperties[property.key] = true;
  });

  const fetchIssueDetails = useCallback(async () => {
    try {
      setIsLoading(true);
      const issue = await callNative<string>(
        CallbackHandlerStrings.getIssueDetails,
        JSON.stringify({
          issueId,
          projectId,
          workspaceSlug,
        })
      );
      if (!issue) return;
      setIssueDetails(JSON.parse(issue) as TIssue);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [issueId, projectId, workspaceSlug]);

  const handleClick = useCallback(() => {
    if (!issueId || !projectId) return;
    void callNative(
      CallbackHandlerStrings.onOpenWorkItemDetails,
      JSON.stringify({
        workItemId: issueId,
        projectId,
      })
    );
  }, [issueId, projectId]);

  // get the issue details from the native code.
  useEffect(() => {
    if (!issueDetails) void fetchIssueDetails();
  }, [issueDetails, fetchIssueDetails]);

  if (!issueDetails && isLoading)
    return (
      <div className="rounded-md my-4">
        <Loader>
          <Loader.Item height="30px" />
          <div className="mt-3 space-y-2">
            <Loader.Item height="20px" width="70%" />
            <Loader.Item height="20px" width="60%" />
          </div>
        </Loader>
      </div>
    );

  if (!issueDetails && !isLoading)
    return (
      <div className="flex items-center gap-3 rounded-md border-2 border-orange-500 bg-orange-500/10 text-orange-500 py-3 my-2 text-base">
        <AlertTriangle className="text-orange-500 size-8 pl-3 flex-shrink-0" />
        This work item embed is not found in any project. It can no longer be updated or accessed from here.
      </div>
    );

  return (
    <ClickableDiv
      onClick={handleClick}
      className="issue-embed cursor-pointer space-y-2 rounded-lg border border-strong bg-surface-1 shadow-raised-100 p-3 px-4 my-2"
    >
      <IssueIdentifier
        workspaceSlug={workspaceSlug}
        projectId={projectId}
        issueIdentifier={issueDetails?.sequenceId?.toString() ?? ""}
      />
      <h4 className="!text-base !font-medium !mb-2 !line-clamp-2 break-words">{issueDetails?.name}</h4>
    </ClickableDiv>
  );
};
