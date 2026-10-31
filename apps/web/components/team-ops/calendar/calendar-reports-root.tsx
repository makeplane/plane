/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useMemo, useState } from "react";
import { observer } from "mobx-react";
import { Button } from "@makeplane/propel/components/button";
import { InputField } from "@makeplane/propel/components/input-field";
import { SelectField } from "@makeplane/propel/components/select-field";
import { setToast } from "@plane/blocks/toast";
import { PLAN_NOTICE, REPORT_TITLES, getReportPeriods, validateReportRange } from "@plane/services";
import type { TReportKind, TReportParams } from "@plane/types";
// hooks
import { useMember } from "@/hooks/store/use-member";
import { useProject } from "@/hooks/store/use-project";
import { useUserProfile } from "@/hooks/store/user";
import {
  downloadReport,
  useCalendarSettings,
  useOpsTeams,
  usePlanSummary,
  usePlannedVsLogged,
} from "@/hooks/team-ops/use-work-calendar";
// local imports
import { getErrorMessage } from "./error-message";
import { ComparisonTable, PlanSummaryTable } from "./report-tables";

type Props = {
  workspaceSlug: string;
};

const ALL = "all";
const CUSTOM = "custom";
const REPORTS: TReportKind[] = ["plan-summary", "planned-vs-logged"];

const REPORT_HELP: Record<TReportKind, string> = {
  "plan-summary":
    "How many days each person planned as onsite, remote, day off or leave, how many were holidays, and how many working days still have no plan.",
  "planned-vs-logged":
    "Planned hours next to the time logged in Time Tracking, and the days where the two disagree. Neither one measures presence.",
};

export const CalendarReportsRoot = observer(function CalendarReportsRoot({ workspaceSlug }: Props) {
  // states
  const [report, setReport] = useState<TReportKind>("plan-summary");
  const [periodKey, setPeriodKey] = useState("this-month");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [teamId, setTeamId] = useState(ALL);
  const [projectId, setProjectId] = useState(ALL);
  const [userId, setUserId] = useState(ALL);
  const [isDownloading, setIsDownloading] = useState(false);
  // hooks
  const { data: userProfile } = useUserProfile();
  const { permissions } = useCalendarSettings(workspaceSlug);
  const { teams } = useOpsTeams(workspaceSlug);
  const { joinedProjectIds, getPartialProjectById } = useProject();
  const { getUserDetails, workspace } = useMember();

  const periods = useMemo(() => getReportPeriods(new Date(), userProfile?.start_of_the_week ?? 1), [userProfile]);
  const period = periods.find((item) => item.key === periodKey);
  const from = period?.from ?? customFrom;
  const to = period?.to ?? customTo;
  const rangeError = validateReportRange(report, from, to);

  const params: TReportParams | null = rangeError
    ? null
    : {
        from,
        to,
        team: teamId === ALL ? undefined : teamId,
        project: projectId === ALL ? undefined : projectId,
        user: userId === ALL ? undefined : userId,
      };
  const summary = usePlanSummary(workspaceSlug, report === "plan-summary" ? params : null);
  const comparison = usePlannedVsLogged(workspaceSlug, report === "planned-vs-logged" ? params : null);
  const error = report === "plan-summary" ? summary.error : comparison.error;
  const isLoading = report === "plan-summary" ? summary.isLoading : comparison.isLoading;

  const canPickPeople = permissions?.can_view_team ?? false;
  const periodOptions = [
    ...periods.map((item) => ({ value: item.key, label: item.label })),
    { value: CUSTOM, label: "Custom range" },
  ];
  const teamOptions = [
    { value: ALL, label: "All teams" },
    ...(teams ?? []).map((item) => ({ value: item.id, label: item.name })),
  ];
  const projectOptions = [
    { value: ALL, label: "All projects" },
    ...joinedProjectIds.map((id) => ({ value: id, label: getPartialProjectById(id)?.name ?? id })),
  ];
  const personOptions = [
    { value: ALL, label: "Everyone" },
    ...(workspace.workspaceMemberIds ?? []).map((id) => ({ value: id, label: getUserDetails(id)?.display_name ?? id })),
  ];

  const handleDownload = async () => {
    if (!params) return;
    setIsDownloading(true);
    try {
      await downloadReport(workspaceSlug, report, params);
    } catch (downloadError) {
      setToast({ type: "error", title: "Could not download the report", message: getErrorMessage(downloadError) });
    } finally {
      setIsDownloading(false);
    }
  };

  if (!permissions) return null;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 p-6">
      <p className="text-caption-sm-regular text-tertiary">{PLAN_NOTICE}</p>

      <div role="group" aria-label="Report" className="flex gap-2">
        {REPORTS.map((item) => (
          <Button
            key={item}
            type="button"
            variant={report === item ? "primary" : "secondary"}
            size="sm"
            stretch="auto"
            label={REPORT_TITLES[item]}
            aria-pressed={report === item}
            onClick={() => setReport(item)}
          />
        ))}
      </div>
      <p className="text-body-sm-regular text-secondary">{REPORT_HELP[report]}</p>

      <div className="flex flex-wrap items-end gap-3">
        <div className="w-44 [&_button]:min-w-0">
          <SelectField
            size="lg"
            label="Period"
            options={periodOptions}
            value={periodKey}
            onValueChange={(value) => setPeriodKey(value ?? "this-month")}
          />
        </div>
        {periodKey === CUSTOM ? (
          <>
            <InputField
              type="date"
              size="lg"
              orientation="vertical"
              label="From"
              value={customFrom}
              onChange={(event) => setCustomFrom(event.target.value)}
            />
            <InputField
              type="date"
              size="lg"
              orientation="vertical"
              label="To"
              value={customTo}
              onChange={(event) => setCustomTo(event.target.value)}
            />
          </>
        ) : null}
        {canPickPeople ? (
          <>
            <div className="w-44 [&_button]:min-w-0">
              <SelectField
                size="lg"
                label="Team"
                options={teamOptions}
                value={teamId}
                onValueChange={(value) => setTeamId(value ?? ALL)}
              />
            </div>
            <div className="w-44 [&_button]:min-w-0">
              <SelectField
                size="lg"
                label="Project"
                options={projectOptions}
                value={projectId}
                onValueChange={(value) => setProjectId(value ?? ALL)}
              />
            </div>
            <div className="w-48 [&_button]:min-w-0">
              <SelectField
                size="lg"
                label="Person"
                options={personOptions}
                value={userId}
                onValueChange={(value) => setUserId(value ?? ALL)}
              />
            </div>
          </>
        ) : null}
        <Button
          variant="secondary"
          size="sm"
          stretch="auto"
          label="Download CSV"
          loading={isDownloading}
          disabled={!params}
          onClick={handleDownload}
        />
      </div>

      {rangeError ? <p className="text-caption-sm-regular text-danger-primary">{rangeError}</p> : null}
      {error ? (
        <p role="alert" className="text-body-sm-medium text-danger-primary">
          The report could not be loaded. Change the period or reload the page.
        </p>
      ) : null}

      <div aria-busy={isLoading} className={isLoading ? "opacity-60 transition-opacity" : "transition-opacity"}>
        {report === "plan-summary" && summary.report ? <PlanSummaryTable report={summary.report} /> : null}
        {report === "planned-vs-logged" && comparison.report ? <ComparisonTable report={comparison.report} /> : null}
      </div>
    </div>
  );
});
