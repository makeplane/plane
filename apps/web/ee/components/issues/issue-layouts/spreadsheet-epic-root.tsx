import React from "react";
import { observer } from "mobx-react";
// components
import { BaseSpreadsheetRoot } from "@/components/issues/issue-layouts/spreadsheet/base-spreadsheet-root";
// plane web imports
import { ProjectEpicQuickActions } from "@/plane-web/components/epics/quick-actions/epic-quick-action";

export const EpicSpreadsheetLayout: React.FC = observer(() => (
  <BaseSpreadsheetRoot QuickActions={ProjectEpicQuickActions} isEpic />
));
