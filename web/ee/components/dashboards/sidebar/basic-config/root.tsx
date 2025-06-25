import { useCallback, useEffect } from "react";
import debounce from "lodash/debounce";
import { Controller, useFormContext } from "react-hook-form";
// plane imports
import {
  CHART_WIDGETS_Y_AXIS_METRICS_LIST,
  DEFAULT_WIDGET_CHART_TYPE_PAYLOAD,
  EWidgetChartModels,
  EWidgetChartTypes,
  EWidgetXAxisProperty,
  NUMBER_WIDGET_Y_AXIS_METRICS_LIST,
} from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { TDashboardWidget, TDashboardWidgetConfig } from "@plane/types";
// local components
import { WidgetChartTypeIcon } from "../../widgets";
import { DashboardWidgetChartTypesDropdown } from "../../widgets/dropdown";
import { WidgetPropertyWrapper } from "../property-wrapper";
import { WidgetConfigSidebarTitle } from "./title";

type Props = {
  handleSubmit: (data: Partial<TDashboardWidget>) => Promise<void>;
};

export const WidgetConfigSidebarBasicConfig: React.FC<Props> = (props) => {
  const { handleSubmit } = props;
  // translation
  const { t } = useTranslation();
  // form info
  const { control, getValues, setValue, watch } = useFormContext<TDashboardWidget>();
  // derived values
  const selectedChartType = watch("chart_type");
  const selectedChartModel = watch("chart_model");
  const selectedTypeLabel = t(
    `dashboards.widget.chart_types.${selectedChartType?.toLowerCase()}.chart_models.${selectedChartModel?.toLowerCase()}.long_label`
  );

  // update other form values to the default ones when chart type changes
  const getUpdatedConfig = useCallback(
    (chartType: EWidgetChartTypes, chartModel: EWidgetChartModels) => {
      const chartTypeDefaultDetails = DEFAULT_WIDGET_CHART_TYPE_PAYLOAD[chartType];
      const defaultModelPayload = chartTypeDefaultDetails[chartModel];
      if (!defaultModelPayload) return;
      const currentConfig = getValues("config") ?? {};
      defaultModelPayload.config = {
        ...chartTypeDefaultDetails.config,
        ...defaultModelPayload.config,
      };
      const defaultConfig = defaultModelPayload.config;
      const updatedConfig = Object.keys(defaultConfig).reduce<Partial<TDashboardWidgetConfig>>(
        (acc, key) => {
          const configKey = key as keyof TDashboardWidgetConfig;
          if (!acc) acc = {};
          acc[configKey] = configKey in currentConfig ? currentConfig[configKey] : defaultConfig[configKey];
          return acc;
        },
        { ...defaultConfig }
      );
      return updatedConfig;
    },
    [getValues]
  );

  const handleChartTypeChange = useCallback(
    async (chartType: EWidgetChartTypes, chartModel: EWidgetChartModels) => {
      const updatedConfig = getUpdatedConfig(chartType, chartModel);
      // update form values
      const payload: Partial<TDashboardWidget> = {
        chart_type: chartType,
        chart_model: chartModel,
        config: updatedConfig,
      };
      // update y-axis metric
      const yAxisMetric = getValues("y_axis_metric");
      let newYAxisMetric = yAxisMetric;
      if (yAxisMetric) {
        if (chartType === EWidgetChartTypes.NUMBER && !NUMBER_WIDGET_Y_AXIS_METRICS_LIST.includes(yAxisMetric)) {
          newYAxisMetric = NUMBER_WIDGET_Y_AXIS_METRICS_LIST[0];
        }
        if (chartType !== EWidgetChartTypes.NUMBER && !CHART_WIDGETS_Y_AXIS_METRICS_LIST.includes(yAxisMetric)) {
          newYAxisMetric = CHART_WIDGETS_Y_AXIS_METRICS_LIST[0];
        }
        payload.y_axis_metric = newYAxisMetric;
      }
      if (chartModel === EWidgetChartModels.BASIC) {
        payload.group_by = null;
      }
      if (chartType === EWidgetChartTypes.DONUT_CHART && chartModel === EWidgetChartModels.PROGRESS) {
        payload.x_axis_property = EWidgetXAxisProperty.STATE_GROUPS;
      }
      Object.keys(payload).forEach((key) => {
        const payloadKey = key as keyof typeof payload;
        setValue(payloadKey, payloadKey);
      });
      // make api call
      await handleSubmit(payload);
    },
    [getUpdatedConfig, handleSubmit]
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedHandleSubmit = useCallback(
    debounce((data: Partial<TDashboardWidget>) => {
      handleSubmit(data);
    }, 500),
    [handleSubmit]
  );

  // Clean up the debounced function on unmount
  useEffect(
    () => () => {
      debouncedHandleSubmit.cancel();
    },
    [debouncedHandleSubmit]
  );

  return (
    <div className="flex-shrink-0 space-y-3 text-sm">
      <Controller
        control={control}
        name="name"
        render={({ field: { onChange, value } }) => (
          <WidgetConfigSidebarTitle
            onChange={(val) => {
              onChange(val);
              if (!val || val.trim().length === 0) return;
              debouncedHandleSubmit({ name: val });
            }}
            value={value}
          />
        )}
      />
      <WidgetPropertyWrapper
        title={t("dashboards.widget.common.widget_type")}
        input={
          <DashboardWidgetChartTypesDropdown
            buttonClassName="py-0"
            buttonContent={
              <>
                {selectedChartModel && selectedChartType && (
                  <span className="flex-shrink-0 h-6 aspect-square bg-custom-background-80 rounded grid place-items-center">
                    <WidgetChartTypeIcon
                      chartModel={selectedChartModel}
                      chartType={selectedChartType}
                      className="size-4 text-custom-text-300"
                    />
                  </span>
                )}
                {selectedTypeLabel}
              </>
            }
            onSelect={(val) => {
              handleChartTypeChange(val.chartType, val.chartModel);
            }}
            placement="bottom-end"
            selectedChartModel={selectedChartModel}
            selectedChartType={selectedChartType}
          />
        }
      />
    </div>
  );
};
