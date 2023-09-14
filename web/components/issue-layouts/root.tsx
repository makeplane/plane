import React from "react";
// components
import { LayoutSelection } from "./layout-selection";
import { IssueDropdown } from "./helpers/dropdown";
import { FilterSelection } from "./filters";
import { DisplayFiltersSelection } from "./display-filters";

import { FilterPreview } from "./filters-preview";

import { IssueListViewRoot } from "./list";
import { IssueKanBanViewRoot } from "./kanban";
import { IssueCalendarViewRoot } from "./calendar";
import { IssueSpreadsheetViewRoot } from "./spreadsheet";
import { IssueGanttViewRoot } from "./gantt";
// mobx
import { observer } from "mobx-react-lite";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
import { RootStore } from "store/root";

export const IssuesRoot = observer(() => {
  const store: RootStore = useMobxStore();
  const { issueFilters: issueFilterStore } = store;

  return (
    <div className="w-full h-full relative flex flex-col overflow-hidden">
      <div className="flex-shrink-0 h-[60px] border-b border-custom-border-80 shadow-sm">
        <div className="w-full h-full p-2 px-5 relative flex justify-between items-center gap-2">
          <div>
            <div>Filter Header</div>
          </div>
          <div className="relative flex items-center gap-2">
            <IssueDropdown title={"Filters"}>
              <FilterSelection />
            </IssueDropdown>
            <IssueDropdown title={"View"}>
              <DisplayFiltersSelection />
            </IssueDropdown>
            <LayoutSelection />
          </div>
        </div>
      </div>
      <div className="flex-shrink-0">
        <FilterPreview />
      </div>
      <div className="w-full h-full relative overflow-hidden">
        {issueFilterStore?.issueLayout === "list" && <IssueListViewRoot />}
        {issueFilterStore?.issueLayout === "kanban" && <IssueKanBanViewRoot />}
        {issueFilterStore?.issueLayout === "calendar" && <IssueCalendarViewRoot />}
        {issueFilterStore?.issueLayout === "spreadsheet" && <IssueSpreadsheetViewRoot />}
        {issueFilterStore?.issueLayout === "gantt_chart" && <IssueGanttViewRoot />}
      </div>
    </div>
  );
});
