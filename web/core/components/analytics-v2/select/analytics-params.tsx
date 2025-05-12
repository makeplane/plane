import { useMemo } from "react";
import { observer } from "mobx-react";
import { Control, Controller, UseFormSetValue } from "react-hook-form";
import { Calendar, SlidersHorizontal } from "lucide-react";
// plane package imports
import { ANALYTICS_V2_X_AXIS_VALUES, ANALYTICS_V2_Y_AXIS_VALUES, ChartYAxisMetric } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { IAnalyticsV2Params } from "@plane/types";
import { cn } from "@plane/utils";
// plane web components
import { AnalyticsV2Service } from "@/services/analytics-v2.service";
import { SelectXAxis } from "./select-x-axis";
import { SelectYAxis } from "./select-y-axis";

type Props = {
  control: Control<IAnalyticsV2Params, unknown>;
  setValue: UseFormSetValue<IAnalyticsV2Params>;
  params: IAnalyticsV2Params;
  workspaceSlug: string;
  classNames?: string;
};

export const AnalyticsV2SelectParams: React.FC<Props> = observer((props) => {
  const { control, params, classNames } = props;
  const xAxisOptions = useMemo(
    () => ANALYTICS_V2_X_AXIS_VALUES.filter((option) => option.value !== params.group_by),
    [params.group_by]
  );
  const groupByOptions = useMemo(
    () => ANALYTICS_V2_X_AXIS_VALUES.filter((option) => option.value !== params.x_axis),
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
              options={ANALYTICS_V2_Y_AXIS_VALUES}
              hiddenOptions={[ChartYAxisMetric.ESTIMATE_POINT_COUNT]}
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
                  <Calendar className="h-3 w-3" />
                  <span className={cn("text-custom-text-200", value && "text-custom-text-100")}>
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
                  <span className={cn("text-custom-text-200", value && "text-custom-text-100")}>
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
