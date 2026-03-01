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
import { useParams } from "next/navigation";
import { Loader as Spinner } from "lucide-react";
// components
import { CommentsWrapper } from "@/components/comments";
import { ActivitySortRoot } from "@/components/issues/issue-detail/issue-activity";
// plane web imports
import { useTeamspaceUpdates } from "@/plane-web/hooks/store/teamspaces/use-teamspace-updates";
import { useCommentOperations } from "./helper";

type TTeamSidebarCommentsRootProps = {
  teamspaceId: string;
  isEditingAllowed?: boolean;
};

export const TeamsOverviewSidebarComments = observer(function TeamsOverviewSidebarComments(
  props: TTeamSidebarCommentsRootProps
) {
  const { teamspaceId, isEditingAllowed = true } = props;
  // router
  const { workspaceSlug: routerWorkspaceSlug } = useParams();
  const workspaceSlug = routerWorkspaceSlug?.toString();
  // hooks
  const {
    getTeamspaceCommentsLoader,
    getTeamspaceComments,
    getTeamspaceCommentsSortOrder,
    toggleTeamspaceCommentsSortOrder,
  } = useTeamspaceUpdates();
  // derived values
  const teamspaceCommentsLoader = getTeamspaceCommentsLoader(teamspaceId);
  const teamspaceComments = getTeamspaceComments(teamspaceId);
  const teamspaceCommentsSortOrder = getTeamspaceCommentsSortOrder();

  const activityOperations = useCommentOperations(workspaceSlug, teamspaceId);

  return (
    <div className="relative flex flex-col gap-y-2 h-full overflow-hidden">
      <div className=" flex flex-col gap-4">
        <div className="flex gap-2 items-center justify-between">
          <span className="text-body-xs-semibold">Comments</span>
          <span className="flex items-center gap-2">
            {teamspaceCommentsLoader && ["init-loader", "mutation"].includes(teamspaceCommentsLoader) ? (
              <Spinner size={12} className="animate-spin" />
            ) : null}
            <ActivitySortRoot
              sortOrder={teamspaceCommentsSortOrder}
              toggleSort={() => {
                toggleTeamspaceCommentsSortOrder();
              }}
            />
          </span>
        </div>
      </div>
      {teamspaceComments && (
        <CommentsWrapper
          entityId={teamspaceId}
          activityOperations={activityOperations}
          comments={teamspaceComments}
          isEditingAllowed={isEditingAllowed}
          sortOrder={teamspaceCommentsSortOrder}
          showCopyLinkOption={false}
        />
      )}
    </div>
  );
});
