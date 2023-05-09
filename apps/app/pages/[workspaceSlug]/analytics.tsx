import { useState } from "react";

import { useRouter } from "next/router";

import useSWR from "swr";

// react-hook-form
import { Controller, useForm } from "react-hook-form";
// services
import analyticsService from "services/analytics.service";
// hooks
import useWorkspaces from "hooks/use-workspaces";
import useProjects from "hooks/use-projects";
import useToast from "hooks/use-toast";
// layouts
import { WorkspaceAuthorizationLayout } from "layouts/auth-layout";
// ui
import { BarGraph, CustomMenu, CustomSelect, PrimaryButton, SecondaryButton } from "components/ui";
import { BreadcrumbItem, Breadcrumbs } from "components/breadcrumbs";
// icons
import { ArrowPathIcon, ArrowUpTrayIcon, PlusIcon } from "@heroicons/react/24/outline";
// types
import { IAnalyticsParams, IExportAnalyticsFormData } from "types";
// fetch-keys
import { ANALYTICS } from "constants/fetch-keys";
// constants
import { ANALYTICS_X_AXIS_VALUES, ANALYTICS_Y_AXIS_VALUES } from "constants/analytics";
import { CHARTS_THEME, DEFAULT_MARGIN, convertResponseToBarGraphData } from "constants/graph";

const defaultValues: IAnalyticsParams = {
  x_axis: "priority",
  y_axis: "issue_count",
  segment: null,
  project: null,
};

const Analytics = () => {
  const [isExporting, setIsExporting] = useState(false);

  const router = useRouter();
  const { workspaceSlug } = router.query;

  const { activeWorkspace } = useWorkspaces();
  const { projects } = useProjects();

  const { setToastAlert } = useToast();

  const { control, watch, setValue } = useForm<IAnalyticsParams>({ defaultValues });

  const params: IAnalyticsParams = {
    x_axis: watch("x_axis"),
    y_axis: watch("y_axis"),
    segment: watch("segment"),
    project: watch("project"),
  };

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
    watch("segment") === null ? false : true,
    watch("y_axis")
  );

  const generateYAxisTicks = () => {
    if (!analytics) return [];

    const data = barGraphData.data.map((d) => d[yAxisKey] as number);

    const minValue = Math.min(...data);
    const maxValue = Math.max(...data);

    const valueRange = maxValue - minValue;

    let tickInterval = 1;
    if (valueRange > 10) tickInterval = 2;
    if (valueRange > 50) tickInterval = 5;
    if (valueRange > 100) tickInterval = 10;

    const tickValues = [];
    let tickValue = minValue;
    while (tickValue <= maxValue) {
      tickValues.push(tickValue);
      tickValue += tickInterval;
    }

    return tickValues;
  };

  const exportAnalytics = () => {
    if (!workspaceSlug) return;

    setIsExporting(true);

    const data: IExportAnalyticsFormData = {
      x_axis: params.x_axis,
      y_axis: params.y_axis,
    };

    if (params.segment) data.segment = params.segment;
    if (params.project) data.project = [params.project];

    analyticsService
      .exportAnalytics(workspaceSlug.toString(), data)
      .then((res) =>
        setToastAlert({
          type: "success",
          title: "Success!",
          message: res.message,
        })
      )
      .catch(() =>
        setToastAlert({
          type: "error",
          title: "Error!",
          message: "There was some error in exporting the analytics. Please try again.",
        })
      )
      .finally(() => setIsExporting(false));
  };

  return (
    <WorkspaceAuthorizationLayout
      breadcrumbs={
        <Breadcrumbs>
          <BreadcrumbItem title={`${activeWorkspace?.name ?? "Workspace"} Analytics`} />
        </Breadcrumbs>
      }
      right={
        <PrimaryButton
          className="flex items-center gap-2"
          onClick={() => {
            const e = new KeyboardEvent("keydown", { key: "p" });
            document.dispatchEvent(e);
          }}
        >
          <PlusIcon className="h-4 w-4" />
          Add Project
        </PrimaryButton>
      }
    >
      <div className="h-full space-y-8">
        <div className="grid h-full grid-cols-4">
          <div className="col-span-3 h-full">
            {!analyticsError ? (
              analytics && analytics.total > 0 ? (
                <div>
                  <BarGraph
                    data={barGraphData.data}
                    indexBy="name"
                    keys={barGraphData.xAxisKeys}
                    axisLeft={{
                      tickValues: generateYAxisTicks(),
                    }}
                    padding={0.9}
                    margin={{ ...DEFAULT_MARGIN, right: 20 }}
                    theme={{ ...CHARTS_THEME, background: "rgb(var(--color-bg-surface-1))" }}
                  />
                  <div className="m-5 -mt-5">
                    <div className="mt-8 flow-root">
                      <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                        <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                          <table className="min-w-full divide-y divide-brand-base border border-brand-base">
                            <thead className="bg-brand-base">
                              <tr className="divide-x divide-brand-base text-sm text-brand-base">
                                <th scope="col" className="py-3 px-2.5 text-left font-medium">
                                  {
                                    ANALYTICS_X_AXIS_VALUES.find((v) => v.value === params.x_axis)
                                      ?.label
                                  }
                                </th>
                                {params.segment ? (
                                  barGraphData.xAxisKeys.map((key) => (
                                    <th
                                      scope="col"
                                      className="px-2.5 py-2 text-left font-medium capitalize"
                                    >
                                      {key}
                                    </th>
                                  ))
                                ) : (
                                  <th
                                    scope="col"
                                    className="py-3 px-2.5 text-left text-sm font-medium sm:pr-0"
                                  >
                                    {
                                      ANALYTICS_Y_AXIS_VALUES.find((v) => v.value === params.y_axis)
                                        ?.label
                                    }
                                  </th>
                                )}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-brand-base">
                              {barGraphData.data.map((item) => (
                                <tr className="divide-x divide-brand-base text-xs text-brand-secondary">
                                  <td className="whitespace-nowrap py-2 px-2.5 font-medium capitalize">
                                    {item.name}
                                  </td>
                                  {params.segment ? (
                                    barGraphData.xAxisKeys.map((key) => (
                                      <td className="whitespace-nowrap py-2 px-2.5 sm:pr-0">
                                        {item[key] ?? 0}
                                      </td>
                                    ))
                                  ) : (
                                    <td className="whitespace-nowrap py-2 px-2.5 sm:pr-0">
                                      {item[yAxisKey]}
                                    </td>
                                  )}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
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
                  <p className="text-sm">
                    There was some error in fetching the data. Please refresh the page and try
                    again.
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <PrimaryButton onClick={() => router.reload()}>Refresh page</PrimaryButton>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="h-full gap-4 border-l border-brand-base bg-brand-sidebar p-5">
            <div className="sticky top-5 space-y-6">
              <div className="flex items-center justify-between gap-2">
                <h5 className="text-lg font-medium">
                  {analytics?.total ?? 0}{" "}
                  <span className="text-xs font-normal text-brand-secondary">issues</span>
                </h5>
                <CustomMenu ellipsis>
                  <CustomMenu.MenuItem onClick={mutateAnalytics}>
                    <div className="flex items-center gap-2">
                      <ArrowPathIcon className="h-3 w-3" />
                      Refresh
                    </div>
                  </CustomMenu.MenuItem>
                  <CustomMenu.MenuItem onClick={exportAnalytics}>
                    <div className="flex items-center gap-2">
                      <ArrowUpTrayIcon className="h-3 w-3" />
                      {isExporting ? "Exporting..." : "Export analytics as CSV"}
                    </div>
                  </CustomMenu.MenuItem>
                </CustomMenu>
              </div>
              <div className="space-y-4">
                <div>
                  <h6 className="text-xs text-brand-secondary">Measure (y-axis)</h6>
                  <Controller
                    name="y_axis"
                    control={control}
                    render={({ field: { value, onChange } }) => (
                      <CustomSelect
                        value={value}
                        label={
                          <span>
                            {ANALYTICS_Y_AXIS_VALUES.find((v) => v.value === value)?.label ??
                              "None"}
                          </span>
                        }
                        onChange={onChange}
                        width="w-full"
                      >
                        {ANALYTICS_Y_AXIS_VALUES.map((item) => (
                          <CustomSelect.Option key={item.value} value={item.value}>
                            {item.label}
                          </CustomSelect.Option>
                        ))}
                      </CustomSelect>
                    )}
                  />
                </div>
                <div>
                  <h6 className="text-xs text-brand-secondary">Dimension (x-axis)</h6>
                  <Controller
                    name="x_axis"
                    control={control}
                    render={({ field: { value, onChange } }) => (
                      <CustomSelect
                        value={value}
                        label={
                          <span>
                            {ANALYTICS_X_AXIS_VALUES.find((v) => v.value === value)?.label}
                          </span>
                        }
                        onChange={(val: string) => {
                          if (watch("segment") === val) setValue("segment", null);

                          onChange(val);
                        }}
                        width="w-full"
                      >
                        {ANALYTICS_X_AXIS_VALUES.map((item) => (
                          <CustomSelect.Option key={item.value} value={item.value}>
                            {item.label}
                          </CustomSelect.Option>
                        ))}
                      </CustomSelect>
                    )}
                  />
                </div>
                <div>
                  <h6 className="text-xs text-brand-secondary">Segment</h6>
                  <Controller
                    name="segment"
                    control={control}
                    render={({ field: { value, onChange } }) => (
                      <CustomSelect
                        value={value}
                        label={
                          <span>
                            {ANALYTICS_X_AXIS_VALUES.find((v) => v.value === value)?.label ?? (
                              <span className="text-brand-secondary">No value</span>
                            )}
                          </span>
                        }
                        onChange={onChange}
                        width="w-full"
                      >
                        <CustomSelect.Option value={null}>No value</CustomSelect.Option>
                        {ANALYTICS_X_AXIS_VALUES.map((item) => {
                          if (watch("x_axis") === item.value) return null;

                          return (
                            <CustomSelect.Option key={item.value} value={item.value}>
                              {item.label}
                            </CustomSelect.Option>
                          );
                        })}
                      </CustomSelect>
                    )}
                  />
                </div>
                <div>
                  <h6 className="text-xs text-brand-secondary">Project</h6>
                  <Controller
                    name="project"
                    control={control}
                    render={({ field: { value, onChange } }) => (
                      <CustomSelect
                        value={value}
                        label={
                          <span>
                            {projects.find((p) => p.id === value)?.name ?? (
                              <span className="text-brand-secondary">None</span>
                            )}
                          </span>
                        }
                        onChange={onChange}
                        width="w-full"
                      >
                        <CustomSelect.Option value={null}>None</CustomSelect.Option>
                        {projects.map((project) => (
                          <CustomSelect.Option key={project.id} value={project.id}>
                            {project.name}
                          </CustomSelect.Option>
                        ))}
                      </CustomSelect>
                    )}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </WorkspaceAuthorizationLayout>
  );
};

export default Analytics;
