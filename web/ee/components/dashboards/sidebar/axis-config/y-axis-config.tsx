import { Controller, useFormContext } from "react-hook-form";
// plane imports
import { CHART_WIDGETS_Y_AXIS_METRICS_LIST, EWidgetYAxisMetric } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { TDashboardWidget } from "@plane/types";
// local components
import { WidgetMetricSelect } from "./metric-select";

type Props = {
  handleSubmit: (data: Partial<TDashboardWidget>) => Promise<void>;
};

export const WidgetConfigSidebarYAxisConfig: React.FC<Props> = (props) => {
  const { handleSubmit } = props;
  // translation
  const { t } = useTranslation();
  // form info
  const { control } = useFormContext<TDashboardWidget>();

  return (
    <div className="flex-shrink-0 space-y-1 text-sm">
      <Controller
        control={control}
        name="y_axis_metric"
        render={({ field: { value, onChange } }) => (
          <WidgetMetricSelect
            onChange={(val: EWidgetYAxisMetric) => {
              onChange(val);
              handleSubmit({ y_axis_metric: val });
            }}
            options={CHART_WIDGETS_Y_AXIS_METRICS_LIST}
            placeholder={t("dashboards.widget.common.add_metric")}
            title={t("chart.y_axis")}
            value={value}
          />
        )}
      />
    </div>
  );
};
