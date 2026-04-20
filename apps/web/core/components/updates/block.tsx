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

import React, { useState } from "react";
import { observer } from "mobx-react";
import { MessageCircle } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import type { EUpdateEntityType, TUpdate, TUpdateOperations } from "@plane/types";
import { cn, renderFormattedDate } from "@plane/utils";
// hooks
import { useMember } from "@/hooks/store/use-member";
import { useUser } from "@/hooks/store/user";
import { useUpdateDetail } from "@/plane-web/hooks/use-update-detail";
// components
import { CommentList } from "./comments/comment-list";
import { NewUpdate } from "./new-update";
import Progress from "./progress";
import { UpdateQuickActions } from "./quick-actions";
import { StatusOptions, UpdateStatusIcons } from "./status-icons";
import { UpdateReaction } from "./update-reaction";

type TProps = {
  updateId: string;
  workspaceSlug: string;
  entityId: string;
  handleUpdateOperations: TUpdateOperations;
  entityType: EUpdateEntityType;
  customTitle?: (updateData: TUpdate) => React.ReactNode;
  permissions: {
    canEdit: boolean;
    canDelete: boolean;
    canReact: boolean;
    comment: {
      canCreate: boolean;
      canUpdate: (commentId: string) => boolean;
      canDelete: (commentId: string) => boolean;
      canReact: (commentId: string) => boolean;
    };
  };
};

export const UpdateBlock = observer(function UpdateBlock(props: TProps) {
  const { updateId, workspaceSlug, entityId, handleUpdateOperations, entityType, customTitle, permissions } = props;
  // state
  const [isEditing, setIsEditing] = useState(false);
  const [showComment, setShowComment] = useState(false);
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { getUserDetails } = useMember();
  const { data: currentUser } = useUser();
  const { getUpdateById, deleteModalId, setDeleteModalId } = useUpdateDetail(entityType);
  // derived values
  const updateData = getUpdateById(updateId);

  if (!updateData) return null;

  if (isEditing) {
    return (
      <NewUpdate
        initialValues={updateData}
        handleClose={() => setIsEditing(false)}
        handleCreate={async (data) => {
          try {
            await handleUpdateOperations.patchUpdate(updateData.id, data);
            setIsEditing(false);
            setToast({
              message: t("updates.update.success.message"),
              type: TOAST_TYPE.SUCCESS,
              title: t("updates.update.success.title"),
            });
          } catch (error) {
            console.error("error", error);
            setToast({
              message: t("updates.update.error.message"),
              type: TOAST_TYPE.ERROR,
              title: t("updates.update.error.title"),
            });
          }
        }}
      />
    );
  }

  return (
    <div key={updateData.id} className="relative flex items-center gap-2 border border-subtle rounded-md p-4 pb-0">
      <div className="flex-1 w-full min-w-0">
        <div className="flex flex-1 items-center">
          <div className={cn(`mr-2`, {})}>
            {/* render icon here */}
            <UpdateStatusIcons statusType={updateData.status} size="md" />
          </div>
          {/* Type and creator */}
          <div className="flex-1">
            {customTitle?.(updateData) || (
              <div className={cn(`text-[${StatusOptions[updateData.status].color}] font-semibold text-13 capitalize`)}>
                {updateData.status?.toLowerCase().replaceAll("-", " ")}
              </div>
            )}
            <div className="text-tertiary font-regular text-11">
              {renderFormattedDate(updateData.updated_at)} • {getUserDetails(updateData?.created_by)?.display_name}
            </div>
            <div className="text-tertiary font-regular text-11">
              {renderFormattedDate(updateData.updated_at)} • {getUserDetails(updateData?.created_by)?.display_name}
            </div>
          </div>
          {/* quick actions */}
          <UpdateQuickActions
            updateId={updateData.id}
            operations={{
              remove: async () => await handleUpdateOperations.removeUpdate(updateData.id),
              update: () => {
                setIsEditing(true);
              },
            }}
            setDeleteModalId={setDeleteModalId}
            deleteModalId={deleteModalId}
            allowEdit={permissions.canEdit}
            allowDelete={permissions.canDelete}
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
              entityId={entityId}
              commentId={updateData.id}
              currentUser={currentUser}
              entityType={entityType}
              handleUpdateOperations={handleUpdateOperations}
              permissions={{ canReact: permissions.canReact }}
            />
            <button
              className="text-tertiary bg-layer-1 rounded-sm h-7 flex px-2 gap-2 text-11 font-medium items-center"
              onClick={() => setShowComment(!showComment)}
              disabled={!permissions.comment.canCreate}
            >
              <MessageCircle className="h-3.5 w-3.5 m-auto" />
              {updateData.comments_count > 0 && (
                <span>{t("updates.progress.comments", { count: updateData.comments_count })}</span>
              )}
            </button>
          </div>
        </div>

        {showComment && (
          <CommentList
            isCollapsed={!showComment}
            updateId={updateData.id}
            workspaceSlug={workspaceSlug}
            entityId={entityId}
            entityType={entityType}
            handleUpdateOperations={handleUpdateOperations}
            permissions={permissions.comment}
          />
        )}
      </div>
    </div>
  );
});
