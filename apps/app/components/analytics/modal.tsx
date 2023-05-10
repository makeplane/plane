import React, { useState } from "react";

import { useRouter } from "next/router";

import useSWR from "swr";

// react-hook-form
import { useForm } from "react-hook-form";
// services
import analyticsService from "services/analytics.service";
// components
import {
  AnalyticsGraph,
  AnalyticsSidebar,
  AnalyticsTable,
  CreateUpdateAnalyticsModal,
} from "components/analytics";
// ui
import { BarGraph, LineGraph, PrimaryButton } from "components/ui";
// icons
import { PlayIcon, XMarkIcon } from "@heroicons/react/24/outline";
// types
import { IAnalyticsParams } from "types";
// fetch-keys
import { ANALYTICS, DEFAULT_ANALYTICS } from "constants/fetch-keys";
// constants
import { convertResponseToBarGraphData } from "constants/analytics";
import { Tab } from "@headlessui/react";
import { STATE_GROUP_COLORS } from "constants/state";
import { MONTHS_LIST } from "constants/calendar";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

const defaultValues: IAnalyticsParams = {
  x_axis: "priority",
  y_axis: "issue_count",
  segment: null,
  project: null,
};

const tabsList = ["Scope and Demand", "Custom Analytics"];

export const AnalyticsModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [saveAnalyticsModal, setSaveAnalyticsModal] = useState(false);

  const router = useRouter();
  const { workspaceSlug } = router.query;

  const { control, watch, setValue } = useForm<IAnalyticsParams>({ defaultValues });

  const params: IAnalyticsParams = {
    x_axis: watch("x_axis"),
    y_axis: watch("y_axis"),
    segment: watch("segment"),
    project: watch("project"),
  };

  const handleClose = () => {
    onClose();
  };

  const { data: defaultAnalytics, error: defaultAnalyticsError } = useSWR(
    workspaceSlug ? DEFAULT_ANALYTICS(workspaceSlug.toString(), params) : null,
    workspaceSlug
      ? () => analyticsService.getDefaultAnalytics(workspaceSlug.toString(), params)
      : null
  );

  const {
    data: analytics,
    error: analyticsError,
    mutate: mutateAnalytics,
  } = useSWR(
    workspaceSlug ? ANALYTICS(workspaceSlug.toString(), params) : null,
    workspaceSlug ? () => analyticsService.getAnalytics(workspaceSlug.toString(), params) : null
  );

  const yAxisKey = params.y_axis === "issue_count" ? "count" : "effort";
  const barGraphData = convertResponseToBarGraphData(
    analytics?.distribution,
    watch("segment") ? true : false,
    watch("y_axis")
  );

  return (
    <>
      <CreateUpdateAnalyticsModal
        isOpen={saveAnalyticsModal}
        handleClose={() => setSaveAnalyticsModal(false)}
        params={params}
      />
      <div
        className={`absolute z-20 h-full w-full bg-brand-surface-1 p-2 ${
          isOpen ? "block" : "hidden"
        }`}
      >
        <div className="flex h-full flex-col overflow-hidden rounded-lg border border-brand-base bg-brand-surface-1 text-left">
          <div className="flex items-center justify-between gap-2 border-b border-b-brand-base bg-brand-sidebar p-3 text-sm">
            <h3>Workspace Analytics</h3>
            <div>
              <button
                type="button"
                className="grid place-items-center p-1 text-brand-secondary hover:text-brand-base"
                onClick={handleClose}
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
          <Tab.Group as={React.Fragment}>
            <Tab.List className="space-x-2 border-b border-brand-base px-5 py-3">
              {tabsList.map((tab) => (
                <Tab
                  key={tab}
                  className={({ selected }) =>
                    `rounded-3xl border border-brand-base px-4 py-2 text-xs hover:bg-brand-base ${
                      selected ? "bg-brand-base" : ""
                    }`
                  }
                >
                  {tab}
                </Tab>
              ))}
            </Tab.List>
            <Tab.Panels as={React.Fragment}>
              <Tab.Panel as={React.Fragment}>
                {!defaultAnalyticsError ? (
                  defaultAnalytics ? (
                    <div className="h-full overflow-y-auto p-5 text-sm">
                      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                        <div className="space-y-3 self-start rounded-[10px] border border-brand-base p-3">
                          <h5 className="text-xs text-red-500">DEMAND</h5>
                          <div>
                            <h4 className="text-brand-bas text-base font-medium">
                              Total open tasks
                            </h4>
                            <h3 className="mt-1 text-xl font-semibold">
                              {defaultAnalytics.open_issues}
                            </h3>
                          </div>
                          <div className="space-y-6">
                            {defaultAnalytics.open_issues_classified.map((group) => {
                              const percentage = (
                                (group.state_count / defaultAnalytics.total_issues) *
                                100
                              ).toFixed(0);

                              return (
                                <div key={group.state_group} className="space-y-2">
                                  <div className="flex items-center justify-between gap-2 text-xs">
                                    <div className="flex items-center gap-1">
                                      <span
                                        className="h-2 w-2 rounded-full"
                                        style={{
                                          backgroundColor: STATE_GROUP_COLORS[group.state_group],
                                        }}
                                      />
                                      <h6 className="capitalize">{group.state_group}</h6>
                                      <span className="ml-1 rounded-3xl bg-brand-surface-2 px-2 py-0.5 text-[0.65rem] text-brand-secondary">
                                        {group.state_count}
                                      </span>
                                    </div>
                                    <p className="text-brand-secondary">{percentage}%</p>
                                  </div>
                                  <div className="bar relative h-1 w-full rounded bg-brand-base">
                                    <div
                                      className="absolute top-0 left-0 h-1 rounded duration-300"
                                      style={{
                                        width: `${percentage}%`,
                                        backgroundColor: STATE_GROUP_COLORS[group.state_group],
                                      }}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          <div className="!mt-6 flex w-min items-center gap-2 whitespace-nowrap rounded-md border border-brand-base bg-brand-base p-2 text-xs">
                            <p className="flex items-center gap-1 text-brand-secondary">
                              <PlayIcon className="h-4 w-4 -rotate-90" aria-hidden="true" />
                              <span>Estimate Demand:</span>
                            </p>
                            <p className="font-medium">
                              {defaultAnalytics.open_estimate_sum}/
                              {defaultAnalytics.total_estimate_sum}
                            </p>
                          </div>
                        </div>
                        <div className="rounded-[10px] border border-brand-base">
                          <h5 className="p-3 pb-0 text-xs text-green-500">SCOPE</h5>
                          <div className="divide-y divide-brand-base">
                            <div>
                              <BarGraph
                                data={defaultAnalytics.pending_issue_user}
                                indexBy="assignees__email"
                                keys={["count"]}
                                height="250px"
                                colors={() => `#f97316`}
                                tooltip={(datum) => (
                                  <div className="rounded-md border border-brand-base bg-brand-base p-2 text-xs">
                                    <span className="font-medium text-brand-secondary">
                                      Issue count- {datum.indexValue}:{" "}
                                    </span>
                                    {datum.value}
                                  </div>
                                )}
                                axisBottom={{
                                  tickValues: [],
                                }}
                              />
                            </div>
                            <div className="grid grid-cols-1 divide-y divide-brand-base sm:grid-cols-2 sm:divide-x">
                              <div className="p-3">
                                <h6 className="text-base font-medium">Most issues created</h6>
                                <div className="mt-3 space-y-3">
                                  {defaultAnalytics.most_issue_created_user.map((user) => (
                                    <div
                                      key={user.created_by__email}
                                      className="flex items-start justify-between gap-4 text-xs"
                                    >
                                      <span className="break-all text-brand-secondary">
                                        {user.created_by__email}
                                      </span>
                                      <span className="flex-shrink-0">{user.count}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <div className="p-3">
                                <h6 className="text-base font-medium">Most issues closed</h6>
                                <div className="mt-3 space-y-3">
                                  {defaultAnalytics.most_issue_closed_user.map((user) => (
                                    <div
                                      key={user.assignees__email}
                                      className="flex items-start justify-between gap-4 text-xs"
                                    >
                                      <span className="break-all text-brand-secondary">
                                        {user.assignees__email}
                                      </span>
                                      <span className="flex-shrink-0">{user.count}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                            <div className="py-3">
                              <h1 className="px-3 text-base font-medium">
                                Issues closed in a year
                              </h1>
                              <LineGraph
                                data={[
                                  {
                                    id: "issues_closed",
                                    color: "rgb(var(--color-accent))",
                                    data: MONTHS_LIST.map((month) => ({
                                      x: month.label.substring(0, 3),
                                      y:
                                        defaultAnalytics.issue_completed_month_wise.find(
                                          (data) => data.month === month.value
                                        )?.count || 0,
                                    })),
                                  },
                                ]}
                                colors={(datum) => datum.color}
                                curve="monotoneX"
                                enableArea
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid h-full place-items-center p-5">
                      <div className="space-y-4 text-brand-secondary">
                        <p className="text-sm">Loading analytics...</p>
                      </div>
                    </div>
                  )
                ) : (
                  <div className="grid h-full place-items-center p-5">
                    <div className="space-y-4 text-brand-secondary">
                      <p className="text-sm">
                        There was some error in fetching the data. Please refresh the page and try
                        again.
                      </p>
                      <div className="flex items-center justify-center gap-2">
                        <PrimaryButton onClick={mutateAnalytics}>Refresh page</PrimaryButton>
                      </div>
                    </div>
                  </div>
                )}
              </Tab.Panel>
              <Tab.Panel as={React.Fragment}>
                <div className="grid h-full grid-cols-4 overflow-y-auto">
                  <div className="col-span-3">
                    {!analyticsError ? (
                      analytics ? (
                        analytics.total > 0 ? (
                          <>
                            <AnalyticsGraph
                              analytics={analytics}
                              barGraphData={barGraphData}
                              params={params}
                              yAxisKey={yAxisKey}
                            />
                            <div className="m-5 mt-0">
                              <AnalyticsTable
                                analytics={analytics}
                                barGraphData={barGraphData}
                                params={params}
                                yAxisKey={yAxisKey}
                              />
                            </div>
                          </>
                        ) : (
                          <div className="grid h-full place-items-center p-5">
                            <div className="space-y-4 text-brand-secondary">
                              <p className="text-sm">
                                No matching issues found. Try changing the parameters.
                              </p>
                            </div>
                          </div>
                        )
                      ) : (
                        <div className="grid h-full place-items-center p-5">
                          <div className="space-y-4 text-brand-secondary">
                            <p className="text-sm">Loading analytics...</p>
                          </div>
                        </div>
                      )
                    ) : (
                      <div className="grid h-full place-items-center p-5">
                        <div className="space-y-4 text-brand-secondary">
                          <p className="text-sm">There was some error in fetching the data.</p>
                          <div className="flex items-center justify-center gap-2">
                            <PrimaryButton onClick={mutateAnalytics}>Refresh</PrimaryButton>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="h-full">
                    <AnalyticsSidebar
                      analytics={analytics}
                      params={params}
                      control={control}
                      setValue={setValue}
                      setSaveAnalyticsModal={setSaveAnalyticsModal}
                    />
                  </div>
                </div>
              </Tab.Panel>
            </Tab.Panels>
          </Tab.Group>
        </div>
      </div>
    </>
  );
};
