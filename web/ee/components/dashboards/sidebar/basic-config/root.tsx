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
  TEXT_WIDGET_Y_AXIS_METRICS_LIST,
  WIDGET_CHART_MODELS_LIST,
} from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { TDashboardWidget, TDashboardWidgetConfig } from "@plane/types";
import { CustomSelect } from "@plane/ui";
// local components
import { WidgetPropertyWrapper } from "../property-wrapper";
import { WidgetConfigSelectButton } from "../select-button";
import { WidgetConfigSidebarChartTypesList } from "./chart-types-list";
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
  const showChartModelSelect =
    !!selectedChartType && ![EWidgetChartTypes.PIE_CHART, EWidgetChartTypes.TEXT].includes(selectedChartType);
  const MODELS_LIST = selectedChartType ? WIDGET_CHART_MODELS_LIST[selectedChartType] : [];

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
    async (value: EWidgetChartTypes) => {
      const chartTypeDefaultDetails = DEFAULT_WIDGET_CHART_TYPE_PAYLOAD[value];
      const defaultModel = chartTypeDefaultDetails.default;
      const updatedConfig = getUpdatedConfig(value, defaultModel);
      // update form values
      setValue("chart_model", defaultModel);
      setValue("group_by", null);
      setValue("config", updatedConfig);
      const payload: Partial<TDashboardWidget> = {
        chart_type: value,
        chart_model: defaultModel,
        group_by: null,
        config: updatedConfig,
      };
      // update y-axis metric
      const yAxisMetric = getValues("y_axis_metric");
      let newYAxisMetric = yAxisMetric;
      if (yAxisMetric) {
        if (value === EWidgetChartTypes.TEXT && !TEXT_WIDGET_Y_AXIS_METRICS_LIST.includes(yAxisMetric)) {
          newYAxisMetric = TEXT_WIDGET_Y_AXIS_METRICS_LIST[0];
        }
        if (value !== EWidgetChartTypes.TEXT && !CHART_WIDGETS_Y_AXIS_METRICS_LIST.includes(yAxisMetric)) {
          newYAxisMetric = CHART_WIDGETS_Y_AXIS_METRICS_LIST[0];
        }
        setValue("y_axis_metric", newYAxisMetric);
        payload.y_axis_metric = newYAxisMetric;
      }
      // make api call
      await handleSubmit(payload);
    },
    [getUpdatedConfig, handleSubmit]
  );

  const handleChartModelChange = useCallback(
    async (value: EWidgetChartModels) => {
      if (!selectedChartType) return;
      const updatedConfig = getUpdatedConfig(selectedChartType, value);
      // update form values
      setValue("config", updatedConfig);
      const payload: Partial<TDashboardWidget> = {
        chart_model: value,
        config: updatedConfig,
      };
      if (value === EWidgetChartModels.BASIC) {
        setValue("group_by", null);
        payload.group_by = null;
      }
      if (selectedChartType === EWidgetChartTypes.DONUT_CHART && value === EWidgetChartModels.PROGRESS) {
        setValue("x_axis_property", EWidgetXAxisProperty.STATE_GROUPS);
        payload.x_axis_property = EWidgetXAxisProperty.STATE_GROUPS;
      }
      await handleSubmit(payload);
    },
    [getUpdatedConfig, handleSubmit, selectedChartType]
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
      <Controller
        control={control}
        name="chart_type"
        render={({ field: { onChange, value } }) => (
          <WidgetConfigSidebarChartTypesList
            onChange={(val) => {
              onChange(val);
              handleChartTypeChange(val);
            }}
            value={value}
          />
        )}
      />
      {showChartModelSelect && (
        <WidgetPropertyWrapper
          title={t("dashboards.widget.common.visualization_type.label")}
          input={
            <Controller
              control={control}
              name="chart_model"
              render={({ field: { value, onChange } }) => (
                <CustomSelect
                  customButton={
                    <WidgetConfigSelectButton
                      placeholder={t("dashboards.widget.common.visualization_type.placeholder")}
                      title={t(MODELS_LIST.find((m) => m.value === value)?.i18n_label ?? "")}
                      value={!!value}
                    />
                  }
                  customButtonClassName="w-full"
                  value={value}
                  onChange={(val: EWidgetChartModels) => {
                    onChange(val);
                    handleChartModelChange(val);
                  }}
                >
                  {MODELS_LIST.map((model) => (
                    <CustomSelect.Option key={model.value} value={model.value}>
                      {t(model.i18n_label)}
                    </CustomSelect.Option>
                  ))}
                </CustomSelect>
              )}
            />
          }
        />
      )}
    </div>
  );
};
