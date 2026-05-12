/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import { EProjectFieldPermissionKey } from "@plane/types";
import type { TIssue } from "@plane/types";
import { Tooltip } from "@plane/propel/tooltip";
import { cn, renderFormattedDate, renderFormattedPayloadDate } from "@plane/utils";
import { DateDropdown } from "@/components/dropdowns/date";
import type { TIssueOperations } from "@/components/issues/issue-detail/root";
// ce hooks
import { useWorkItemFieldLock } from "@/plane-web/hooks/use-work-item-field-lock";

type TStartDatePropertyProps = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  issueOperations: TIssueOperations;
  isEditable: boolean;
  maxDate?: Date;
  hasFieldError?: boolean;
  issue: TIssue;
};

export const StartDateProperty = observer(function StartDateProperty(props: TStartDatePropertyProps) {
  const {
    workspaceSlug,
    projectId,
    issueId,
    issueOperations,
    isEditable: isRoleEditable,
    maxDate,
    hasFieldError,
    issue,
  } = props;
  const { t } = useTranslation();

  // Field-level permission gate (Validation #7: Empty→Value allowed for members).
  const { isLocked } = useWorkItemFieldLock(EProjectFieldPermissionKey.START_DATE, issue.start_date);
  const isEditable = isRoleEditable && !isLocked;

  const handleChange = (val: Date | null) => {
    void issueOperations.update(workspaceSlug, projectId, issueId, {
      start_date: val ? renderFormattedPayloadDate(val) : null,
    });
  };

  // Read-only text only when locked AND value exists; empty value stays editable.
  const showReadOnly = isLocked && !!issue.start_date;

  if (showReadOnly) {
    return (
      <Tooltip tooltipContent={t("project_settings.field_permissions.locked_tooltip")} position="top">
        <span className="flex items-center px-2 h-7.5 text-body-xs-regular cursor-default text-secondary-200">
          {renderFormattedDate(issue.start_date)}
        </span>
      </Tooltip>
    );
  }

  return (
    <div className={cn("w-full", hasFieldError && "rounded border border-red-500")}>
      <DateDropdown
        placeholder={t("issue.add.start_date")}
        value={issue.start_date}
        onChange={handleChange}
        maxDate={maxDate}
        disabled={!isEditable}
        buttonVariant="transparent-with-text"
        className="group w-full grow"
        buttonContainerClassName="w-full text-left h-7.5"
        buttonClassName={cn("text-body-xs-regular", { "text-placeholder": !issue.start_date })}
        hideIcon
        clearIconClassName="h-3 w-3 hidden group-hover:inline text-primary"
      />
    </div>
  );
});
