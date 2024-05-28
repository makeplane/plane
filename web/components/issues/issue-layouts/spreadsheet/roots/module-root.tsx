import React from "react";
import { observer } from "mobx-react";
import { useRouter } from "next/router";
// mobx store
// components
import { ModuleIssueQuickActions } from "../../quick-action-dropdowns";
import { BaseSpreadsheetRoot } from "../base-spreadsheet-root";

export const ModuleSpreadsheetLayout: React.FC = observer(() => {
  const router = useRouter();
  const { moduleId } = router.query;

  return <BaseSpreadsheetRoot QuickActions={ModuleIssueQuickActions} viewId={moduleId?.toString()} />;
});
