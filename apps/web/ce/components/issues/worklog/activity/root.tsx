/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { Timer } from "lucide-react";
// plane imports
import { EUserPermissions } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { EditIcon, TrashIcon } from "@plane/propel/icons";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import { Tooltip } from "@plane/propel/tooltip";
import type { TIssueActivityComment } from "@plane/types";
import { AlertModalCore, Avatar, CustomMenu } from "@plane/ui";
import {
  calculateTimeAgo,
  formatWorklogDuration,
  getFileURL,
  renderFormattedDate,
  renderFormattedTime,
} from "@plane/utils";
// hooks
import { useUser, useUserPermissions } from "@/hooks/store/user";
import { useWorklog } from "@/hooks/store/use-worklog";
// local imports
import { WorklogFormModal } from "./worklog-form-modal";

type TIssueActivityWorklog = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  activityComment: TIssueActivityComment;
  ends?: "top" | "bottom";
};

export const IssueActivityWorklog = observer(function IssueActivityWorklog(props: TIssueActivityWorklog) {
  const { workspaceSlug, projectId, issueId, activityComment, ends } = props;
  // i18n
  const { t } = useTranslation();
  // store hooks
  const { getWorklogsByIssueId, deleteWorklog } = useWorklog();
  const { data: currentUser } = useUser();
  const { getProjectRoleByWorkspaceSlugAndProjectId } = useUserPermissions();
  // states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  // derived values
  const worklog = getWorklogsByIssueId(issueId).find((entry) => entry.id === activityComment.id);
  const isAdmin = getProjectRoleByWorkspaceSlugAndProjectId(workspaceSlug, projectId) === EUserPermissions.ADMIN;
  const canModify = Boolean(worklog && (worklog.logged_by === currentUser?.id || isAdmin));

  if (!worklog) return <></>;

  const loggedByDetail = worklog.logged_by_detail;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteWorklog(workspaceSlug, projectId, issueId, worklog.id);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("worklog.toasts.delete.success.title"),
        message: t("worklog.toasts.delete.success.message"),
      });
      setIsDeleteModalOpen(false);
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("worklog.toasts.delete.error.title"),
        message: t("worklog.toasts.delete.error.message"),
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <WorklogFormModal
        isOpen={isEditModalOpen}
        handleClose={() => setIsEditModalOpen(false)}
        workspaceSlug={workspaceSlug}
        projectId={projectId}
        issueId={issueId}
        worklog={worklog}
      />
      <AlertModalCore
        variant="danger"
        isOpen={isDeleteModalOpen}
        handleClose={() => setIsDeleteModalOpen(false)}
        handleSubmit={handleDelete}
        isSubmitting={isDeleting}
        title={t("worklog.delete")}
        content={t("worklog.delete_confirmation")}
        primaryButtonText={{ loading: t("worklog.delete"), default: t("worklog.delete") }}
      />
      <div
        className={`relative flex items-center gap-3 text-caption-sm-regular ${
          ends === "top" ? "pb-2" : ends === "bottom" ? "pt-2" : "py-2"
        }`}
      >
        <div className="absolute top-0 bottom-0 left-[13px] w-px bg-layer-3" aria-hidden />
        <div className="z-[4] flex h-7 w-7 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg border border-subtle bg-layer-2 text-secondary shadow-raised-100">
          <Timer className="h-3.5 w-3.5" />
        </div>
        <div className="flex w-full items-center gap-2 text-secondary">
          <div className="flex grow flex-wrap items-center gap-x-1 truncate">
            <Avatar
              name={loggedByDetail?.display_name}
              src={getFileURL(loggedByDetail?.avatar_url ?? "")}
              size="sm"
              className="flex-shrink-0"
            />
            <span className="font-medium text-primary">{loggedByDetail?.display_name}</span>
            <span>{t("worklog.logged")}</span>
            <span className="font-medium text-primary">{formatWorklogDuration(worklog.duration)}</span>
            {worklog.description && <span className="text-tertiary">— {worklog.description}</span>}
            <Tooltip
              tooltipContent={`${renderFormattedDate(worklog.created_at)}, ${renderFormattedTime(worklog.created_at)}`}
            >
              <span className="whitespace-nowrap text-tertiary">{calculateTimeAgo(worklog.created_at)}</span>
            </Tooltip>
          </div>
          {canModify && (
            <CustomMenu
              ariaLabel={t("aria_labels.quick_actions.worklog")}
              ellipsis
              closeOnSelect
              placement="bottom-end"
            >
              <CustomMenu.MenuItem className="flex items-center gap-2" onClick={() => setIsEditModalOpen(true)}>
                <EditIcon className="size-3 shrink-0" />
                {t("worklog.edit_work")}
              </CustomMenu.MenuItem>
              <CustomMenu.MenuItem className="flex items-center gap-2" onClick={() => setIsDeleteModalOpen(true)}>
                <TrashIcon className="size-3 shrink-0" />
                {t("worklog.delete")}
              </CustomMenu.MenuItem>
            </CustomMenu>
          )}
        </div>
      </div>
    </>
  );
});
