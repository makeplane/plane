import { Controller, useFormContext } from "react-hook-form";
// plane imports
import {
  CHART_WIDGETS_Y_AXIS_METRICS_LIST,
  EWidgetChartModels,
  EWidgetChartTypes,
  EWidgetYAxisMetric,
} from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { TDashboardWidget } from "@plane/types";
// local components
import { WidgetMetricSelect } from "./metric-select";
import { WidgetPropertySelect } from "./property-select";

type Props = {
  handleSubmit: (data: Partial<TDashboardWidget>) => Promise<void>;
};

export const WidgetConfigSidebarYAxisConfig: React.FC<Props> = (props) => {
  const { handleSubmit } = props;
  // translation
  const { t } = useTranslation();
  // form info
  const { control, watch } = useFormContext<TDashboardWidget>();
  // derived values
  const selectedChartType = watch("chart_type");
  const selectedChartModel = watch("chart_model");
  const selectedXAxisProperty = watch("x_axis_property");
  const isStackByEnabled =
    selectedChartType === EWidgetChartTypes.BAR_CHART && selectedChartModel === EWidgetChartModels.STACKED;

  return (
    <div className="flex-shrink-0 space-y-1 text-sm">
      <h6 className="font-medium text-custom-text-200">{t("chart.y_axis")}</h6>
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
            title={t("chart.metric")}
            value={value}
          />
        )}
      />
      {isStackByEnabled && (
        <Controller
          control={control}
          name="group_by"
          render={({ field: { value, onChange } }) => (
            <WidgetPropertySelect
              onChange={(val) => {
                onChange(val);
                handleSubmit({ group_by: val });
              }}
              placeholder={t("dashboards.widget.common.add_property")}
              shouldRenderOption={(key) => key !== selectedXAxisProperty}
              title={t("dashboards.widget.common.stack_by")}
              value={value}
            />
          )}
        />
      )}
    </div>
  );
};
