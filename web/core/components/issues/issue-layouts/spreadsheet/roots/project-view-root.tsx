import React from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// mobx store
// components
import { ProjectIssueQuickActions } from "../../quick-action-dropdowns";
import { BaseSpreadsheetRoot } from "../base-spreadsheet-root";
// types
// constants

export const ProjectViewSpreadsheetLayout: React.FC = observer(() => {
  const { viewId } = useParams();

  return <BaseSpreadsheetRoot QuickActions={ProjectIssueQuickActions} viewId={viewId.toString()} />;
});
