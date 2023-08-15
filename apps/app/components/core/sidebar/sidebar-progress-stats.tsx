import React from "react";

// headless ui
import { Tab } from "@headlessui/react";
// hooks
import useLocalStorage from "hooks/use-local-storage";
import useIssuesView from "hooks/use-issues-view";
// components
import { SingleProgressStats } from "components/core";
// ui
import { Avatar } from "components/ui";
// types
import {
  IModule,
  TAssigneesDistribution,
  TCompletionChartDistribution,
  TLabelsDistribution,
} from "types";
// constants
import { STATE_GROUP_COLORS } from "constants/state";
// types
type Props = {
  distribution: {
    assignees: TAssigneesDistribution[];
    completion_chart: TCompletionChartDistribution;
    labels: TLabelsDistribution[];
  };
  groupedIssues: {
    [key: string]: number;
  };
  totalIssues: number;
  module?: IModule;
  roundedTab?: boolean;
  noBackground?: boolean;
};

export const SidebarProgressStats: React.FC<Props> = ({
  distribution,
  groupedIssues,
  totalIssues,
  module,
  roundedTab,
  noBackground,
}) => {
  const { filters, setFilters } = useIssuesView();

  const { storedValue: tab, setValue: setTab } = useLocalStorage("tab", "Assignees");

  const currentValue = (tab: string | null) => {
    switch (tab) {
      case "Assignees":
        return 0;
      case "Labels":
        return 1;
      case "States":
        return 2;

      default:
        return 0;
    }
  };

  return (
    <Tab.Group
      defaultIndex={currentValue(tab)}
      onChange={(i) => {
        switch (i) {
          case 0:
            return setTab("Assignees");
          case 1:
            return setTab("Labels");
          case 2:
            return setTab("States");

          default:
            return setTab("Assignees");
        }
      }}
    >
      <Tab.List
        as="div"
        className={`flex w-full items-center gap-2 justify-between rounded-md ${
          noBackground ? "" : "bg-custom-background-90"
        } px-1 py-1.5 
        ${module ? "text-xs" : "text-sm"} `}
      >
        <Tab
          className={({ selected }) =>
            `w-full  ${
              roundedTab ? "rounded-3xl border border-custom-border-200" : "rounded"
            } px-3 py-1 text-custom-text-100 ${
              selected ? " bg-custom-primary text-white" : "  hover:bg-custom-background-80"
            }`
          }
        >
          Assignees
        </Tab>
        <Tab
          className={({ selected }) =>
            `w-full ${
              roundedTab ? "rounded-3xl border border-custom-border-200" : "rounded"
            } px-3 py-1 text-custom-text-100 ${
              selected ? " bg-custom-primary text-white" : " hover:bg-custom-background-80"
            }`
          }
        >
          Labels
        </Tab>
        <Tab
          className={({ selected }) =>
            `w-full ${
              roundedTab ? "rounded-3xl border border-custom-border-200" : "rounded"
            } px-3 py-1  text-custom-text-100 ${
              selected ? " bg-custom-primary text-white" : " hover:bg-custom-background-80"
            }`
          }
        >
          States
        </Tab>
      </Tab.List>
      <Tab.Panels className="flex w-full items-center justify-between pt-1 text-custom-text-200">
        <Tab.Panel as="div" className="w-full space-y-1">
          {distribution.assignees.map((assignee, index) => {
            if (assignee.assignee_id)
              return (
                <SingleProgressStats
                  key={assignee.assignee_id}
                  title={
                    <div className="flex items-center gap-2">
                      <Avatar
                        user={{
                          id: assignee.assignee_id,
                          avatar: assignee.avatar ?? "",
                          first_name: assignee.first_name ?? "",
                          last_name: assignee.last_name ?? "",
                          display_name: assignee.display_name ?? "",
                        }}
                      />
                      <span>{assignee.display_name}</span>
                    </div>
                  }
                  completed={assignee.completed_issues}
                  total={assignee.total_issues}
                  onClick={() => {
                    if (filters?.assignees?.includes(assignee.assignee_id ?? ""))
                      setFilters({
                        assignees: filters?.assignees?.filter((a) => a !== assignee.assignee_id),
                      });
                    else
                      setFilters({
                        assignees: [...(filters?.assignees ?? []), assignee.assignee_id ?? ""],
                      });
                  }}
                  selected={filters?.assignees?.includes(assignee.assignee_id ?? "")}
                />
              );
            else
              return (
                <SingleProgressStats
                  key={`unassigned-${index}`}
                  title={
                    <div className="flex items-center gap-2">
                      <div className="h-5 w-5 rounded-full border-2 border-custom-border-200 bg-custom-background-80">
                        <img
                          src="/user.png"
                          height="100%"
                          width="100%"
                          className="rounded-full"
                          alt="User"
                        />
                      </div>
                      <span>No assignee</span>
                    </div>
                  }
                  completed={assignee.completed_issues}
                  total={assignee.total_issues}
                />
              );
          })}
        </Tab.Panel>
        <Tab.Panel as="div" className="w-full space-y-1">
          {distribution.labels.map((label, index) => (
            <SingleProgressStats
              key={label.label_id ?? `no-label-${index}`}
              title={
                <div className="flex items-center gap-2">
                  <span
                    className="block h-3 w-3 rounded-full"
                    style={{
                      backgroundColor: label.color ?? "transparent",
                    }}
                  />
                  <span className="text-xs">{label.label_name ?? "No labels"}</span>
                </div>
              }
              completed={label.completed_issues}
              total={label.total_issues}
              onClick={() => {
                if (filters.labels?.includes(label.label_id ?? ""))
                  setFilters({
                    labels: filters?.labels?.filter((l) => l !== label.label_id),
                  });
                else setFilters({ labels: [...(filters?.labels ?? []), label.label_id ?? ""] });
              }}
              selected={filters?.labels?.includes(label.label_id ?? "")}
            />
          ))}
        </Tab.Panel>
        <Tab.Panel as="div" className="w-full space-y-1">
          {Object.keys(groupedIssues).map((group, index) => (
            <SingleProgressStats
              key={index}
              title={
                <div className="flex items-center gap-2">
                  <span
                    className="block h-3 w-3 rounded-full "
                    style={{
                      backgroundColor: STATE_GROUP_COLORS[group],
                    }}
                  />
                  <span className="text-xs capitalize">{group}</span>
                </div>
              }
              completed={groupedIssues[group]}
              total={totalIssues}
            />
          ))}
        </Tab.Panel>
      </Tab.Panels>
    </Tab.Group>
  );
};
