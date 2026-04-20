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
import { Avatar } from "@plane/propel/avatar";
import { renderFormattedDate } from "@plane/utils";
import { useMember } from "@/hooks/store/use-member";
import { useUser } from "@/hooks/store/user";
import type { TProjectUpdatesComment } from "@/types";
import { UpdateQuickActions } from "../quick-actions";
import { UpdateReaction } from "../update-reaction";
import type { TActivityOperations } from "./comment-list";
import { EditComment } from "./edit";

type TProps = {
  commentData: TProjectUpdatesComment;
  workspaceSlug: string;
  projectId: string;
  operations: TActivityOperations;
  permissions: {
    canReact: boolean;
    canEdit: boolean;
    canDelete: boolean;
  };
};
export function CommentBlock(props: TProps) {
  const { commentData, workspaceSlug, projectId, operations, permissions } = props;
  const [isEditing, setIsEditing] = useState(false);
  // hooks
  const { getUserDetails } = useMember();
  const { data: currentUser } = useUser();

  const creator = commentData && getUserDetails(commentData?.created_by || "");

  return (
    <div className="flex mb-4 gap-2">
      <Avatar size="md" name={creator?.display_name} />
      {isEditing ? (
        <EditComment setIsEditing={setIsEditing} operations={operations} commentData={commentData} />
      ) : (
        <div className="flex-1">
          <div className="flex w-full">
            <div className="flex-1">
              <div className="text-13">{creator?.display_name}</div>
              <div className="text-11 text-tertiary">{renderFormattedDate(commentData?.updated_at)}</div>
            </div>
            {/* quick actions */}
            <UpdateQuickActions
              updateId={commentData.id}
              operations={{
                remove: operations.remove,
                update: () => {
                  setIsEditing(true);
                },
              }}
              permissions={{
                canDelete: permissions.canDelete,
                canEdit: permissions.canEdit,
              }}
            />
          </div>
          <div className="text-14 mb-2">{commentData?.description}</div>
          <UpdateReaction
            workspaceSlug={workspaceSlug}
            projectId={projectId}
            commentId={commentData.id}
            currentUser={currentUser}
            permissions={permissions}
          />
        </div>
      )}
    </div>
  );
}
