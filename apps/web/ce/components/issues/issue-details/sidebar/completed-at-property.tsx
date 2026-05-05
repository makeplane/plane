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
// components
import { SidebarPropertyListItem } from "@/components/common/layout/sidebar/property-list-item";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useProjectState } from "@/hooks/store/use-project-state";
import { useUserPermissions } from "@/hooks/store/user";
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
  if (!issue) return null;

  const stateDetails = getStateById(issue.state_id);
  if (stateDetails?.group !== "completed") return null;

  const isEditable = allowPermissions([EUserPermissions.ADMIN, EUserPermissions.MEMBER], EUserPermissionsLevel.PROJECT);

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

  return (
    <>
      <SidebarPropertyListItem icon={DueDatePropertyIcon} label={t("common.completed_at")} childrenClassName="h-7.5">
        <CompletedAtDateTimePicker value={completedAt} disabled={!isEditable} onChange={handleDateChange} />
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
