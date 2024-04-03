import React from "react";
import { observer } from "mobx-react";
// mobx store
import { EIssuesStoreType } from "@/constants/issue";
import { ProjectIssueQuickActions } from "../../quick-action-dropdowns";
import { BaseSpreadsheetRoot } from "../base-spreadsheet-root";

export const ProjectSpreadsheetLayout: React.FC = observer(() => (
  <BaseSpreadsheetRoot QuickActions={ProjectIssueQuickActions} storeType={EIssuesStoreType.PROJECT} />
));
