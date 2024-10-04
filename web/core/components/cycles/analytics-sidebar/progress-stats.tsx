"use client";

import { FC } from "react";
import { observer } from "mobx-react";
import Image from "next/image";
import { Tab } from "@headlessui/react";
import {
  IIssueFilterOptions,
  IIssueFilters,
  TCycleDistribution,
  TCycleEstimateDistribution,
  TCyclePlotType,
  TStateGroups,
} from "@plane/types";
import { Avatar, StateGroupIcon } from "@plane/ui";
// components
import { SingleProgressStats } from "@/components/core";
// helpers
import { cn } from "@/helpers/common.helper";
// hooks
import { useProjectState } from "@/hooks/store";
import useLocalStorage from "@/hooks/use-local-storage";
// public
import emptyLabel from "@/public/empty-state/empty_label.svg";
import emptyMembers from "@/public/empty-state/empty_members.svg";

// assignee types
type TAssigneeData = {
  id: string | undefined;
  title: string | undefined;
  avatar: string | undefined;
  completed: number;
  total: number;
}[];

type TAssigneeStatComponent = {
  distribution: TAssigneeData;
  isEditable?: boolean;
  filters?: IIssueFilters | undefined;
  handleFiltersUpdate: (key: keyof IIssueFilterOptions, value: string | string[]) => void;
};

// labelTypes
type TLabelData = {
  id: string | undefined;
  title: string | undefined;
  color: string | undefined;
  completed: number;
  total: number;
}[];

type TLabelStatComponent = {
  distribution: TLabelData;
  isEditable?: boolean;
  filters?: IIssueFilters | undefined;
  handleFiltersUpdate: (key: keyof IIssueFilterOptions, value: string | string[]) => void;
};

// stateTypes
type TStateData = {
  state: string | undefined;
  completed: number;
  total: number;
}[];

type TStateStatComponent = {
  distribution: TStateData;
  totalIssuesCount: number;
  isEditable?: boolean;
  handleFiltersUpdate: (key: keyof IIssueFilterOptions, value: string | string[]) => void;
};

export const AssigneeStatComponent = observer((props: TAssigneeStatComponent) => {
  const { distribution, isEditable, filters, handleFiltersUpdate } = props;
  return (
    <div>
      {distribution && distribution.length > 0 ? (
        distribution.map((assignee, index) => {
          if (assignee?.id)
            return (
              <SingleProgressStats
                key={assignee?.id}
                title={
                  <div className="flex items-center gap-2">
                    <Avatar name={assignee?.title ?? undefined} src={assignee?.avatar ?? undefined} />
                    <span>{assignee?.title ?? ""}</span>
                  </div>
                }
                completed={assignee?.completed ?? 0}
                total={assignee?.total ?? 0}
                {...(isEditable && {
                  onClick: () => handleFiltersUpdate("assignees", assignee.id ?? ""),
                  selected: filters?.filters?.assignees?.includes(assignee.id ?? ""),
                })}
              />
            );
          else
            return (
              <SingleProgressStats
                key={`unassigned-${index}`}
                title={
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded-full border-2 border-custom-border-200 bg-custom-background-80">
                      <img src="/user.png" height="100%" width="100%" className="rounded-full" alt="User" />
                    </div>
                    <span>No assignee</span>
                  </div>
                }
                completed={assignee?.completed ?? 0}
                total={assignee?.total ?? 0}
              />
            );
        })
      ) : (
        <div className="flex h-full flex-col items-center justify-center gap-2">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-custom-background-80">
            <Image src={emptyMembers} className="h-12 w-12" alt="empty members" />
          </div>
          <h6 className="text-base text-custom-text-300">No assignees yet</h6>
        </div>
      )}
    </div>
  );
});

export const LabelStatComponent = observer((props: TLabelStatComponent) => {
  const { distribution, isEditable, filters, handleFiltersUpdate } = props;
  return (
    <div>
      {distribution && distribution.length > 0 ? (
        distribution.map((label, index) => {
          if (label.id) {
            return (
              <SingleProgressStats
                key={label.id}
                title={
                  <div className="flex items-center gap-2">
                    <span
                      className="block h-3 w-3 rounded-full"
                      style={{
                        backgroundColor: label.color ?? "transparent",
                      }}
                    />
                    <span className="text-xs">{label.title ?? "No labels"}</span>
                  </div>
                }
                completed={label.completed}
                total={label.total}
                {...(isEditable && {
                  onClick: () => handleFiltersUpdate("labels", label.id ?? ""),
                  selected: filters?.filters?.labels?.includes(label.id ?? `no-label-${index}`),
                })}
              />
            );
          } else {
            return (
              <SingleProgressStats
                key={`no-label-${index}`}
                title={
                  <div className="flex items-center gap-2">
                    <span
                      className="block h-3 w-3 rounded-full"
                      style={{
                        backgroundColor: label.color ?? "transparent",
                      }}
                    />
                    <span className="text-xs">{label.title ?? "No labels"}</span>
                  </div>
                }
                completed={label.completed}
                total={label.total}
              />
            );
          }
        })
      ) : (
        <div className="flex h-full flex-col items-center justify-center gap-2">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-custom-background-80">
            <Image src={emptyLabel} className="h-12 w-12" alt="empty label" />
          </div>
          <h6 className="text-base text-custom-text-300">No labels yet</h6>
        </div>
      )}
    </div>
  );
});

export const StateStatComponent = observer((props: TStateStatComponent) => {
  const { distribution, isEditable, totalIssuesCount, handleFiltersUpdate } = props;
  // hooks
  const { groupedProjectStates } = useProjectState();
  // derived values
  const getStateGroupState = (stateGroup: string) => {
    const stateGroupStates = groupedProjectStates?.[stateGroup];
    const stateGroupStatesId = stateGroupStates?.map((state) => state.id);
    return stateGroupStatesId;
  };

  return (
    <div>
      {distribution.map((group, index) => (
        <SingleProgressStats
          key={index}
          title={
            <div className="flex items-center gap-2">
              <StateGroupIcon stateGroup={group.state as TStateGroups} />
              <span className="text-xs capitalize">{group.state}</span>
            </div>
          }
          completed={group.completed}
          total={totalIssuesCount}
          {...(isEditable && {
            onClick: () => group.state && handleFiltersUpdate("state", getStateGroupState(group.state) ?? []),
          })}
        />
      ))}
    </div>
  );
});

const progressStats = [
  {
    key: "stat-states",
    title: "States",
  },
  {
    key: "stat-assignees",
    title: "Assignees",
  },
  {
    key: "stat-labels",
    title: "Labels",
  },
];

type TCycleProgressStats = {
  cycleId: string;
  plotType: TCyclePlotType;
  distribution: TCycleDistribution | TCycleEstimateDistribution | undefined;
  groupedIssues: Record<string, number>;
  totalIssuesCount: number;
  isEditable?: boolean;
  filters?: IIssueFilters | undefined;
  handleFiltersUpdate: (key: keyof IIssueFilterOptions, value: string | string[]) => void;
  size?: "xs" | "sm";
  roundedTab?: boolean;
  noBackground?: boolean;
};

export const CycleProgressStats: FC<TCycleProgressStats> = observer((props) => {
  const {
    cycleId,
    plotType,
    distribution,
    groupedIssues,
    totalIssuesCount,
    isEditable = false,
    filters,
    handleFiltersUpdate,
    size = "sm",
    roundedTab = false,
    noBackground = false,
  } = props;
  // hooks
  const { storedValue: currentTab, setValue: setCycleTab } = useLocalStorage(
    `cycle-analytics-tab-${cycleId}`,
    "stat-assignees"
  );
  // derived values
  const currentTabIndex = (tab: string): number => progressStats.findIndex((stat) => stat.key === tab);

  const currentDistribution = distribution as TCycleDistribution;
  const currentEstimateDistribution = distribution as TCycleEstimateDistribution;

  const distributionAssigneeData: TAssigneeData =
    plotType === "burndown"
      ? (currentDistribution?.assignees || []).map((assignee) => ({
          id: assignee?.assignee_id || undefined,
          title: assignee?.display_name || undefined,
          avatar: assignee?.avatar || undefined,
          completed: assignee.completed_issues,
          total: assignee.total_issues,
        }))
      : (currentEstimateDistribution?.assignees || []).map((assignee) => ({
          id: assignee?.assignee_id || undefined,
          title: assignee?.display_name || undefined,
          avatar: assignee?.avatar || undefined,
          completed: assignee.completed_estimates,
          total: assignee.total_estimates,
        }));

  const distributionLabelData: TLabelData =
    plotType === "burndown"
      ? (currentDistribution?.labels || []).map((label) => ({
          id: label?.label_id || undefined,
          title: label?.label_name || undefined,
          color: label?.color || undefined,
          completed: label.completed_issues,
          total: label.total_issues,
        }))
      : (currentEstimateDistribution?.labels || []).map((label) => ({
          id: label?.label_id || undefined,
          title: label?.label_name || undefined,
          color: label?.color || undefined,
          completed: label.completed_estimates,
          total: label.total_estimates,
        }));

  const distributionStateData: TStateData = Object.keys(groupedIssues || {}).map((state) => ({
    state: state,
    completed: groupedIssues?.[state] || 0,
    total: totalIssuesCount || 0,
  }));

  return (
    <div>
      <Tab.Group defaultIndex={currentTabIndex(currentTab ? currentTab : "stat-assignees")}>
        <Tab.List
          as="div"
          className={cn(
            `flex w-full items-center justify-between gap-2 rounded-md p-1`,
            roundedTab ? `rounded-3xl` : `rounded-md`,
            noBackground ? `` : `bg-custom-background-90`,
            size === "xs" ? `text-xs` : `text-sm`
          )}
        >
          {progressStats.map((stat) => (
            <Tab
              className={cn(
                `p-1 w-full text-custom-text-100 outline-none focus:outline-none cursor-pointer transition-all`,
                roundedTab ? `rounded-3xl border border-custom-border-200` : `rounded`,
                stat.key === currentTab
                  ? "bg-custom-background-100 text-custom-text-300"
                  : "text-custom-text-400 hover:text-custom-text-300"
              )}
              key={stat.key}
              onClick={() => setCycleTab(stat.key)}
            >
              {stat.title}
            </Tab>
          ))}
        </Tab.List>
        <Tab.Panels className="py-3 text-custom-text-200">
          <Tab.Panel key={"stat-states"}>
            <StateStatComponent
              distribution={distributionStateData}
              totalIssuesCount={totalIssuesCount}
              isEditable={isEditable}
              handleFiltersUpdate={handleFiltersUpdate}
            />
          </Tab.Panel>
          <Tab.Panel key={"stat-assignees"}>
            <AssigneeStatComponent
              distribution={distributionAssigneeData}
              isEditable={isEditable}
              filters={filters}
              handleFiltersUpdate={handleFiltersUpdate}
            />
          </Tab.Panel>
          <Tab.Panel key={"stat-labels"}>
            <LabelStatComponent
              distribution={distributionLabelData}
              isEditable={isEditable}
              filters={filters}
              handleFiltersUpdate={handleFiltersUpdate}
            />
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
});
