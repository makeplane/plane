/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import useSWR from "swr";
import type { TMeetingDetail } from "@plane/types";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
// services
import { IssueService } from "@/services/issue";

const issueService = new IssueService();

/** Meeting fields of a work item, undefined until they are loaded. */
export const useMeeting = (workspaceSlug: string, projectId: string, issueId: string) => {
  const {
    issue: { getIssueById },
  } = useIssueDetail();
  const isMeeting = getIssueById(issueId)?.kind === "meeting";
  const { data, mutate } = useSWR(
    isMeeting ? ["MEETING", workspaceSlug, projectId, issueId] : null,
    () => issueService.retrieve(workspaceSlug, projectId, issueId),
    { revalidateOnFocus: false }
  );
  const meeting = isMeeting && data?.id === issueId ? (data.meeting as TMeetingDetail | null | undefined) : undefined;

  return { meeting, reload: mutate };
};
