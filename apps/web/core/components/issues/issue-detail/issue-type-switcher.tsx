/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { useState } from "react";
import { toJS } from "mobx";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { ArrowRightLeft } from "lucide-react";
// plane imports
import type { TIssue } from "@plane/types";
import { cn } from "@plane/utils";
// components
import { CreateUpdateIssueModal } from "@/components/issues/issue-modal/root";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
// plane web imports
import { IssueIdentifier } from "@/components/issues/issue-detail/issue-identifier";
import { useIssueTypes } from "@/plane-web/hooks/store";

type TIssueTypeSwitcherProps = {
  issueId: string;
  disabled: boolean;
};

export const IssueTypeSwitcher = observer(function IssueTypeSwitcher(props: TIssueTypeSwitcherProps) {
  const { issueId, disabled } = props;
  // router
  const { workspaceSlug } = useParams();
  // states
  const [isCreateUpdateIssueModalOpen, setIsCreateUpdateIssueModalOpen] = useState(false);
  const [issueToEdit, setIssueToEdit] = useState<TIssue | undefined>(undefined);
  // store hooks
  const {
    issue: { getIssueById },
    toggleCreateIssueModal,
    fetchActivities,
  } = useIssueDetail();
  const { isWorkItemTypeEnabledForProject } = useIssueTypes();
  // derived values
  const issue = getIssueById(issueId);
  if (!issue || !issue.project_id) return <></>;
  const isWorkItemTypeEnabled = isWorkItemTypeEnabledForProject(workspaceSlug?.toString(), issue.project_id);

  const handleEditIssue = () => {
    if (disabled) return;
    setIssueToEdit(toJS(issue));
    setIsCreateUpdateIssueModalOpen(true);
    toggleCreateIssueModal(true);
  };

  if (!isWorkItemTypeEnabled) {
    return <IssueIdentifier issueId={issueId} projectId={issue.project_id} size="md" enableClickToCopyIdentifier />;
  }

  return (
    <>
      <CreateUpdateIssueModal
        isOpen={isCreateUpdateIssueModalOpen}
        onSubmit={async () => {
          if (workspaceSlug && issue.project_id) {
            await fetchActivities(workspaceSlug.toString(), issue.project_id, issueId);
          }
        }}
        onClose={() => {
          setIsCreateUpdateIssueModalOpen(false);
          toggleCreateIssueModal(false);
          setIssueToEdit(undefined);
        }}
        data={issueToEdit}
        fetchIssueDetails={false}
      />
      <div className={cn("group flex items-center gap-3 cursor-pointer")}>
        <IssueIdentifier issueId={issueId} projectId={issue.project_id} size="md" enableClickToCopyIdentifier />
        <button
          type="button"
          className={cn(
            "flex opacity-0 group-hover:opacity-100 transition-opacity duration-300 items-center gap-1 text-11 font-medium text-tertiary hover:text-secondary",
            disabled ? "cursor-not-allowed" : "cursor-pointer",
            {
              "text-placeholder hover:text-placeholder": disabled,
            }
          )}
          disabled={disabled}
          onClick={handleEditIssue}
        >
          <ArrowRightLeft className="w-3 h-3 flex-shrink-0" />
          Switch work item type
        </button>
      </div>
    </>
  );
});
