import { useState } from "react";
import { observer } from "mobx-react";
import { MessageCircle } from "lucide-react";
// plane imports
import { EUserPermissionsLevel } from "@plane/constants";
import { EUpdateStatus, EUserProjectRoles } from "@plane/types";
import { AtRiskIcon, OffTrackIcon, OnTrackIcon } from "@plane/ui";
import { cn, renderFormattedDate } from "@plane/utils";
// hooks
import { useMember } from "@/hooks/store/use-member";
import { useUser, useUserPermissions } from "@/hooks/store/user";
// plane web components
import Progress from "@/plane-web/components/updates/progress";
import { UpdateStatusIcons } from "@/plane-web/components/updates/status-icons";
import { useProjectUpdates } from "@/plane-web/hooks/store/projects/use-project-updates";
import { TProjectUpdate } from "@/plane-web/types";
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
};
export const UpdateBlock = observer((props: TProps) => {
  const { updateId, workspaceSlug, projectId, handleUpdateOperations } = props;
  // state
  const [isEditing, setIsEditing] = useState(false);
  const [showComment, setShowComment] = useState(false);
  const [showProperties, setShowProperties] = useState(false);

  // hooks
  const { getUserDetails } = useMember();
  const { data: currentUser } = useUser();
  const { getUpdateById } = useProjectUpdates();
  const { allowPermissions } = useUserPermissions();

  const updateData = getUpdateById(updateId);

  if (!updateData) return null;

  const icon = conf[updateData?.status].icon;

  const isProjectAdmin = allowPermissions(
    [EUserProjectRoles.ADMIN],
    EUserPermissionsLevel.PROJECT,
    workspaceSlug.toString(),
    projectId.toString()
  );

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
        className="relative flex updateDatas-center gap-2 border border-custom-border-100 rounded-md p-4 pb-0"
      >
        <div className="flex-1 w-full">
          <div className="flex flex-1">
            <div className={cn(`mr-2`, {})}>
              {/* render icon here */}
              <UpdateStatusIcons statusType={updateData.status as EUpdateStatus} size="md" />
            </div>
            {/* Type and creator */}
            <div className="flex-1">
              <div className={cn(`text-[${conf[updateData.status].color}] font-semibold text-sm capitalize`)}>
                {updateData.status?.toLowerCase().replaceAll("-", " ")}
              </div>
              <div className="text-custom-text-350 font-regular text-xs">
                {renderFormattedDate(updateData.updated_at)} • {getUserDetails(updateData?.created_by)?.display_name}
              </div>
            </div>
            {/* quick actions */}
            {isProjectAdmin && (
              <UpdateQuickActions
                updateId={updateData.id}
                operations={{
                  remove: handleUpdateOperations.remove,
                  update: () => {
                    setIsEditing(true);
                  },
                }}
              />
            )}
          </div>

          {/* Update */}
          <div className="text-base my-3 break-words w-full whitespace-pre-wrap">{updateData.description}</div>

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
              />
              <button
                className="text-custom-text-350 bg-custom-background-80 rounded h-7 flex px-2 gap-2 text-xs font-medium items-center"
                onClick={() => setShowComment(!showComment)}
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
          <Properties isCollapsed={!showProperties} />
          <CommentList
            isCollapsed={!showComment}
            updateId={updateData.id}
            workspaceSlug={workspaceSlug}
            projectId={projectId}
          />
        </div>
      </div>
    )
  );
});
