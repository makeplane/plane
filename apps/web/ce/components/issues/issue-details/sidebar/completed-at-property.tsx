/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// i18n
import { useTranslation } from "@plane/i18n";
// constants
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
// ui
import { DueDatePropertyIcon } from "@plane/propel/icons";
import { Tooltip } from "@plane/propel/tooltip";
import { EProjectFieldPermissionKey } from "@plane/types";
import { renderFormattedDate, renderFormattedTime } from "@plane/utils";
// components
import { SidebarPropertyListItem } from "@/components/common/layout/sidebar/property-list-item";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useProjectState } from "@/hooks/store/use-project-state";
import { useUserPermissions } from "@/hooks/store/user";
// ce hooks
import { useWorkItemFieldLock } from "@/plane-web/hooks/use-work-item-field-lock";
// local components
import { CompletedAtDateTimePicker } from "./completed-at-date-time-picker";
import { FieldChangeReasonModal } from "./field-change-reason-modal";

type TCompletedAtPropertyProps = {
  issueId: string;
};

export const CompletedAtProperty = observer(function CompletedAtProperty({ issueId }: TCompletedAtPropertyProps) {
  const { t } = useTranslation();
  const { workspaceSlug, projectId } = useParams();
  const {
    issue: { getIssueById },
    updateIssue,
  } = useIssueDetail();
  const { getStateById } = useProjectState();
  const { allowPermissions } = useUserPermissions();

  const [pendingCompletedAt, setPendingCompletedAt] = useState<string | null>(null);
  const [isReasonModalOpen, setIsReasonModalOpen] = useState(false);

  const issue = getIssueById(issueId);

  // Field-level permission gate — must be called unconditionally (Rules of Hooks).
  // currentValue passed so Empty→Value is always allowed for members (Validation #7).
  const { isLocked } = useWorkItemFieldLock(EProjectFieldPermissionKey.COMPLETED_DATE, issue?.completed_at);

  if (!issue) return null;

  const stateDetails = getStateById(issue.state_id);
  if (stateDetails?.group !== "completed") return null;

  const isRoleEditable = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.PROJECT
  );
  const isEditable = isRoleEditable && !isLocked;

  const completedAt = issue.completed_at ?? new Date().toISOString();

  const handleDateChange = (isoString: string) => {
    setPendingCompletedAt(isoString);
    setIsReasonModalOpen(true);
  };

  const handleConfirm = async (reason: string) => {
    await updateIssue(workspaceSlug?.toString() ?? "", projectId?.toString() ?? "", issueId, {
      completed_at: pendingCompletedAt,
      reason,
    });
  };

  // Render read-only text when field is locked and a value already exists.
  // When value is null, isLocked still allows fill (allowFillEmpty in hook) so picker is shown.
  const showReadOnly = isLocked && !!issue.completed_at;

  return (
    <>
      <SidebarPropertyListItem icon={DueDatePropertyIcon} label={t("common.completed_at")} childrenClassName="h-7.5">
        {showReadOnly ? (
          <Tooltip tooltipContent={t("project_settings.field_permissions.locked_tooltip")} position="top">
            <span className="flex items-center gap-1.5 px-2 h-7.5 text-body-xs-regular text-secondary-200 cursor-default">
              {`${renderFormattedDate(completedAt)} ${renderFormattedTime(completedAt, "12-hour")}`}
            </span>
          </Tooltip>
        ) : (
          <CompletedAtDateTimePicker value={completedAt} disabled={!isEditable} onChange={handleDateChange} />
        )}
      </SidebarPropertyListItem>
      <FieldChangeReasonModal
        isOpen={isReasonModalOpen}
        onClose={() => {
          setIsReasonModalOpen(false);
          setPendingCompletedAt(null);
        }}
        onConfirm={handleConfirm}
        fieldLabel={t("common.completed_at")}
      />
    </>
  );
});
