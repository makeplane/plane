/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { KeyboardEvent } from "react";
import { useState } from "react";
import { observer } from "mobx-react";
import { Pencil, Timer } from "lucide-react";
import { EUserPermissions, EUserPermissionsLevel, formatMinutesToDisplay } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { TIssueActivityComment } from "@plane/types";
import { CustomMenu } from "@plane/ui";
import { cn } from "@plane/utils";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useUserPermissions } from "@/hooks/store/user/user-permissions";
import { useWorklog } from "@/hooks/store/use-worklog";
import { extractApiError } from "../utils/extract-api-error";
import { isWithinEditWindow } from "../utils/worklog-date-utils";
import { WorklogDeleteModal } from "../worklog-delete-modal";
import { WorklogModal } from "../worklog-modal";

type TIssueActivityWorklog = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  activityComment: TIssueActivityComment;
  ends?: "top" | "bottom";
};

export const IssueActivityWorklog = observer(function IssueActivityWorklog(props: TIssueActivityWorklog) {
  const { activityComment, workspaceSlug, projectId, issueId, ends } = props;
  const { t } = useTranslation();
  const store = useWorklog();
  const { fetchActivities } = useIssueDetail();
  const { allowPermissions } = useUserPermissions();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Find the matching worklog entry by id for display details
  const worklogs = store.getWorklogsForIssue(issueId);
  const worklog = worklogs.find((w) => w.id === activityComment.id);

  // Permission: project admin can edit/delete worklogs within 60-working-day window
  const isAdmin = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.PROJECT, workspaceSlug, projectId);
  const isEditable = isAdmin && worklog && isWithinEditWindow(worklog.logged_at);

  // Format date for display
  const createdAt = activityComment.created_at
    ? new Date(activityComment.created_at).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  const displayName = worklog?.logged_by_detail?.display_name;
  const duration = worklog ? formatMinutesToDisplay(worklog.duration_minutes) : null;

  const handleDelete = async (reason: string) => {
    if (!worklog) return;
    try {
      await store.deleteWorklog(workspaceSlug, projectId, issueId, worklog.id, reason);
      // Refresh activity feed to pick up audit trail created by backend Celery task
      void fetchActivities(workspaceSlug, projectId, issueId);
      setToast({ type: TOAST_TYPE.SUCCESS, title: t("worklog.deleted"), message: t("worklog.deleted_successfully") });
    } catch (err: unknown) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("worklog.error"),
        message: extractApiError(err) || t("worklog.delete_failed"),
      });
      throw err; // re-throw so delete modal knows it failed
    }
  };

  return (
    <>
      <div
        className={cn("group relative flex items-start gap-2 py-1.5", {
          "pb-0": ends === "bottom",
          "pt-0": ends === "top",
        })}
      >
        {/* icon */}
        <span className="flex-shrink-0 mt-0.5 rounded-full bg-layer-2 p-1">
          <Timer className="h-3 w-3 text-tertiary" />
        </span>

        {/* message — clickable for admin to open edit modal */}
        <div
          className={cn("flex-1 text-xs text-tertiary leading-5", {
            "cursor-pointer hover:text-secondary": isEditable,
          })}
          {...(isEditable
            ? {
                onClick: () => setIsEditModalOpen(true),
                role: "button",
                tabIndex: 0,
                onKeyDown: (e: KeyboardEvent) => {
                  if (e.key === "Enter" || e.key === " ") setIsEditModalOpen(true);
                },
              }
            : {})}
        >
          {displayName && <span className="font-medium text-primary">{displayName}</span>}
          {displayName ? ` ${t("worklog.activity_logged")}` : t("worklog.activity_logged")}
          {duration && <span className="font-medium text-primary"> {duration}</span>}
          {worklog?.description && <span className="ml-1">— {worklog.description}</span>}
          {createdAt && <span className="ml-1">{createdAt}</span>}
          {isEditable && (
            <Pencil className="ml-1 inline h-3 w-3 text-tertiary opacity-0 group-hover:opacity-100 transition-opacity" />
          )}
        </div>

        {/* context menu: Edit / Delete — project admin only */}
        {isEditable && (
          <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <CustomMenu ellipsis placement="bottom-end" closeOnSelect>
              <CustomMenu.MenuItem onClick={() => setIsEditModalOpen(true)}>{t("edit")}</CustomMenu.MenuItem>
              <CustomMenu.MenuItem onClick={() => setIsDeleteModalOpen(true)}>
                <span className="text-red-500">{t("delete")}</span>
              </CustomMenu.MenuItem>
            </CustomMenu>
          </div>
        )}
      </div>

      {/* Edit worklog modal */}
      {isEditable && (
        <WorklogModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          issueId={issueId}
          existingWorklog={worklog}
        />
      )}

      {/* Delete confirmation modal */}
      {isEditable && (
        <WorklogDeleteModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleDelete}
        />
      )}
    </>
  );
});
