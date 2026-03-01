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
import { Dot, PanelRight } from "lucide-react";
// plane imports
import { E_FEATURE_FLAGS } from "@plane/constants";
import { Button } from "@plane/propel/button";
import { EAgentRunStatus } from "@plane/types";
import type { TIssueComment } from "@plane/types";
// hooks
import { useMember } from "@/hooks/store/use-member";
// plane-web imports
import { useAgent, useTheme } from "@/plane-web/hooks/store";
// local imports
import { WithFeatureFlagHOC } from "../feature-flags";
import { AgentRunStatus } from "./run-status";

type Props = {
  workspaceSlug: string;
  comment: TIssueComment;
};
export const AgentCommentHeader = observer(function AgentCommentHeader(props: Props) {
  const { comment, workspaceSlug } = props;
  //store hooks
  const { activeRunId, getRunStatusById, initRun } = useAgent();
  const { activeSidecar, openAgentSidecar, closeSidecar } = useTheme();
  const { getUserDetails } = useMember();
  // derived values
  const agentUser = comment?.agent_run?.agent_user ?? "";
  const agentRunStatus = getRunStatusById(comment?.agent_run?.id ?? "") ?? comment?.agent_run?.status;
  const userDetails = agentUser && getUserDetails(agentUser)?.display_name;
  const isAgentSidecarOpen = activeSidecar && activeSidecar === "agent";
  if (!comment.agent_run) return null;
  return (
    <WithFeatureFlagHOC workspaceSlug={workspaceSlug} flag={E_FEATURE_FLAGS.AGENT_SIDECAR} fallback={<></>}>
      <div className="flex justify-between items-center gap-2 mb-2">
        <div className="flex items-center">
          <div className="text-body-xs-regular text-tertiary">
            Connected with <span className="font-medium text-primary">{userDetails}</span>
          </div>
          <Dot className="text-icon-disabled" />
          {agentRunStatus && <AgentRunStatus status={agentRunStatus} />}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="bg-layer-3"
          onClick={() => {
            if (isAgentSidecarOpen && activeRunId === comment.agent_run?.id) {
              closeSidecar();
            } else {
              if (comment.agent_run && activeRunId !== comment.agent_run?.id) {
                initRun({
                  issue: comment.issue,
                  comment: comment.id,
                  id: comment.agent_run.id,
                  agent_user: agentUser,
                  status: agentRunStatus || EAgentRunStatus.CREATED,
                });
              }
              openAgentSidecar(comment.agent_run?.id ?? "");
            }
          }}
        >
          <PanelRight width={14} height={14} className="text-secondary" aria-hidden="true" />
          <span>{isAgentSidecarOpen && activeRunId === comment.agent_run?.id ? "Close sidecar" : "Open sidecar"}</span>
        </Button>
      </div>
    </WithFeatureFlagHOC>
  );
});
