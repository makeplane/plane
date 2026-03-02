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
import { Avatar } from "@plane/propel/avatar";
import type { EUpdateEntityType, TUpdateOperations } from "@plane/types";
import { renderFormattedDate } from "@plane/utils";
import { useMember } from "@/hooks/store/use-member";
import { useUser } from "@/hooks/store/user";
import { useUpdateDetail } from "@/plane-web/hooks/use-update-detail";
import type { TProjectUpdatesComment } from "@/types";
import { UpdateQuickActions } from "../quick-actions";
import { UpdateReaction } from "../update-reaction";
import { EditComment } from "./edit";

type TProps = {
  updateId: string;
  commentData: TProjectUpdatesComment;
  workspaceSlug: string;
  entityId: string;
  operations: TUpdateOperations;
  entityType: EUpdateEntityType;
  disabled?: boolean;
};
export const CommentBlock = observer(function CommentBlock(props: TProps) {
  const { updateId, commentData, workspaceSlug, entityId, operations, entityType, disabled = false } = props;
  const [isEditing, setIsEditing] = useState(false);
  // hooks
  const { getUserDetails } = useMember();
  const { data: currentUser } = useUser();
  const { setDeleteModalId, deleteModalId } = useUpdateDetail(entityType);

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
            {currentUser?.id === creator?.id && (
              <UpdateQuickActions
                updateId={commentData.id}
                operations={{
                  remove: async () => await operations.removeComment(updateId, commentData.id),
                  update: () => {
                    setIsEditing(true);
                  },
                }}
                setDeleteModalId={setDeleteModalId}
                deleteModalId={deleteModalId}
                allowEdit={!disabled}
                allowDelete={!disabled}
              />
            )}
          </div>
          <div className="text-14 mb-2">{commentData?.description}</div>
          <UpdateReaction
            workspaceSlug={workspaceSlug}
            entityId={entityId}
            commentId={commentData.id}
            currentUser={currentUser}
            handleUpdateOperations={operations}
            entityType={entityType}
            disabled={disabled}
          />
        </div>
      )}
    </div>
  );
});
