import React from "react";
// lucide icons
import { Columns, Grid3x3, Calendar, GanttChart, List } from "lucide-react";
// mobx react lite
import { observer } from "mobx-react-lite";
// mobx store
import { RootStore } from "store/root";
import { TIssueLayouts } from "store/issue-views/issue_filters";
import { useMobxStore } from "lib/mobx/store-provider";

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

  const handleLayoutSelection = (layout: TIssueLayouts) => {
    if (!issueFilterStore.workspaceId) return;
    if (issueFilterStore.issueView === "my_issues") {
      issueStore.getMyIssuesAsync(issueFilterStore.workspaceId, issueFilterStore.issueView, layout);
      return;
    }

    if (!issueFilterStore.projectId) return;
    if (issueFilterStore.issueView === "issues") {
      issueStore.getProjectIssuesAsync(
        issueFilterStore.workspaceId,
        issueFilterStore.projectId,
        issueFilterStore.issueView,
        layout
      );
      return;
    }
    if (issueFilterStore.issueView === "modules" && issueFilterStore.moduleId) {
      issueStore.getIssuesForModulesAsync(
        issueFilterStore.workspaceId,
        issueFilterStore.projectId,
        issueFilterStore.moduleId,
        issueFilterStore.issueView,
        layout
      );
      return;
    }
    if (issueFilterStore.issueView === "cycles" && issueFilterStore.cycleId) {
      issueStore.getIssuesForCyclesAsync(
        issueFilterStore.workspaceId,
        issueFilterStore.projectId,
        issueFilterStore.cycleId,
        issueFilterStore.issueView,
        layout
      );
      return;
    }
    if (issueFilterStore.issueView === "views" && issueFilterStore.viewId) {
      issueStore.getIssuesForViewsAsync(
        issueFilterStore.workspaceId,
        issueFilterStore.projectId,
        issueFilterStore.viewId,
        issueFilterStore.issueView,
        layout
      );
      return;
    }
  };

  return (
    <div className="relative flex items-center p-1 rounded bg-gray-100 gap-[1px]">
      {layoutSelectionFilters.map((_layout) => (
        <div
          key={_layout?.key}
          className={`w-[32px] h-[26px] rounded flex justify-center items-center cursor-pointer transition-all hover:bg-white overflow-hidden group ${
            issueFilterStore?.issueLayout == _layout?.key ? `bg-white shadow shadow-gray-200` : ``
          }}`}
          onClick={() => handleLayoutSelection(_layout?.key)}
        >
          <_layout.icon
            size={15}
            strokeWidth={2}
            className={`${
              issueFilterStore?.issueLayout == _layout?.key
                ? `text-gray-900`
                : `text-gray-700 group-hover:text-gray-900`
            }`}
          />
        </div>
      ))}
    </div>
  );
});
