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
import { InfoIcon } from "@plane/propel/icons";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import { useUserPermissions } from "@/hooks/store/user";
import { revalidateProjectData } from "@/helpers/swr";
import { usePiChat } from "@/plane-web/hooks/store/use-pi-chat";
import type { TDialogue } from "@/types";
import { EExecutionStatus } from "@/types";
import { ConfirmBlock } from "./confirm-block";
import { SummaryBlock } from "./summary";

type TProps = {
  isLatest: boolean | undefined;
  isPiThinking: boolean | undefined;
  workspaceId: string | undefined;
  workspaceSlug: string | undefined;
  query_id: string | undefined;
  activeChatId: string;
  isPiTyping: boolean;
  dialogue: TDialogue;
};

function ActionStatusBlock(props: TProps) {
  // props

  const { isLatest, isPiThinking, workspaceSlug, workspaceId, query_id, activeChatId, isPiTyping, dialogue } = props;
  const { execution_status, action_summary, actions, action_error } = dialogue;
  // states
  const [isExecutingAction, setIsExecutingAction] = useState(false);
  // store
  const { getProjectRoleByWorkspaceSlugAndProjectId } = useUserPermissions();
  const { getChatFocus, executeAction } = usePiChat();
  const chatFocus = getChatFocus(activeChatId);
  //derived
  const shouldShowConfirmBlock =
    isLatest &&
    (execution_status === EExecutionStatus.PENDING ||
      ((action_error || action_summary?.is_editable) && !action_summary?.is_executed));
  const shouldShowSummaryBlock = execution_status === EExecutionStatus.EXECUTING || action_summary?.is_executed;
  // handlers
  const handleExecuteAction = async (workspaceId: string, query_id: string) => {
    try {
      setIsExecutingAction(true);
      const actionableEntities = await executeAction(workspaceId, activeChatId, query_id);
      if (actionableEntities && actionableEntities.length > 0 && workspaceSlug) {
        const projectId = chatFocus?.entityType === "project_id" ? chatFocus?.entityIdentifier : undefined;
        const currentProjectRole = projectId
          ? getProjectRoleByWorkspaceSlugAndProjectId(workspaceSlug, projectId)
          : undefined;
        revalidateProjectData(workspaceSlug, actionableEntities, projectId, currentProjectRole);
      }
    } catch (e: any) {
      console.error(e);
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Action failed!",
        message: e?.error ?? e?.detail ?? e?.message ?? "Unable to execute action.",
      });
    } finally {
      setIsExecutingAction(false);
    }
  };

  if (!query_id || (isLatest && (isPiThinking || isPiTyping))) return null;
  if (shouldShowConfirmBlock) {
    return (
      <ConfirmBlock
        title={action_error ? "Action failed" : "Awaiting response"}
        summary={action_error ? action_error : "Please confirm the actions you want to execute"}
        isExecutingAction={isExecutingAction}
        handleExecuteAction={handleExecuteAction}
        workspaceId={workspaceId}
        query_id={query_id}
      />
    );
  }
  if (shouldShowSummaryBlock)
    return (
      <SummaryBlock
        summary={dialogue.action_summary}
        chatId={activeChatId}
        status={execution_status}
        query_id={query_id}
      />
    );
  if (!actions || !action_summary) return null;
  return (
    <div className="flex gap-2 text-placeholder text-body-sm-regular">
      <InfoIcon height={16} width={16} className="my-auto text-icon-tertiary" />
      <div>
        {" "}
        {action_summary?.total_planned - (action_summary?.completed + action_summary?.failed)} action(s) not
        executed{" "}
      </div>
    </div>
  );
}

export default ActionStatusBlock;
