import React from "react";
import { observer } from "mobx-react-lite";

import { BaseSpreadsheetRoot } from "../base-spreadsheet-root";
import { ProjectIssueQuickActions } from "../../quick-action-dropdowns";
import { EIssuesStoreType } from "constants/issue";

export const ProjectSpreadsheetLayout: React.FC = observer(() => (
  <BaseSpreadsheetRoot QuickActions={ProjectIssueQuickActions} storeType={EIssuesStoreType.PROJECT} />
));
