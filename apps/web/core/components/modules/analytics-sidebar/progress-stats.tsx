"use client";

import { FC } from "react";
import { observer } from "mobx-react";
import Image from "next/image";
import { Tab } from "@headlessui/react";
import { useTranslation } from "@plane/i18n";
import {
  IIssueFilterOptions,
  IIssueFilters,
  TModuleDistribution,
  TModuleEstimateDistribution,
  TModulePlotType,
  TStateGroups,
} from "@plane/types";
import { Avatar, StateGroupIcon } from "@plane/ui";
import { cn, getFileURL } from "@plane/utils";
// components
import { SingleProgressStats } from "@/components/core";
// helpers
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
  avatar_url: string | undefined;
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
  const { t } = useTranslation();
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
                    <Avatar name={assignee?.title ?? undefined} src={getFileURL(assignee?.avatar_url ?? "")} />
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
                    <span>{t("no_assignee")}</span>
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
          <h6 className="text-base text-custom-text-300">{t("no_assignees_yet")}</h6>
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
                  <div className="flex items-center gap-2 truncate">
                    <div
                      className="h-3 w-3 rounded-full flex-shrink-0"
                      style={{
                        backgroundColor: label.color ?? "transparent",
                      }}
                    />
                    <p className="text-xs text-ellipsis truncate">{label.title ?? "No labels"}</p>
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
    key: "stat-assignees",
    title: "Assignees",
  },
  {
    key: "stat-labels",
    title: "Labels",
  },
  {
    key: "stat-states",
    title: "States",
  },
];

type TModuleProgressStats = {
  moduleId: string;
  plotType: TModulePlotType;
  distribution: TModuleDistribution | TModuleEstimateDistribution | undefined;
  groupedIssues: Record<string, number>;
  totalIssuesCount: number;
  isEditable?: boolean;
  filters?: IIssueFilters | undefined;
  handleFiltersUpdate: (key: keyof IIssueFilterOptions, value: string | string[]) => void;
  size?: "xs" | "sm";
  roundedTab?: boolean;
  noBackground?: boolean;
};

export const ModuleProgressStats: FC<TModuleProgressStats> = observer((props) => {
  const {
    moduleId,
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
  const { storedValue: currentTab, setValue: setModuleTab } = useLocalStorage(
    `module-analytics-tab-${moduleId}`,
    "stat-assignees"
  );
  // derived values
  const currentTabIndex = (tab: string): number => progressStats.findIndex((stat) => stat.key === tab);

  const currentDistribution = distribution as TModuleDistribution;
  const currentEstimateDistribution = distribution as TModuleEstimateDistribution;

  const distributionAssigneeData: TAssigneeData =
    plotType === "burndown"
      ? (currentDistribution?.assignees || []).map((assignee) => ({
          id: assignee?.assignee_id || undefined,
          title: assignee?.display_name || undefined,
          avatar_url: assignee?.avatar_url || undefined,
          completed: assignee.completed_issues,
          total: assignee.total_issues,
        }))
      : (currentEstimateDistribution?.assignees || []).map((assignee) => ({
          id: assignee?.assignee_id || undefined,
          title: assignee?.display_name || undefined,
          avatar_url: assignee?.avatar_url || undefined,
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
              onClick={() => setModuleTab(stat.key)}
            >
              {stat.title}
            </Tab>
          ))}
        </Tab.List>
        <Tab.Panels className="py-3 text-custom-text-200">
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
          <Tab.Panel key={"stat-states"}>
            <StateStatComponent
              distribution={distributionStateData}
              totalIssuesCount={totalIssuesCount}
              isEditable={isEditable}
              handleFiltersUpdate={handleFiltersUpdate}
            />
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
});
