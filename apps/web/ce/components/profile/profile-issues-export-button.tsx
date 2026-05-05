"use client";

import { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import * as XLSX from "xlsx";
import { ALL_ISSUES } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { EIssuesStoreType } from "@plane/types";
import type { TIssue } from "@plane/types";
// hooks
import { useIssues } from "@/hooks/store/use-issues";
import { useLabel } from "@/hooks/store/use-label";
import { useMember } from "@/hooks/store/use-member";
import { useProject } from "@/hooks/store/use-project";
import { useProjectState } from "@/hooks/store/use-project-state";
import { useWorkspace } from "@/hooks/store/use-workspace";

const MAX_FETCH_ITERATIONS = 50;

const formatDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) return "-";
  return dateStr.slice(0, 10);
};

const capitalize = (str: string | null | undefined): string => {
  if (!str) return "-";
  return str.charAt(0).toUpperCase() + str.slice(1);
};

function buildProfileExportRow(
  issue: TIssue,
  stores: {
    workspaceName: string;
    getStateName: (stateId: string | null | undefined) => string;
    getProjectName: (projectId: string | null | undefined) => string;
    getProjectIdentifier: (projectId: string | null | undefined) => string;
    getMemberName: (memberId: string) => string;
    getLabelName: (labelId: string) => string;
  }
): Record<string, string> {
  const identifier = stores.getProjectIdentifier(issue.project_id);
  const id = identifier ? `${identifier}-${issue.sequence_id}` : `#${issue.sequence_id}`;

  return {
    ID: id,
    "Work Item": issue.name ?? "-",
    Department: stores.workspaceName || "-",
    Project: stores.getProjectName(issue.project_id),
    State: stores.getStateName(issue.state_id),
    Priority: capitalize(issue.priority),
    Assignees: issue.assignee_ids?.length ? issue.assignee_ids.map((id) => stores.getMemberName(id)).join(", ") : "-",
    Labels: issue.label_ids?.length ? issue.label_ids.map((id) => stores.getLabelName(id)).join(", ") : "-",
    "Start Date": formatDate(issue.start_date),
    "Due Date": formatDate(issue.target_date),
  };
}

export const ProfileIssuesExportButton = observer(function ProfileIssuesExportButton() {
  const { workspaceSlug, userId } = useParams();
  const { t } = useTranslation();
  const [isExporting, setIsExporting] = useState(false);

  const { issueMap, issues } = useIssues(EIssuesStoreType.PROFILE);
  const { getStateById } = useProjectState();
  const { getProjectById } = useProject();
  const { getLabelById } = useLabel();
  const { workspace: workspaceMember } = useMember();
  const { currentWorkspace } = useWorkspace();

  const handleExport = async () => {
    if (!workspaceSlug || !userId || isExporting) return;
    setIsExporting(true);
    try {
      // Paginate to fetch remaining pages (flat/ungrouped layout only)
      if (issues.groupedIssueIds?.[ALL_ISSUES]) {
        let iterations = 0;
        while (iterations < MAX_FETCH_ITERATIONS) {
          const pagination = issues.getPaginationData(undefined, undefined);
          if (!pagination?.nextPageResults) break;
          await issues.fetchNextIssues(workspaceSlug.toString(), userId.toString());
          iterations++;
        }
      }

      // Collect all issue IDs across all groups (handles both grouped and ungrouped)
      const groupedIds = issues.groupedIssueIds;
      const allIds = groupedIds ? (Object.values(groupedIds).flat() as string[]) : [];
      const uniqueIds = [...new Set(allIds)];
      const issuesToExport = uniqueIds.map((id) => issueMap[id]).filter((i): i is TIssue => !!i);

      const stores = {
        workspaceName: currentWorkspace?.name ?? "",
        getStateName: (stateId: string | null | undefined) => getStateById(stateId)?.name ?? "-",
        getProjectName: (projectId: string | null | undefined) => getProjectById(projectId)?.name ?? "-",
        getProjectIdentifier: (projectId: string | null | undefined) => getProjectById(projectId)?.identifier ?? "",
        getMemberName: (memberId: string) =>
          workspaceMember.getWorkspaceMemberDetails(memberId)?.member?.display_name ?? "-",
        getLabelName: (labelId: string) => getLabelById(labelId)?.name ?? "-",
      };

      const rows = issuesToExport.map((issue) => buildProfileExportRow(issue, stores));
      const currentView = issues.currentView ?? "issues";
      const sheetName = currentView.charAt(0).toUpperCase() + currentView.slice(1);
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
      const date = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(wb, `${currentView}-issues-${date}.xlsx`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      variant="secondary"
      className="py-1"
      onClick={() => void handleExport()}
      loading={isExporting}
      disabled={isExporting}
    >
      {t("export")}
    </Button>
  );
});
