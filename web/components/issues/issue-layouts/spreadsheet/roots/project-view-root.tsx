import React from "react";
import { observer } from "mobx-react";
import { useRouter } from "next/router";
// mobx store
import { EIssuesStoreType } from "@/constants/issue";
// components
import { ProjectIssueQuickActions } from "../../quick-action-dropdowns";
import { BaseSpreadsheetRoot } from "../base-spreadsheet-root";
// types
// constants

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
