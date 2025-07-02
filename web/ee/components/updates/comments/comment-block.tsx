import { useState } from "react";
import { observer } from "mobx-react";
import { EUpdateEntityType, TUpdateOperations } from "@plane/types";
import { Avatar } from "@plane/ui";
import { renderFormattedDate } from "@plane/utils";
import { useMember, useUser } from "@/hooks/store";
import { useUpdateDetail } from "@/plane-web/hooks/use-update-detail";
import { TProjectUpdatesComment } from "@/plane-web/types";
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
};
export const CommentBlock = observer((props: TProps) => {
  const { updateId, commentData, workspaceSlug, entityId, operations, entityType } = props;
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
              <div className="text-sm">{creator?.display_name}</div>
              <div className="text-xs text-custom-text-350">{renderFormattedDate(commentData?.updated_at)}</div>
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
              />
            )}
          </div>
          <div className="text-base mb-2">{commentData?.description}</div>
          <UpdateReaction
            workspaceSlug={workspaceSlug}
            entityId={entityId}
            commentId={commentData.id}
            currentUser={currentUser}
            handleUpdateOperations={operations}
            entityType={entityType}
          />
        </div>
      )}
    </div>
  );
});
