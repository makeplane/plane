/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { Clock } from "lucide-react";
import { Button } from "@plane/propel/button";
import { Tooltip } from "@plane/propel/tooltip";
import { useTranslation } from "@plane/i18n";
import { EUserPermissions } from "@plane/constants";
import type { TIssueActivityComment } from "@plane/types";
import { AlertModalCore } from "@plane/ui";
import { calculateTimeAgo, renderFormattedDate, renderFormattedTime } from "@plane/utils";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { usePlatformOS } from "@/hooks/use-platform-os";
import { useUser, useUserPermissions } from "@/hooks/store/user";
import { computeEndISO, formatDuration, isoToLocalInput, localInputToISO } from "../utils";

const editInputClassName =
  "w-full rounded border border-subtle bg-surface-2 p-2 text-sm text-primary outline-none focus:border-accent-strong";

type TIssueActivityWorklog = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  activityComment: TIssueActivityComment;
  ends?: "top" | "bottom";
};

export const IssueActivityWorklog = observer(function IssueActivityWorklog(props: TIssueActivityWorklog) {
  const { workspaceSlug, projectId, issueId, activityComment, ends } = props;
  const { t } = useTranslation();
  const { isMobile } = usePlatformOS();
  const { data: currentUser } = useUser();
  const { getProjectRoleByWorkspaceSlugAndProjectId } = useUserPermissions();
  const { worklog } = useIssueDetail();

  const [isEditing, setIsEditing] = useState(false);
  const [editDescription, setEditDescription] = useState("");
  const [editStart, setEditStart] = useState("");
  const [editEnd, setEditEnd] = useState("");
  const [editError, setEditError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const entry = worklog.getWorklogById(activityComment.id);
  if (!entry || entry.duration === null) return null;

  const isOwn = entry.logged_by === currentUser?.id;
  const isAdmin = getProjectRoleByWorkspaceSlugAndProjectId(workspaceSlug, projectId) === EUserPermissions.ADMIN;
  // admins may edit/delete anyone's worklog; everyone else only their own
  const canModify = isOwn || isAdmin;
  const startISO = entry.started_at ?? entry.logged_at;
  const endISO = computeEndISO(startISO, entry.duration);

  const handleEdit = () => {
    setEditDescription(entry.description ?? "");
    setEditStart(isoToLocalInput(startISO));
    setEditEnd(isoToLocalInput(endISO));
    setEditError(null);
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    const startInput = localInputToISO(editStart);
    const endInput = localInputToISO(editEnd);
    if (!startInput || !endInput) {
      setEditError(t("common.worklog_invalid_range"));
      return;
    }
    const duration = Math.round((new Date(endInput).getTime() - new Date(startInput).getTime()) / 1000);
    if (duration < 60) {
      setEditError(t("common.worklog_invalid_range"));
      return;
    }
    setEditError(null);
    await worklog.updateWorklog(workspaceSlug, projectId, issueId, entry.id, {
      started_at: startInput,
      logged_at: startInput,
      duration,
      description: editDescription.trim() || undefined,
    });
    setIsEditing(false);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await worklog.deleteWorklog(workspaceSlug, projectId, issueId, entry.id);
      setShowDeleteModal(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      className={`relative flex items-start gap-3 text-caption-sm-regular ${
        ends === "top" ? "pb-2" : ends === "bottom" ? "pt-2" : "py-2"
      }`}
    >
      <div className="absolute top-0 bottom-0 left-[13px] w-px bg-layer-3" aria-hidden />
      <div className="z-[4] flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-subtle bg-layer-2 text-secondary shadow-raised-100">
        <Clock className="h-3.5 w-3.5" />
      </div>
      <div className="w-full min-w-0">
        <div className="flex flex-wrap items-baseline gap-1 text-secondary">
          <span className="font-medium text-primary">{entry.logged_by_detail?.display_name}</span>
          <span>{t("common.logged")}</span>
          <span className="font-semibold text-success-primary">{formatDuration(entry.duration)}</span>
          <Tooltip
            isMobile={isMobile}
            tooltipContent={`${renderFormattedDate(entry.logged_at)}, ${renderFormattedTime(entry.logged_at)}`}
          >
            <span className="whitespace-nowrap text-tertiary"> {calculateTimeAgo(entry.logged_at)}</span>
          </Tooltip>
        </div>

        {/* description display / edit */}
        {isEditing ? (
          <div className="mt-2 space-y-2">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-tertiary">{t("common.worklog_start")}</label>
              <input
                type="datetime-local"
                value={editStart}
                max={editEnd || undefined}
                onChange={(e) => setEditStart(e.target.value)}
                className={editInputClassName}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-tertiary">{t("common.worklog_end")}</label>
              <input
                type="datetime-local"
                value={editEnd}
                min={editStart || undefined}
                onChange={(e) => setEditEnd(e.target.value)}
                className={editInputClassName}
              />
            </div>
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              rows={2}
              placeholder={t("common.worklog_description_placeholder")}
              className={`resize-none ${editInputClassName}`}
            />
            {editError && <p className="text-xs text-danger-primary">{editError}</p>}
            <div className="mt-1 flex gap-2">
              <Button variant="primary" size="sm" onClick={handleSaveEdit}>
                {t("common.save")}
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setIsEditing(false)}>
                {t("common.cancel")}
              </Button>
            </div>
          </div>
        ) : (
          <>
            {startISO && (
              <p className="text-xs mt-0.5 text-tertiary">
                {renderFormattedDate(startISO)} {renderFormattedTime(startISO)}
                {endISO && ` → ${renderFormattedDate(endISO)} ${renderFormattedTime(endISO)}`}
              </p>
            )}
            {entry.description && <p className="text-sm mt-0.5 text-secondary">{entry.description}</p>}
          </>
        )}

        {/* owner actions (admins can edit/delete anyone's) */}
        {canModify && !isEditing && (
          <div className="mt-1 flex gap-3">
            <button className="text-xs text-tertiary hover:text-secondary" onClick={handleEdit}>
              {t("common.edit")}
            </button>
            <button className="text-xs text-danger-primary hover:opacity-80" onClick={() => setShowDeleteModal(true)}>
              {t("common.delete")}
            </button>
          </div>
        )}
      </div>

      <AlertModalCore
        isOpen={showDeleteModal}
        handleClose={() => setShowDeleteModal(false)}
        handleSubmit={handleDelete}
        isSubmitting={isDeleting}
        variant="danger"
        title={t("common.worklog_delete_title")}
        content={t("common.worklog_delete_description")}
        primaryButtonText={{ loading: t("common.deleting") || "Deleting", default: t("common.delete") }}
        secondaryButtonText={t("common.cancel")}
      />
    </div>
  );
});
