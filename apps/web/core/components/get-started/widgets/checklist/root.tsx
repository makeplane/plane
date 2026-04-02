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

import type { FC } from "react";
import { useCallback, useMemo } from "react";
import { observer } from "mobx-react";
import { useParams, useRouter } from "next/navigation";
import { EUserWorkspaceRoles } from "@plane/types";
import type { TGettingStartedChecklistKeys } from "@plane/types";
import { useCommandPalette } from "@/hooks/store/use-command-palette";
import { useMember } from "@/hooks/store/use-member";
import { useProject } from "@/hooks/store/use-project";
import { useUserPermissions } from "@/hooks/store/user";
import { useFlag } from "@/plane-web/hooks/store";
import { ADMIN_USER_CHECKLIST, MEMBER_USER_CHECKLIST } from "../constant";
import { WidgetWrapper } from "../widget-wrapper";
import { ChecklistItem } from "./checklist-item";
import { useAiFlag } from "@/plane-web/hooks/store/use-ai-flag";

export const GetStartedSection: FC = observer(function GetStartedSection() {
  const router = useRouter();
  const { workspaceSlug } = useParams<{ workspaceSlug: string }>();

  const { toggleCreateProjectModal, toggleCreateIssueModal } = useCommandPalette();
  const { joinedProjectIds } = useProject();
  const { getWorkspaceRoleByWorkspaceSlug } = useUserPermissions();
  const {
    workspace: { getGettingStartedChecklistByWorkspaceSlug },
  } = useMember();

  const currentWorkspaceRole = getWorkspaceRoleByWorkspaceSlug(workspaceSlug);
  const checklistData = getGettingStartedChecklistByWorkspaceSlug(workspaceSlug);

  // Feature flag and workspace feature checks for AI chat
  const isAiChatAiFlag = useAiFlag(workspaceSlug, "AI_CHAT");
  const isAiChatFlag = useFlag(workspaceSlug, "AI_CHAT");
  const isPiChatFlagEnabled = isAiChatAiFlag && isAiChatFlag;
  const isAiChatAvailable = isPiChatFlagEnabled;

  const handleItemClick = useCallback(
    (itemId: TGettingStartedChecklistKeys) => {
      switch (itemId) {
        case "project_created":
          toggleCreateProjectModal(true);
          break;
        case "work_item_created":
          toggleCreateIssueModal(true);
          break;
        case "project_joined":
          router.push(`/${workspaceSlug}/projects/`);
          break;
        case "view_created":
          // Navigate to first joined project's views, or projects list if none
          if (joinedProjectIds.length > 0) {
            router.push(`/${workspaceSlug}/projects/${joinedProjectIds[0]}/views/`);
          } else {
            router.push(`/${workspaceSlug}/projects/`);
          }
          break;
        case "sticky_created":
          router.push(`/${workspaceSlug}/stickies/`);
          break;
        case "page_created":
          // Navigate to first joined project's pages, or projects list if none
          if (joinedProjectIds.length > 0) {
            router.push(`/${workspaceSlug}/projects/${joinedProjectIds[0]}/pages/`);
          } else {
            router.push(`/${workspaceSlug}/projects/`);
          }
          break;
        case "team_members_invited":
          router.push(`/${workspaceSlug}/settings/members/`);
          break;
        case "ai_chat_tried":
          router.push(`/${workspaceSlug}/ai-chat`);
          break;
        case "integration_linked":
          router.push(`/${workspaceSlug}/settings/integrations/`);
          break;
      }
    },
    [workspaceSlug, toggleCreateProjectModal, toggleCreateIssueModal, router, joinedProjectIds]
  );

  const checklist = useMemo(() => {
    const baseChecklist =
      currentWorkspaceRole === EUserWorkspaceRoles.ADMIN ? ADMIN_USER_CHECKLIST : MEMBER_USER_CHECKLIST;

    return baseChecklist.filter((item) => {
      if (item.id === "ai_chat_tried" && !isAiChatAvailable) return false;
      return true;
    });
  }, [currentWorkspaceRole, isAiChatAvailable]);

  return (
    <WidgetWrapper title="Get started" subtitle="Begin your setup and see your ideas come to life faster.">
      <div
        className="flex flex-col rounded-xl bg-layer-2 border border-subtle w-full shadow-raised-100"
        role="list"
        aria-label="Getting started checklist"
      >
        {checklist.map((item) => {
          const isChecked = checklistData?.[item.id] ?? false;
          return (
            <ChecklistItem key={item.id} item={item} isChecked={isChecked} onClick={() => handleItemClick(item.id)} />
          );
        })}
      </div>
    </WidgetWrapper>
  );
});
