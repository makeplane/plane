import React from "react";
// components
import { LayoutSelection } from "../issues/issue-layouts/filters/header/layout-selection";
import { IssueDropdown } from "../issues/issue-layouts/filters/header/helpers/dropdown";
import { FilterSelection } from "../issues/issue-layouts/filters/header/filters/filters-selection";
import { DisplayFiltersSelection } from "../issues/issue-layouts/filters/header/display-filters";

import { FilterPreview } from "./filters-preview";

import { IssueListViewRoot } from "./list/root";
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
  const {
    workspace: workspaceStore,
    project: projectStore,
    issue: issueStore,
    issueFilter: issueFilterStore,
  }: RootStore = useMobxStore();

  // console.log("---");
  // console.log("--- workspace store");
  // console.log("workspaces", workspaceStore?.workspaces);
  // console.log("workspace id", workspaceStore?.workspaceId);
  // console.log("current workspace", workspaceStore?.currentWorkspace);
  // console.log("workspace by id", workspaceStore?.workspaceById("plane"));
  // console.log("workspace labels", workspaceStore?.workspaceLabels);
  // console.log("workspace label by id", workspaceStore?.workspaceLabelById("1fe1031b-8986-4e6a-86cc-0d2fe3ac272f"));

  // console.log("--- project store");
  // console.log("workspace projects", projectStore?.workspaceProjects);
  // console.log("project id", projectStore?.projectId);
  // console.log("project state by groups", projectStore?.projectStatesByGroups);
  // console.log("project states", projectStore?.projectStates);
  // console.log("project labels", projectStore?.projectLabels);
  // console.log("project members", projectStore?.projectMembers);
  // projectStore?.projectStates &&
  //   console.log("project state by id", projectStore?.projectStateById(projectStore?.projectStates?.[0]?.id));
  // projectStore?.projectLabels &&
  //   console.log("project label by id", projectStore?.projectLabelById(projectStore?.projectLabels?.[0]?.id));
  // projectStore?.projectMembers &&
  //   console.log("project member by id", projectStore?.projectMemberById(projectStore?.projectMembers?.[0]?.id));

  // console.log("--- issue filter store");
  // console.log("issues filters", issueFilterStore?.issueFilters);

  // console.log("--- issue store");
  // console.log("issues", issueStore?.issues);
  // console.log("---");

  return (
    <div className="w-full h-full relative flex flex-col overflow-hidden">
      <div className="flex-shrink-0 h-[60px] border-b border-custom-border-80 shadow-sm">
        <div className="w-full h-full p-2 px-5 relative flex justify-between items-center gap-2">
          <div>
            <div>Filter Header</div>
          </div>
          <div className="relative flex items-center gap-2">
            {/* <IssueDropdown title={"Filters"}>
              <FilterSelection />
            </IssueDropdown>
            <IssueDropdown title={"View"}>
              <DisplayFiltersSelection />
            </IssueDropdown>
            <LayoutSelection /> */}
          </div>
        </div>
      </div>
      <div className="flex-shrink-0">
        <FilterPreview />
      </div>
      <div className="w-full h-full relative overflow-hidden">
        {issueFilterStore?.userDisplayFilters.layout === "list" && <IssueListViewRoot />}
        {issueFilterStore?.userDisplayFilters.layout === "kanban" && <IssueKanBanViewRoot />}
        {issueFilterStore?.userDisplayFilters.layout === "calendar" && <IssueCalendarViewRoot />}
        {issueFilterStore?.userDisplayFilters.layout === "spreadsheet" && <IssueSpreadsheetViewRoot />}
        {issueFilterStore?.userDisplayFilters.layout === "gantt_chart" && <IssueGanttViewRoot />}
      </div>
    </div>
  );
});
