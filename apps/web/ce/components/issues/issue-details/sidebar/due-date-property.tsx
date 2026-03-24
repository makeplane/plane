/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import { cn, renderFormattedPayloadDate, shouldHighlightIssueDueDate } from "@plane/utils";
import type { TIssue, TIssueUpdatePayload } from "@plane/types";
import { DateDropdown } from "@/components/dropdowns/date";
import type { TIssueOperations } from "@/components/issues/issue-detail/root";
import { DateAlert } from "./date-alert";
import { FieldChangeReasonModal } from "./field-change-reason-modal";

type TDueDatePropertyProps = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  issueOperations: TIssueOperations;
  isEditable: boolean;
  stateGroup?: string;
  minDate?: Date;
  hasFieldError?: boolean;
  issue: TIssue;
};

export const DueDateProperty = observer(function DueDateProperty(props: TDueDatePropertyProps) {
  const { workspaceSlug, projectId, issueId, issueOperations, isEditable, stateGroup, minDate, hasFieldError, issue } =
    props;
  const { t } = useTranslation();

  const [pendingDueDate, setPendingDueDate] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleChange = (val: Date | null) => {
    const formatted = val ? renderFormattedPayloadDate(val) : null;
    if (!formatted) {
      // Clearing date — no reason required
      void issueOperations.update(workspaceSlug, projectId, issueId, { target_date: null });
      return;
    }
    setPendingDueDate(formatted);
    setIsModalOpen(true);
  };

  const handleConfirm = async (reason: string) => {
    const payload: TIssueUpdatePayload = { target_date: pendingDueDate, reason };
    await issueOperations.update(workspaceSlug, projectId, issueId, payload);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setPendingDueDate(null);
  };

  return (
    <>
      <div
        className={cn(
          "flex items-center gap-2 w-full",
          hasFieldError && "rounded border border-red-500"
        )}
      >
        <DateDropdown
          placeholder={t("issue.add.due_date")}
          value={issue.target_date}
          onChange={handleChange}
          minDate={minDate}
          disabled={!isEditable}
          buttonVariant="transparent-with-text"
          className="group w-full grow"
          buttonContainerClassName="w-full text-left h-7.5"
          buttonClassName={cn("text-body-xs-regular", {
            "text-placeholder": !issue.target_date,
            "text-danger-primary": shouldHighlightIssueDueDate(issue.target_date, stateGroup),
          })}
          hideIcon
          clearIconClassName="h-3 w-3 hidden group-hover:inline text-primary"
        />
        {issue.target_date && <DateAlert date={issue.target_date} workItem={issue} projectId={projectId} />}
      </div>
      <FieldChangeReasonModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onConfirm={handleConfirm}
        fieldLabel={t("common.order_by.due_date")}
      />
    </>
  );
});
