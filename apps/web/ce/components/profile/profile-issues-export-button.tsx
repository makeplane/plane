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
import { useCycle } from "@/hooks/store/use-cycle";
import { useLabel } from "@/hooks/store/use-label";
import { useMember } from "@/hooks/store/use-member";
import { useModule } from "@/hooks/store/use-module";
import { useProject } from "@/hooks/store/use-project";
import { useProjectState } from "@/hooks/store/use-project-state";
import { useWorkspace } from "@/hooks/store/use-workspace";
// utils
import { buildExportRow } from "@/plane-web/components/workspace/views/export-row-builder";

const MAX_FETCH_ITERATIONS = 50;

export const ProfileIssuesExportButton = observer(function ProfileIssuesExportButton() {
  const { workspaceSlug, userId } = useParams();
  const { t } = useTranslation();
  const [isExporting, setIsExporting] = useState(false);

  const { issueMap, issues } = useIssues(EIssuesStoreType.PROFILE);
  const { getStateById } = useProjectState();
  const { getProjectById } = useProject();
  const { getModuleById } = useModule();
  const { getCycleById } = useCycle();
  const { getLabelById } = useLabel();
  const { workspace: workspaceMember, getUserDetails } = useMember();
  const { currentWorkspace } = useWorkspace();

  const handleExport = async () => {
    if (!workspaceSlug || !userId || isExporting) return;
    setIsExporting(true);
    try {
      // Paginate to fetch remaining pages (only works for flat/ungrouped layout)
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

      const rows = issuesToExport.map((issue) =>
        buildExportRow(issue, t, {
          workspaceName: currentWorkspace?.name ?? "",
          getStateById,
          getProjectById,
          getModuleById,
          getCycleById,
          getLabelById,
          getWorkspaceMemberDetails: (id) => workspaceMember.getWorkspaceMemberDetails(id),
          getUserDetails,
        })
      );

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
