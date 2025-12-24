import { useMemo } from "react";
import { observer } from "mobx-react";
import type { Control, UseFormSetValue } from "react-hook-form";
import { Controller } from "react-hook-form";
import { SlidersHorizontal } from "lucide-react";
// plane package imports
import { ANALYTICS_X_AXIS_VALUES, ANALYTICS_Y_AXIS_VALUES } from "@plane/constants";
import { CalendarLayoutIcon } from "@plane/propel/icons";
import type { IAnalyticsParams } from "@plane/types";
import { ChartYAxisMetric } from "@plane/types";
import { cn } from "@plane/utils";
// plane web components
import { SelectXAxis } from "./select-x-axis";
import { SelectYAxis } from "./select-y-axis";

type Props = {
  control: Control<IAnalyticsParams, unknown>;
  setValue: UseFormSetValue<IAnalyticsParams>;
  params: IAnalyticsParams;
  workspaceSlug: string;
  classNames?: string;
  isEpic?: boolean;
};

export const AnalyticsSelectParams = observer(function AnalyticsSelectParams(props: Props) {
  const { control, params, classNames, isEpic } = props;
  const xAxisOptions = useMemo(
    () => ANALYTICS_X_AXIS_VALUES.filter((option) => option.value !== params.group_by),
    [params.group_by]
  );
  const groupByOptions = useMemo(
    () => ANALYTICS_X_AXIS_VALUES.filter((option) => option.value !== params.x_axis),
    [params.x_axis]
  );

  return (
    <div className={cn("flex w-full justify-between", classNames)}>
      <div className={`flex items-center gap-2`}>
        <Controller
          name="y_axis"
          control={control}
          render={({ field: { value, onChange } }) => (
            <SelectYAxis
              value={value}
              onChange={(val: ChartYAxisMetric | null) => {
                onChange(val);
              }}
              options={ANALYTICS_Y_AXIS_VALUES}
              hiddenOptions={[
                ChartYAxisMetric.ESTIMATE_POINT_COUNT,
                isEpic ? ChartYAxisMetric.WORK_ITEM_COUNT : ChartYAxisMetric.EPIC_WORK_ITEM_COUNT,
              ]}
            />
          )}
        />
        <Controller
          name="x_axis"
          control={control}
          render={({ field: { value, onChange } }) => (
            <SelectXAxis
              value={value}
              onChange={(val) => {
                onChange(val);
              }}
              label={
                <div className="flex items-center gap-2">
                  <CalendarLayoutIcon className="h-3 w-3" />
                  <span className={cn("text-secondary", value && "text-primary")}>
                    {xAxisOptions.find((v) => v.value === value)?.label || "Add Property"}
                  </span>
                </div>
              }
              options={xAxisOptions}
            />
          )}
        />
        <Controller
          name="group_by"
          control={control}
          render={({ field: { value, onChange } }) => (
            <SelectXAxis
              value={value}
              onChange={(val) => {
                onChange(val);
              }}
              label={
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="h-3 w-3" />
                  <span className={cn("text-secondary", value && "text-primary")}>
                    {groupByOptions.find((v) => v.value === value)?.label || "Add Property"}
                  </span>
                </div>
              }
              options={groupByOptions}
              placeholder="Group By"
              allowNoValue
            />
          )}
        />
      </div>
    </div>
  );
});
