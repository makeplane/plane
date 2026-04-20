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
import { observer } from "mobx-react";
import { MessageCircle } from "lucide-react";
// plane imports
import { AtRiskIcon, OffTrackIcon, OnTrackIcon } from "@plane/propel/icons";
import { EUpdateStatus } from "@plane/types";
import { cn, renderFormattedDate } from "@plane/utils";
// hooks
import { useMember } from "@/hooks/store/use-member";
import { useUser } from "@/hooks/store/user";
// plane web components
import Progress from "@/components/updates/progress";
import { UpdateStatusIcons } from "@/components/updates/status-icons";
import { useProjectUpdates } from "@/plane-web/hooks/store/projects/use-project-updates";
import type { TProjectUpdate } from "@/types";
// components
import { CommentList } from "./comments/comment-list";
import { NewUpdate } from "./new-update";
import { Properties } from "./properties";
import { UpdateQuickActions } from "./quick-actions";
import { UpdateReaction } from "./update-reaction";

const conf = {
  [EUpdateStatus.ON_TRACK]: {
    icon: OnTrackIcon,
    color: "#1FAD40",
  },

  [EUpdateStatus.AT_RISK]: {
    icon: AtRiskIcon,
    color: "#CC7700",
  },
  [EUpdateStatus.OFF_TRACK]: {
    icon: OffTrackIcon,
    color: "#CC0000",
  },
};

type TProps = {
  updateId: string;
  workspaceSlug: string;
  projectId: string;
  handleUpdateOperations: {
    update: (updateId: string, data: Partial<TProjectUpdate>) => void;
    remove: (updateId: string) => Promise<void>;
  };
  permissions: {
    updates: {
      canReact: boolean;
      canEdit: boolean;
      canDelete: boolean;
    };
    comments: {
      canCreate: boolean;
      canUpdate: (commentId: string) => boolean;
      canDelete: (commentId: string) => boolean;
      canReact: (commentId: string) => boolean;
    };
  };
};
export const UpdateBlock = observer(function UpdateBlock(props: TProps) {
  const { updateId, workspaceSlug, projectId, handleUpdateOperations, permissions } = props;
  // state
  const [isEditing, setIsEditing] = useState(false);
  const [showComment, setShowComment] = useState(false);

  // hooks
  const { getUserDetails } = useMember();
  const { data: currentUser } = useUser();
  const { getUpdateById } = useProjectUpdates();

  const updateData = getUpdateById(updateId);

  if (!updateData) return null;

  return isEditing ? (
    <NewUpdate
      initialValues={updateData}
      handleClose={() => setIsEditing(false)}
      handleCreate={(data) => {
        handleUpdateOperations.update(updateData.id, data);
        setIsEditing(false);
      }}
    />
  ) : (
    updateData && (
      <div
        key={updateData.id}
        className="relative flex updateDatas-center gap-2 border border-subtle rounded-md p-4 pb-0"
      >
        <div className="flex-1 w-full">
          <div className="flex flex-1">
            <div className={cn(`mr-2`, {})}>
              {/* render icon here */}
              <UpdateStatusIcons statusType={updateData.status} size="md" />
            </div>
            {/* Type and creator */}
            <div className="flex-1">
              <div className={cn(`text-[${conf[updateData.status].color}] font-semibold text-13 capitalize`)}>
                {updateData.status?.toLowerCase().replaceAll("-", " ")}
              </div>
              <div className="text-tertiary font-regular text-11">
                {renderFormattedDate(updateData.updated_at)} • {getUserDetails(updateData?.created_by)?.display_name}
              </div>
            </div>
            {/* quick actions */}
            <UpdateQuickActions
              updateId={updateData.id}
              permissions={{
                canDelete: permissions.updates.canDelete,
                canEdit: permissions.updates.canEdit,
              }}
              operations={{
                remove: handleUpdateOperations.remove,
                update: () => {
                  setIsEditing(true);
                },
              }}
            />
          </div>

          {/* Update */}
          <div className="text-14 my-3 break-words w-full whitespace-pre-wrap">{updateData.description}</div>

          {/* Progress */}
          <Progress completedIssues={updateData.completed_issues} totalIssues={updateData.total_issues} />

          {/* Actions */}
          <div className="flex gap-2 mb-3 justify-between mt-4 ">
            <div className="flex gap-2 flex-wrap">
              <UpdateReaction
                workspaceSlug={workspaceSlug}
                projectId={projectId}
                commentId={updateData.id}
                currentUser={currentUser}
                permissions={permissions.updates}
              />
              <button
                className="text-tertiary bg-layer-1 rounded-sm h-7 flex px-2 gap-2 text-11 font-medium items-center"
                onClick={() => setShowComment(!showComment)}
                disabled={!permissions.comments.canCreate}
              >
                <MessageCircle className="h-3.5 w-3.5 m-auto" />
                {updateData.comments_count > 0 && (
                  <span>
                    {updateData.comments_count} {updateData.comments_count === 1 ? "Comment" : "Comments"}
                  </span>
                )}
              </button>
            </div>
          </div>
          <Properties isCollapsed />
          <CommentList
            isCollapsed={!showComment}
            updateId={updateData.id}
            workspaceSlug={workspaceSlug}
            projectId={projectId}
            permissions={permissions.comments}
          />
        </div>
      </div>
    )
  );
});
