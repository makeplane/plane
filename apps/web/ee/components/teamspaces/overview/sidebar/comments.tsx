"use client";

import React, { FC } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Loader as Spinner } from "lucide-react";
// components
import { TEAMSPACE_UPDATES_TRACKER_ELEMENTS } from "@plane/constants";
import { CommentsWrapper } from "@/components/comments";
import { ActivitySortRoot } from "@/components/issues";
// plane web imports
import { captureClick } from "@/helpers/event-tracker.helper";
import { useTeamspaceUpdates } from "@/plane-web/hooks/store/teamspaces/use-teamspace-updates";
import { useCommentOperations } from "./helper";

type TTeamSidebarCommentsRootProps = {
  teamspaceId: string;
  isEditingAllowed?: boolean;
};

export const TeamsOverviewSidebarComments: FC<TTeamSidebarCommentsRootProps> = observer((props) => {
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
    <div className="relative flex flex-col gap-y-2 h-full overflow-hidden px-6">
      <div className="py-2 flex flex-col gap-4">
        <div className="flex gap-2 items-center justify-between">
          <span className="text-sm font-semibold">Comments</span>
          <span className="flex items-center gap-2">
            {teamspaceCommentsLoader && ["init-loader", "mutation"].includes(teamspaceCommentsLoader) ? (
              <Spinner size={12} className="animate-spin" />
            ) : null}
            <ActivitySortRoot
              sortOrder={teamspaceCommentsSortOrder}
              toggleSort={() => {
                captureClick({
                  elementName: TEAMSPACE_UPDATES_TRACKER_ELEMENTS.SIDEBAR_COMMENTS_SORT_BUTTON,
                });
                toggleTeamspaceCommentsSortOrder();
              }}
              className="py-1"
              iconClassName="size-3"
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
