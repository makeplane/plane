import React from "react";
// lucide icons
import { Columns, Grid3x3, Calendar, GanttChart, List } from "lucide-react";
// mobx react lite
import { observer } from "mobx-react-lite";
// mobx store
import { RootStore } from "store/root";
import { useMobxStore } from "lib/mobx/store-provider";
// types and default data
import { TIssueLayouts } from "store/issue-views/issue_filters";
import { issueFilterVisibilityData } from "store/issue-views/issue_data";

export const LayoutSelection = observer(() => {
  const store: RootStore = useMobxStore();
  const { issueFilters: issueFilterStore, issueView: issueStore } = store;

  const layoutSelectionFilters: { key: TIssueLayouts; title: string; icon: any }[] = [
    {
      key: "list",
      title: "List",
      icon: List,
    },
    {
      key: "kanban",
      title: "Kanban",
      icon: Grid3x3,
    },
    {
      key: "calendar",
      title: "Calendar",
      icon: Calendar,
    },
    {
      key: "spreadsheet",
      title: "Spreadsheet",
      icon: Columns,
    },
    {
      key: "gantt",
      title: "Gantt",
      icon: GanttChart,
    },
  ];

  const handleLayoutSectionVisibility = (layout_key: string) =>
    issueFilterStore?.issueView &&
    issueFilterVisibilityData[
      issueFilterStore?.issueView === "my_issues" ? "my_issues" : "others"
    ].layout.includes(layout_key);

  const handleLayoutSelection = (_layoutKey: string) => {
    issueFilterStore.handleUserFilter("display_filters", "layout", _layoutKey);
  };

  console.log("----");
  console.log("my_user_id", issueFilterStore.myUserId);
  console.log("workspace_id", issueFilterStore.workspaceId);
  console.log("project_id", issueFilterStore.projectId);
  console.log("module_id", issueFilterStore.moduleId);
  console.log("cycle_id", issueFilterStore.cycleId);
  console.log("view_id", issueFilterStore.viewId);

  console.log("issue_view", issueFilterStore.issueView);
  console.log("issue_layout", issueFilterStore.issueLayout);

  console.log("user_filters", issueFilterStore.userFilters);
  console.log("issues", issueStore.issues);
  console.log("issues", issueStore.getIssues);

  console.log("----");

  return (
    <div className="relative flex items-center p-1 rounded gap-1 bg-custom-background-80">
      {layoutSelectionFilters.map(
        (_layout) =>
          handleLayoutSectionVisibility(_layout?.key) && (
            <div
              key={_layout?.key}
              className={`w-[28px] h-[22px] rounded flex justify-center items-center cursor-pointer transition-all hover:bg-custom-background-100 overflow-hidden group ${
                issueFilterStore?.issueLayout == _layout?.key
                  ? `bg-custom-background-100 shadow shadow-gray-200`
                  : ``
              }}`}
              onClick={() => handleLayoutSelection(_layout?.key)}
            >
              <_layout.icon
                size={14}
                strokeWidth={2}
                className={`${
                  issueFilterStore?.issueLayout == _layout?.key
                    ? `text-custom-text-100`
                    : `text-custom-text-100 group-hover:text-custom-text-200`
                }`}
              />
            </div>
          )
      )}
    </div>
  );
});
