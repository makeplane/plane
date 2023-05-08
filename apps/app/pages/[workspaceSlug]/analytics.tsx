import { useRouter } from "next/router";

import useSWR from "swr";

// react-hook-form
import { Controller, useForm } from "react-hook-form";
// services
import analyticsService from "services/analytics.service";
// hooks
import useProjects from "hooks/use-projects";
// ui
import { BarGraph, CustomSelect } from "components/ui";
// types
import { IAnalyticsParams } from "types";
// fetch-keys
import { ANALYTICS } from "constants/fetch-keys";
// constants
import { ANALYTICS_X_AXIS_VALUES, ANALYTICS_Y_AXIS_VALUES } from "constants/analytics";
import { convertResponseToBarGraphData } from "constants/graph";

const defaultValues: IAnalyticsParams = {
  x_axis: "priority",
  y_axis: "issue_count",
  segment: null,
  project: null,
};

const Analytics = () => {
  const router = useRouter();
  const { workspaceSlug } = router.query;

  const { projects } = useProjects();

  const { control, watch, setValue } = useForm<IAnalyticsParams>({ defaultValues });

  const params: IAnalyticsParams = {
    x_axis: watch("x_axis"),
    y_axis: watch("y_axis"),
    segment: watch("segment"),
    project: watch("project"),
  };

  const { data: analytics } = useSWR(
    workspaceSlug ? ANALYTICS(workspaceSlug.toString(), params) : null,
    workspaceSlug ? () => analyticsService.getAnalytics(workspaceSlug.toString(), params) : null
  );

  const barGraphData = convertResponseToBarGraphData(
    analytics?.distribution,
    watch("segment") === null ? false : true,
    watch("y_axis")
  );

  return (
    <div className="space-y-8 p-8">
      <div className="grid grid-cols-6 items-center gap-4">
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
                    {ANALYTICS_Y_AXIS_VALUES.find((v) => v.value === value)?.label ?? "None"}
                  </span>
                }
                onChange={onChange}
                width="w-full"
                noChevron
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
                label={<span>{ANALYTICS_X_AXIS_VALUES.find((v) => v.value === value)?.label}</span>}
                onChange={(val: string) => {
                  if (watch("segment") === val) setValue("segment", null);

                  onChange(val);
                }}
                width="w-full"
                noChevron
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
                noChevron
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
                noChevron
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
      <div>
        <BarGraph data={barGraphData.data} indexBy="name" keys={barGraphData.xAxisKeys} />
      </div>
    </div>
  );
};

export default Analytics;
