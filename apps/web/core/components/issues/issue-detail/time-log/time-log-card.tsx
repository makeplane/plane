/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { MoreHorizontal, Pencil, Timer, Trash2 } from "lucide-react";
// plane imports
import type { ReactNode } from "react";
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { IconButton } from "@plane/propel/icon-button";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import { Tooltip } from "@plane/propel/tooltip";
import { CustomMenu } from "@plane/ui";
import { calculateTimeAgo, cn, renderFormattedDate, renderFormattedTime } from "@plane/utils";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useUser } from "@/hooks/store/user";
import { useUserPermissions } from "@/hooks/store/user";
import { usePlatformOS } from "@/hooks/use-platform-os";
// local imports
import { formatDuration } from "./helper";
import { LogWorkModal } from "./log-work-modal";

type TTimeLogCard = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  timeLogId: string;
  ends: "top" | "bottom" | undefined;
  disabled?: boolean;
};

export const TimeLogCard = observer(function TimeLogCard(props: TTimeLogCard) {
  const { workspaceSlug, projectId, issueId, timeLogId, ends, disabled = false } = props;
  // states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  // translation
  const { t } = useTranslation();
  // store hooks
  const {
    timeLog: { getTimeLogById, removeTimeLog },
  } = useIssueDetail();
  const { data: currentUser } = useUser();
  const { allowPermissions } = useUserPermissions();
  const { isMobile } = usePlatformOS();
  // derived values
  const timeLog = getTimeLogById(timeLogId);

  if (!timeLog) return null;

  const isProjectAdmin = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.PROJECT);
  // the entry's author (created_by) may differ from whose time it is (logged_by)
  const isAuthor = !!currentUser?.id && timeLog.created_by === currentUser.id;
  const canModify = !disabled && (isAuthor || isProjectAdmin);

  const handleDelete = async () => {
    try {
      await removeTimeLog(workspaceSlug, projectId, issueId, timeLogId);
      setToast({ type: TOAST_TYPE.SUCCESS, title: t("toast.success"), message: t("time_log.time_log_deleted") });
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("toast.error"), message: t("time_log.couldnt_delete_time_log") });
    }
  };

  const loggedByName = timeLog.logged_by_detail?.display_name ?? t("time_log.someone");
  // surface when an admin logged this on somebody else's behalf
  const loggedOnBehalf = timeLog.created_by && timeLog.created_by !== timeLog.logged_by;

  const summaryTokens: Record<string, ReactNode> = {
    name: loggedByName,
    duration: formatDuration(timeLog.duration_minutes),
    date: renderFormattedDate(timeLog.logged_date),
  };
  // the ICU template bolds the interpolated name/duration, keeping them translated and styled
  const renderSummary = (template: string) => {
    const parts: ReactNode[] = [];
    const placeholderRegex = /\{(\w+)\}/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    let key = 0;
    while ((match = placeholderRegex.exec(template)) !== null) {
      if (match.index > lastIndex) parts.push(template.slice(lastIndex, match.index));
      parts.push(
        <span key={key++} className="font-medium text-primary">
          {summaryTokens[match[1]]}
        </span>
      );
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < template.length) parts.push(template.slice(lastIndex));
    return parts;
  };

  return (
    <>
      <LogWorkModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        workspaceSlug={workspaceSlug}
        projectId={projectId}
        issueId={issueId}
        timeLogId={timeLogId}
      />
      <div
        className={cn("relative flex items-start gap-3 text-caption-sm-regular", {
          "pb-2": ends === "top",
          "pt-2": ends === "bottom",
          "py-2": !ends,
        })}
      >
        <div className="absolute top-0 bottom-0 left-[13px] w-px bg-layer-3" aria-hidden />
        <div className="z-[4] flex h-7 w-7 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg border border-subtle bg-layer-2 text-secondary shadow-raised-100">
          <Timer className="h-3.5 w-3.5" />
        </div>
        <div className="flex w-full items-start justify-between gap-2">
          <div className="w-full truncate text-secondary">
            {renderSummary(loggedOnBehalf ? t("time_log.summary_on_behalf") : t("time_log.summary"))}
            <span>
              <Tooltip
                isMobile={isMobile}
                tooltipContent={`${renderFormattedDate(timeLog.created_at)}, ${renderFormattedTime(timeLog.created_at)}`}
              >
                <span className="whitespace-nowrap text-tertiary"> {calculateTimeAgo(timeLog.created_at)}</span>
              </Tooltip>
            </span>
            {timeLog.description && <p className="mt-1 whitespace-pre-line text-tertiary">{timeLog.description}</p>}
          </div>
          {canModify && (
            <CustomMenu customButton={<IconButton icon={MoreHorizontal} variant="ghost" size="sm" />} closeOnSelect>
              <CustomMenu.MenuItem onClick={() => setIsEditModalOpen(true)} className="flex items-center gap-2">
                <Pencil className="size-3 shrink-0" />
                <h5>{t("common.edit")}</h5>
              </CustomMenu.MenuItem>
              <CustomMenu.MenuItem onClick={handleDelete} className="flex items-center gap-2 text-danger-primary">
                <Trash2 className="size-3 shrink-0" />
                <h5>{t("common.delete")}</h5>
              </CustomMenu.MenuItem>
            </CustomMenu>
          )}
        </div>
      </div>
    </>
  );
});
