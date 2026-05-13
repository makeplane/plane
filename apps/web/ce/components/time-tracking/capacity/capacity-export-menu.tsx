/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * Split-button menu for capacity export: CSV summary (existing) + XLSX detailed (new async job).
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { Download, ChevronDown } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { Menu } from "@plane/propel/menu";
import { Tooltip } from "@plane/propel/tooltip";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { useWorklog } from "@/hooks/store/use-worklog";
import type { ICapacityExportPayload } from "@plane/types";
import { CapacityExportMembersModal } from "./capacity-export-members-modal";

type Props = {
  workspaceSlug: string;
  /** ISO date string "YYYY-MM-DD" or empty string */
  dateFrom: string;
  dateTo: string;
  selectedMemberIds: string[];
  isCrossWorkspace: boolean;
  onSummaryExport: () => void;
  hasData: boolean;
  projectId?: string;
};

export const CapacityExportMenu = observer(function CapacityExportMenu(props: Props) {
  const { workspaceSlug, dateFrom, dateTo, selectedMemberIds, isCrossWorkspace, onSummaryExport, hasData, projectId } =
    props;
  const { t } = useTranslation();
  const worklogStore = useWorklog();
  const { lastExportRequestAt } = worklogStore;

  const [isMembersModalOpen, setMembersModalOpen] = useState(false);
  const [isSubmitting, setSubmitting] = useState(false);

  // Debounce: disable detailed export for 30s after last request
  const isDebounced = !!lastExportRequestAt && Date.now() - lastExportRequestAt < 30_000;
  const isMissingDateRange = !dateFrom || !dateTo;
  const isDetailedDisabled = isCrossWorkspace || isDebounced || isMissingDateRange;

  const getDetailedDisabledReason = (): string | null => {
    if (isCrossWorkspace) return t("capacity_export.cross_workspace_disabled");
    if (isDebounced) return t("capacity_export.already_queued");
    return null;
  };

  const submitDetailedExport = async (memberIds: string[] | null) => {
    const payload: ICapacityExportPayload = {
      date_from: dateFrom,
      date_to: dateTo,
      member_ids: memberIds && memberIds.length > 0 ? memberIds : null,
      cross_workspace: false,
    };
    setSubmitting(true);
    try {
      await worklogStore.initiateDetailedExport(workspaceSlug, payload);
      setToast({
        type: TOAST_TYPE.INFO,
        title: t("capacity_export.queued_title"),
        message: t("capacity_export.queued_message"),
      });
      setMembersModalOpen(false);
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("capacity_export.failed_title"),
        message: t("capacity_export.failed_message"),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const disabledReason = getDetailedDisabledReason();

  return (
    <>
      <Menu
        customButton={
          <Button variant="primary" size="sm" className="flex items-center gap-1.5">
            <Download className="h-3.5 w-3.5" />
            {t("capacity_export.menu")}
            <ChevronDown className="h-3 w-3" />
          </Button>
        }
      >
        {/* Item 1: CSV Summary (existing flow) */}
        <Menu.MenuItem onClick={hasData ? onSummaryExport : undefined} disabled={!hasData}>
          <div className="flex flex-col gap-0.5 py-0.5">
            <span className="text-sm text-primary font-medium">{t("capacity_export.summary")}</span>
            <span className="text-xs text-tertiary">{t("capacity_export.summary_desc")}</span>
          </div>
        </Menu.MenuItem>

        {/* Item 2: Detailed XLSX (async job) — opens member-picker modal */}
        <Menu.MenuItem
          onClick={isDetailedDisabled ? undefined : () => setMembersModalOpen(true)}
          disabled={isDetailedDisabled}
        >
          <Tooltip tooltipContent={disabledReason ?? ""} disabled={!disabledReason}>
            <div className="flex flex-col gap-0.5 py-0.5">
              <span className={`text-sm font-medium ${isDetailedDisabled ? "text-disabled" : "text-primary"}`}>
                {t("capacity_export.detailed")}
              </span>
              <span className="text-xs text-tertiary">{t("capacity_export.detailed_desc")}</span>
            </div>
          </Tooltip>
        </Menu.MenuItem>
      </Menu>

      <CapacityExportMembersModal
        isOpen={isMembersModalOpen}
        isSubmitting={isSubmitting}
        initialSelectedMemberIds={selectedMemberIds}
        projectId={projectId}
        onClose={() => {
          if (!isSubmitting) setMembersModalOpen(false);
        }}
        onConfirm={(memberIds) => void submitDetailedExport(memberIds)}
      />
    </>
  );
});
