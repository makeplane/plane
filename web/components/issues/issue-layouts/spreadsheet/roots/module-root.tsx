import React from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// mobx store
import { EIssuesStoreType } from "@/constants/issue";
// components
import { ModuleIssueQuickActions } from "../../quick-action-dropdowns";
import { BaseSpreadsheetRoot } from "../base-spreadsheet-root";

export const ModuleSpreadsheetLayout: React.FC = observer(() => {
  const { moduleId } = useParams();

  if (!moduleId) return null;

  return (
    <BaseSpreadsheetRoot
      viewId={moduleId.toString()}
      QuickActions={ModuleIssueQuickActions}
      storeType={EIssuesStoreType.MODULE}
    />
  );
});
