import React from "react";
import { observer } from "mobx-react";
import { useRouter } from "next/router";
// mobx store
import { EIssuesStoreType } from "@/constants/issue";
// components
import { ModuleIssueQuickActions } from "../../quick-action-dropdowns";
import { BaseSpreadsheetRoot } from "../base-spreadsheet-root";

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
