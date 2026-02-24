/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState, useCallback } from "react";
import type { FC } from "react";
import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import { useWorklog } from "@/hooks/store/use-worklog";
import { Button } from "@plane/propel/button";
import { PlusIcon } from "@plane/propel/icons";
import { TimesheetAddIssueModal } from "./timesheet-add-issue-modal";
import { TimesheetWeekNavigator } from "./timesheet-week-navigator";
import { TimesheetTable } from "./timesheet-table";

interface TimesheetGridProps {
    workspaceSlug: string;
    projectId: string;
}

/**
 * Main Timesheet Grid — the "My Timesheet" tab.
 * Fetches the current user's assigned issues with daily worklog totals for a given week.
 */
export const TimesheetGrid: FC<TimesheetGridProps> = observer(({ workspaceSlug, projectId }) => {
    const { t } = useTranslation();
    const worklogStore = useWorklog();
    const [error, setError] = useState<string | null>(null);
    const [isAddIssueModalOpen, setIsAddIssueModalOpen] = useState(false);

    const fetchData = useCallback(
        async (weekStart?: string) => {
            setError(null);
            try {
                await worklogStore.fetchTimesheetGrid(workspaceSlug, projectId, weekStart);
            } catch {
                setError("Failed to load timesheet data.");
            }
        },
        [workspaceSlug, projectId, worklogStore]
    );

    const handleSave = useCallback(
        async (issueId: string, date: string, minutes: number) => {
            try {
                await worklogStore.bulkUpdateTimesheet(workspaceSlug, projectId, [
                    { issue_id: issueId, logged_at: date, duration_minutes: minutes },
                ]);
            } catch {
                setError("Failed to save timesheet.");
            }
        },
        [workspaceSlug, projectId, worklogStore]
    );

    const data = worklogStore.timesheetData;
    const isLoading = worklogStore.isTimesheetLoading;
    const isEmpty = data && data.rows.length === 0;

    return (
        <div className="flex flex-col gap-4 p-6 h-full overflow-y-auto custom-scrollbar">
            {/* Header controls (Week navigator + Add Issue) */}
            <div className="flex items-center justify-between">
                <TimesheetWeekNavigator
                    weekStart={data?.week_start ?? null}
                    onWeekChange={(ws) => void fetchData(ws)}
                    onInit={() => void fetchData()}
                />

                <Button
                    variant="primary"
                    size="sm"
                    prependIcon={<PlusIcon className="h-3.5 w-3.5" />}
                    onClick={() => setIsAddIssueModalOpen(true)}
                    className="text-[11px] font-semibold h-7"
                >
                    {t("timesheet_add_issue", "Add Issue")}
                </Button>
            </div>

            {/* Add Issue Modal */}
            <TimesheetAddIssueModal
                isOpen={isAddIssueModalOpen}
                handleClose={() => setIsAddIssueModalOpen(false)}
                projectId={projectId}
                onSelect={(issue) => {
                    worklogStore.addEmptyTimesheetRow(
                        issue.id,
                        issue.name,
                        `${issue.project__identifier}-${issue.sequence_id}`,
                        issue.project_id
                    );
                }}
            />

            {/* Loading */}
            {isLoading && (
                <div className="flex items-center justify-center py-16">
                    <span className="text-xs text-secondary font-medium animate-pulse">Loading...</span>
                </div>
            )}

            {/* Error */}
            {!isLoading && error && (
                <div className="flex items-center justify-center py-16">
                    <span className="text-xs text-red-500 font-medium">{error}</span>
                </div>
            )}

            {/* Empty */}
            {!isLoading && !error && isEmpty && (
                <div className="flex items-center justify-center py-24">
                    <span className="text-xs text-secondary">{t("timesheet_no_issues")}</span>
                </div>
            )}

            {/* Data table */}
            {!isLoading && !error && data && !isEmpty && (
                <TimesheetTable
                    weekStart={data.week_start}
                    rows={data.rows}
                    dailyTotals={data.daily_totals}
                    grandTotal={data.grand_total_minutes}
                    onCellSave={handleSave}
                />
            )}
        </div>
    );
});
