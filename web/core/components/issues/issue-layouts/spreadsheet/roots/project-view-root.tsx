import React from "react";
import { observer } from "mobx-react";
// mobx store
// components
import { ProjectIssueQuickActions } from "../../quick-action-dropdowns";
import { BaseSpreadsheetRoot } from "../base-spreadsheet-root";
// types
// constants

export const ProjectViewSpreadsheetLayout: React.FC = observer(() => (
  <BaseSpreadsheetRoot QuickActions={ProjectIssueQuickActions} />
));
