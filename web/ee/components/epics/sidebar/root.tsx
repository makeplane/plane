"use client";

import React, { FC, useMemo } from "react";
import { observer } from "mobx-react";
import { Activity } from "lucide-react";
import { EIssueServiceType } from "@plane/constants";
import { EFileAssetType } from "@plane/types/src/enums";
import { CommentFillIcon, InfoFillIcon, setToast, TOAST_TYPE, Tabs } from "@plane/ui";
import { ActivitySortRoot, TActivityOperations, TIssueOperations } from "@/components/issues";
import { cn } from "@/helpers/common.helper";
// hooks
import { useAppTheme, useIssueDetail } from "@/hooks/store";
import { FileService } from "@/services/file.service";
// local components
import { EpicSidebarActivityRoot } from "./activity";
import { EpicSidebarCommentsRoot } from "./comments/root";
import { EpicSidebarPropertiesRoot } from "./properties";
import { SidebarTabContent } from "./sidebar-tab-content";

const fileService = new FileService();

type TEpicDetailsSidebarProps = {
  workspaceSlug: string;
  projectId: string;
  epicId: string;
  issueOperations: TIssueOperations;
  isEditable: boolean;
};

export const EpicDetailsSidebar: FC<TEpicDetailsSidebarProps> = observer((props) => {
  const { workspaceSlug, projectId, epicId, issueOperations, isEditable } = props;
  // store hooks
  const { epicDetailSidebarCollapsed } = useAppTheme();

  const {
    createComment,
    updateComment,
    removeComment,
    activity: { sortOrder, toggleSortOrder },
  } = useIssueDetail(EIssueServiceType.EPICS);

  const activityOperations: TActivityOperations = useMemo(
    () => ({
      createComment: async (data) => {
        try {
          if (!workspaceSlug || !projectId || !epicId) throw new Error("Missing fields");
          const comment = await createComment(workspaceSlug, projectId, epicId, data);
          setToast({
            title: "Success!",
            type: TOAST_TYPE.SUCCESS,
            message: "Comment created successfully.",
          });
          return comment;
        } catch (error) {
          console.log("Error in creating comment:", error);
          setToast({
            title: "Error!",
            type: TOAST_TYPE.ERROR,
            message: "Comment creation failed. Please try again later.",
          });
        }
      },
      updateComment: async (commentId, data) => {
        try {
          if (!workspaceSlug || !projectId || !epicId) throw new Error("Missing fields");
          await updateComment(workspaceSlug, projectId, epicId, commentId, data);
          setToast({
            title: "Success!",
            type: TOAST_TYPE.SUCCESS,
            message: "Comment updated successfully.",
          });
        } catch (error) {
          console.log("Error in updating comment:", error);
          setToast({
            title: "Error!",
            type: TOAST_TYPE.ERROR,
            message: "Comment update failed. Please try again later.",
          });
        }
      },
      removeComment: async (commentId) => {
        try {
          if (!workspaceSlug || !projectId || !epicId) throw new Error("Missing fields");
          await removeComment(workspaceSlug, projectId, epicId, commentId);
          setToast({
            title: "Success!",
            type: TOAST_TYPE.SUCCESS,
            message: "Comment removed successfully.",
          });
        } catch (error) {
          console.log("Error in removing comment:", error);
          setToast({
            title: "Error!",
            type: TOAST_TYPE.ERROR,
            message: "Comment remove failed. Please try again later.",
          });
        }
      },
      uploadCommentAsset: async (file, commentId) => {
        try {
          if (!workspaceSlug || !projectId) throw new Error("Missing fields");
          const res = await fileService.uploadProjectAsset(
            workspaceSlug,
            projectId,
            {
              entity_identifier: commentId ?? "",
              entity_type: EFileAssetType.COMMENT_DESCRIPTION,
            },
            file
          );
          return res;
        } catch (error) {
          console.log("Error in uploading comment asset:", error);
          throw new Error("Asset upload failed. Please try again later.");
        }
      },
    }),
    [workspaceSlug, projectId, epicId, createComment, updateComment, removeComment]
  );

  const EPIC_DETAILS_SIDEBAR_TABS = [
    {
      key: "properties",

      icon: InfoFillIcon,
      content: (
        <SidebarTabContent title="Properties">
          <EpicSidebarPropertiesRoot
            workspaceSlug={workspaceSlug}
            projectId={projectId}
            epicId={epicId}
            issueOperations={issueOperations}
            disabled={!isEditable}
          />
        </SidebarTabContent>
      ),
    },
    {
      key: "comments",
      icon: CommentFillIcon,
      content: (
        <SidebarTabContent title="Comments">
          <EpicSidebarCommentsRoot
            workspaceSlug={workspaceSlug}
            projectId={projectId}
            epicId={epicId}
            activityOperations={activityOperations}
            disabled={!isEditable}
          />
        </SidebarTabContent>
      ),
    },
    {
      key: "activity",
      icon: Activity,
      content: (
        <SidebarTabContent
          title="Activity"
          actionElement={
            <span className="size-5">
              <ActivitySortRoot sortOrder={sortOrder} toggleSort={toggleSortOrder} className="size-3.5" />
            </span>
          }
        >
          <EpicSidebarActivityRoot
            workspaceSlug={workspaceSlug}
            projectId={projectId}
            issueId={epicId}
            activityOperations={activityOperations}
            disabled={!isEditable}
          />
        </SidebarTabContent>
      ),
    },
  ];

  return (
    <div
      className={cn(
        `absolute right-0 z-[5] flex flex-col gap-4 p-6 h-full border-l border-custom-border-200 bg-custom-sidebar-background-100 py-5 sm:relative transition-[width] ease-linear overflow-hidden overflow-y-auto`,
        {
          "w-0 hidden": epicDetailSidebarCollapsed,
          "min-w-[300px] w-full sm:w-1/2  md:w-1/3 lg:min-w-80 xl:min-w-96": !epicDetailSidebarCollapsed,
        }
      )}
      style={epicDetailSidebarCollapsed ? { right: `-${window?.innerWidth || 0}px` } : {}}
    >
      <Tabs
        tabs={EPIC_DETAILS_SIDEBAR_TABS}
        storageKey={`epic-detail-sidebar-${epicId}`}
        defaultTab="properties"
        containerClassName="gap-4"
      />
    </div>
  );
});
