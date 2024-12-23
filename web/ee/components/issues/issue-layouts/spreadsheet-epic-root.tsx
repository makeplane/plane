import React from "react";
import { observer } from "mobx-react";
import { BaseSpreadsheetRoot } from "@/components/issues/issue-layouts/spreadsheet/base-spreadsheet-root";
import { ProjectEpicQuickActions } from "@/plane-web/components/epics";

export const EpicSpreadsheetLayout: React.FC = observer(() => (
  <BaseSpreadsheetRoot QuickActions={ProjectEpicQuickActions} isEpic />
));
