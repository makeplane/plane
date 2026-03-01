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

import { useRef } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
// plane imports
import { E_FEATURE_FLAGS } from "@plane/constants";
import type { EditorRefApi } from "@plane/editor";
import { EAgentRunStatus } from "@plane/types";
import { cn } from "@plane/utils";
// components
import { useWorkItemCommentOperations } from "@/components/issues/issue-detail/issue-activity/helper";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useWorkspace } from "@/hooks/store/use-workspace";
// plane-web imports
import { useAgent } from "@/plane-web/hooks/store";
// local imports
import { WithFeatureFlagHOC } from "../feature-flags";
import { ConversationLoader } from "./conversation/loader";
import { Messages } from "./conversation/messages";
import { AgentHeader } from "./header";
import { AgentInput } from "./input";

export const AgentSidecar = observer(function AgentSidecar(props: { isOpen: boolean; closeSidecar: () => void }) {
  const { isOpen, closeSidecar } = props;
  const { workspaceSlug, projectId, workItem } = useParams();
  // refs
  const editorRef = useRef<EditorRefApi>(null);
  // hooks
  const { getWorkspaceBySlug } = useWorkspace();
  const { activeRun, activeRunId, activitiesLoader, fetchRunActivities, fetchRunById } = useAgent();
  const {
    peekIssue,
    issue: { getIssueById, getIssueIdByIdentifier },
  } = useIssueDetail();
  // derived values
  const peekIssueId = peekIssue?.issueId;
  const workspaceId = getWorkspaceBySlug(workspaceSlug)?.id;
  const issueId = getIssueIdByIdentifier(workItem);
  const issueDetails = issueId ? getIssueById(issueId.toString()) : undefined;
  const projectIdToUse = projectId || issueDetails?.project_id || "";
  const activityOperations = useWorkItemCommentOperations(workspaceSlug, projectIdToUse, issueId || peekIssueId || "");

  // fetch run by id
  const { isLoading: isLoadingRun } = useSWR(
    activeRunId ? `AGENT_RUN_${activeRunId}` : null,
    activeRunId ? () => fetchRunById(activeRunId, workspaceSlug) : null,
    {
      revalidateOnFocus: false,
      revalidateIfStale: false,
      errorRetryCount: 0,
    }
  );

  // Poll for run activities every 5 seconds
  useSWR(
    activeRun?.id && (activeRun?.status === EAgentRunStatus.IN_PROGRESS || activitiesLoader === "init-loader")
      ? `AGENT_RUN_ACTIVITIES_${activeRun?.id}`
      : null,
    activeRun?.id && (activeRun?.status === EAgentRunStatus.IN_PROGRESS || activitiesLoader === "init-loader")
      ? () => fetchRunActivities(workspaceSlug?.toString() || "", activeRun?.id)
      : null,
    {
      refreshInterval: 5000,
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  if (!activeRunId || (activeRun?.issue && activeRun?.issue !== peekIssueId && activeRun?.issue !== issueId))
    return null;
  return (
    <WithFeatureFlagHOC workspaceSlug={workspaceSlug} flag={E_FEATURE_FLAGS.AGENT_SIDECAR} fallback={<></>}>
      <div
        className={cn(
          "transform transition-all duration-300 ease-in-out overflow-x-hidden bg-surface-1",
          "rounded-lg border border-subtle-1 h-full max-w-[400px]",
          isOpen ? "translate-x-0 w-[400px] mr-2" : "px-0 translate-x-[100%] w-0 border-none"
        )}
        data-prevent-outside-click
      >
        <div className="flex flex-col flex-1 h-full w-full">
          {/* Header */}
          <AgentHeader
            isLoading={isLoadingRun}
            toggleSidePanel={closeSidecar}
            agentUser={activeRun?.agent_user}
            agentStatus={activeRun?.status}
          />
          <div
            className={cn(
              "px-4 relative flex flex-col h-[90%] flex-1 align-middle justify-center max-w-[400px] md:m-auto w-full"
            )}
          >
            <div className={cn("flex-1 flex h-full relative")}>
              {isLoadingRun ? (
                <div className="w-full flex h-full relative">
                  <ConversationLoader />
                </div>
              ) : (
                <Messages
                  workspaceId={workspaceId}
                  workspaceSlug={workspaceSlug}
                  projectId={projectIdToUse}
                  activeRunStatus={activeRun?.status}
                />
              )}
            </div>
            <div className={cn("absolute bottom-0 left-4 right-4 pb-4 bg-surface-1")}>
              <AgentInput
                editorRef={editorRef}
                workspaceSlug={workspaceSlug}
                projectId={projectIdToUse}
                entityId={activeRun?.id}
                commentId={activeRun?.comment}
                activityOperations={activityOperations}
                callback={() => fetchRunActivities(workspaceSlug?.toString() || "", activeRun?.id)}
              />
            </div>
          </div>
        </div>
      </div>
    </WithFeatureFlagHOC>
  );
});
