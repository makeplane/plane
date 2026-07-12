/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
import { CalendarCheck2, ChevronRight, Paperclip } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { EditIcon, TrashIcon } from "@plane/propel/icons";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { Tooltip } from "@plane/propel/tooltip";
import type { ISearchIssueResponse } from "@plane/types";
import { CustomMenu } from "@plane/ui";
import { cn, renderFormattedDate } from "@plane/utils";
// components
import { ExistingIssuesListModal } from "@/components/core/modals/existing-issues-list-modal";
// hooks
import { useMilestone } from "@/hooks/store/use-milestone";
// local imports
import { DeleteMilestoneModal } from "./delete-milestone-modal";
import { MilestoneIssuesList } from "./milestone-issues-list";
import { CreateUpdateMilestoneModal } from "./modal";

type Props = {
  workspaceSlug: string;
  projectId: string;
  milestoneId: string;
  disabled?: boolean;
};

export const MilestoneListItem = observer(function MilestoneListItem(props: Props) {
  const { workspaceSlug, projectId, milestoneId, disabled = false } = props;
  // states
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isAttachModalOpen, setIsAttachModalOpen] = useState(false);
  // store hooks
  const { getMilestoneById, getMilestoneIssuesByMilestoneId, fetchMilestoneIssues, addIssuesToMilestone } =
    useMilestone();
  // plane hooks
  const { t } = useTranslation();
  // load the attached links when the attach modal opens (shared SWR key with
  // the expanded list) so already-attached items are hidden even before expand
  useSWR(
    isAttachModalOpen ? `MILESTONE_ISSUES_${milestoneId}` : null,
    isAttachModalOpen ? () => fetchMilestoneIssues(workspaceSlug, projectId, milestoneId) : null
  );
  // derived values
  const milestone = getMilestoneById(milestoneId);
  const attachedIssueIds = new Set(getMilestoneIssuesByMilestoneId(milestoneId).map((link) => link.issue));

  if (!milestone) return null;

  const totalIssues = milestone.total_issues;
  const completedIssues = milestone.completed_issues;

  const handleAttachWorkItems = async (data: ISearchIssueResponse[]) => {
    const issueIds = data.map((workItem) => workItem.id);
    try {
      await addIssuesToMilestone(workspaceSlug, projectId, milestoneId, issueIds);
      setIsExpanded(true);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Success!",
        message: "Work items attached to the milestone successfully.",
      });
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "Selected work items could not be attached to the milestone. Please try again.",
      });
    }
  };

  return (
    <>
      <CreateUpdateMilestoneModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        workspaceSlug={workspaceSlug}
        projectId={projectId}
        data={milestone}
      />
      <DeleteMilestoneModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        workspaceSlug={workspaceSlug}
        projectId={projectId}
        data={milestone}
      />
      <ExistingIssuesListModal
        workspaceSlug={workspaceSlug}
        projectId={projectId}
        isOpen={isAttachModalOpen}
        handleClose={() => setIsAttachModalOpen(false)}
        searchParams={{}}
        handleOnSubmit={handleAttachWorkItems}
        shouldHideIssue={(workItem) => attachedIssueIds.has(workItem.id)}
      />
      <div className="rounded-md border border-subtle">
        <div className="group flex items-center gap-2 px-3 py-2">
          <button
            type="button"
            className="flex-shrink-0 rounded p-0.5 text-tertiary hover:bg-layer-transparent-hover hover:text-secondary"
            onClick={() => setIsExpanded((prev) => !prev)}
            aria-expanded={isExpanded}
          >
            <ChevronRight className={cn("size-3.5 transition-transform", { "rotate-90": isExpanded })} />
          </button>
          <span className="truncate text-13 font-medium text-primary">{milestone.name}</span>
          {milestone.target_date && (
            <span className="flex flex-shrink-0 items-center gap-1 text-11 text-tertiary">
              <CalendarCheck2 className="size-3" />
              {renderFormattedDate(milestone.target_date)}
            </span>
          )}
          {totalIssues !== undefined && (
            <Tooltip tooltipContent={t("milestone_completed_work_items")} position="top">
              <span className="flex-shrink-0 rounded bg-layer-1 px-1.5 py-0.5 text-11 font-medium text-tertiary">
                {completedIssues ?? 0}/{totalIssues}
              </span>
            </Tooltip>
          )}
          {!disabled && (
            <div className="ml-auto flex flex-shrink-0 items-center gap-1">
              <button
                type="button"
                className="flex items-center gap-1 rounded px-1.5 py-0.5 text-11 font-medium text-tertiary opacity-0 group-hover:opacity-100 hover:bg-layer-transparent-hover hover:text-secondary"
                onClick={() => setIsAttachModalOpen(true)}
              >
                <Paperclip className="size-3" />
                {t("milestone_attach_work_items")}
              </button>
              <CustomMenu ellipsis closeOnSelect placement="bottom-end">
                <CustomMenu.MenuItem className="flex items-center gap-2" onClick={() => setIsEditModalOpen(true)}>
                  <EditIcon className="size-3 shrink-0" />
                  {t("edit")}
                </CustomMenu.MenuItem>
                <CustomMenu.MenuItem className="flex items-center gap-2" onClick={() => setIsDeleteModalOpen(true)}>
                  <TrashIcon className="size-3 shrink-0" />
                  {t("delete")}
                </CustomMenu.MenuItem>
              </CustomMenu>
            </div>
          )}
        </div>
        {isExpanded && (
          <div className="border-t border-subtle">
            <MilestoneIssuesList
              workspaceSlug={workspaceSlug}
              projectId={projectId}
              milestoneId={milestoneId}
              disabled={disabled}
            />
          </div>
        )}
      </div>
    </>
  );
});
