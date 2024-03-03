import React from "react";
import { observer } from "mobx-react-lite";
import { useRouter } from "next/router";
// components
import { BaseSpreadsheetRoot } from "../base-spreadsheet-root";
import { ProjectIssueQuickActions } from "../../quick-action-dropdowns";
// constants
import { EIssuesStoreType } from "constants/issue";

export const ProjectViewSpreadsheetLayout: React.FC = observer(() => {
  // router
  const router = useRouter();
  const { viewId } = router.query;

  return (
    <BaseSpreadsheetRoot
      QuickActions={ProjectIssueQuickActions}
      viewId={viewId?.toString()}
      storeType={EIssuesStoreType.PROJECT_VIEW}
    />
  );
});
