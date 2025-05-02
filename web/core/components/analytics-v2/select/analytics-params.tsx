import { observer } from "mobx-react";
import { Control, Controller, UseFormSetValue, useWatch } from "react-hook-form";
// plane imports
import { ANALYTICS_V2_X_AXIS_VALUES, ANALYTICS_V2_Y_AXIS_VALUES, ChartYAxisMetric } from "@plane/constants";
import { IAnalyticsV2Params } from "@plane/types";
import { Button, Row, setToast, TOAST_TYPE } from "@plane/ui";
// components
import { SelectXAxis } from "./select-x-axis";
import { SelectYAxis } from "./select-y-axis";
import { useMemo } from "react";
import { Download } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { AnalyticsV2Service } from "@/services/analytics-v2.service";
// hooks

type Props = {
  control: Control<IAnalyticsV2Params, any>;
  setValue: UseFormSetValue<IAnalyticsV2Params>;
  params: IAnalyticsV2Params;
  workspaceSlug: string;
};

const analyticsV2Service = new AnalyticsV2Service()

export const AnalyticsV2SelectParams: React.FC<Props> = observer((props) => {
  const { control, setValue, params, workspaceSlug } = props;
  const { t } = useTranslation();
  const xAxisOptions = useMemo(() => ANALYTICS_V2_X_AXIS_VALUES.filter((option) => option.value !== params.group_by), [params.group_by]);
  const groupByOptions = useMemo(() => ANALYTICS_V2_X_AXIS_VALUES.filter((option) => option.value !== params.x_axis), [params.x_axis]);

  const exportAnalytics = () => {
    analyticsV2Service
      .exportAnalytics(workspaceSlug, params)
      .then((res) => {
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Success!",
          message: res.message,
        });
      })
      .catch(() =>
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: "There was some error in exporting the analytics. Please try again.",
        })
      );
  };
  return (
    <div className="flex  justify-between w-full">
      <Row
        className={`flex items-center gap-3`}
      >
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
              options={groupByOptions}
              placeholder="Group By"
              allowNoValue
            />
          )}
        />
      </Row>
      <Button variant="accent-primary" prependIcon={<Download className="h-3.5 w-3.5" />} onClick={exportAnalytics}>
        <div>{t("exporter.csv.short_description")}</div>
      </Button>
    </div>

  );
});
