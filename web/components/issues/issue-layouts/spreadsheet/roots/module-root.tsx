import React from "react";
import { observer } from "mobx-react-lite";
import { useRouter } from "next/router";
// components
import { BaseSpreadsheetRoot } from "../base-spreadsheet-root";
import { ModuleIssueQuickActions } from "../../quick-action-dropdowns";
import { EIssuesStoreType } from "constants/issue";

export const ModuleSpreadsheetLayout: React.FC = observer(() => {
  const router = useRouter();
  const { moduleId } = router.query;

  if (!moduleId) return null;

  return (
    <BaseSpreadsheetRoot
      viewId={moduleId.toString()}
      QuickActions={ModuleIssueQuickActions}
      storeType={EIssuesStoreType.MODULE}
    />
  );
});
