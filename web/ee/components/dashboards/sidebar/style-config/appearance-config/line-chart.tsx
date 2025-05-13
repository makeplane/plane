import { Controller, useFormContext } from "react-hook-form";
// plane imports
import { EWidgetChartModels, LINE_CHART_LINE_TYPES } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { TDashboardWidget, TDashboardWidgetConfig } from "@plane/types";
import { ToggleSwitch } from "@plane/ui";
// local components
import { WidgetPropertyWrapper } from "../../property-wrapper";
import { WidgetColorPicker } from "./color-picker";
import { WidgetColorSchemeSelect } from "./color-scheme-select";
import { WidgetLineTypeSelect } from "./line-type-select";

type Props = {
  handleConfigUpdate: (data: Partial<TDashboardWidgetConfig>) => Promise<void>;
};

export const LineChartAppearanceConfig: React.FC<Props> = (props) => {
  const { handleConfigUpdate } = props;
  // translation
  const { t } = useTranslation();
  // form info
  const { control, watch } = useFormContext<TDashboardWidget>();
  // derived values
  const selectedModel = watch("chart_model");

  return (
    <>
      {selectedModel === EWidgetChartModels.BASIC && (
        <Controller
          control={control}
          name="config.line_color"
          render={({ field: { value, onChange } }) => (
            <WidgetColorPicker
              onChange={(val) => {
                onChange(val);
                handleConfigUpdate({ line_color: val });
              }}
              title={t("dashboards.widget.chart_types.line_chart.line_color")}
              value={value}
            />
          )}
        />
      )}
      {selectedModel === EWidgetChartModels.MULTI_LINE && (
        <WidgetColorSchemeSelect handleConfigUpdate={handleConfigUpdate} />
      )}
      <Controller
        control={control}
        name="config.line_type"
        render={({ field: { value, onChange } }) => {
          const selectedColorScheme = LINE_CHART_LINE_TYPES.find((p) => p.key === value);
          return (
            <WidgetLineTypeSelect
              value={selectedColorScheme?.key}
              onChange={(val) => {
                onChange(val);
                handleConfigUpdate({ line_type: val });
              }}
            />
          );
        }}
      />
      <WidgetPropertyWrapper
        title={t("dashboards.widget.common.smoothing")}
        input={
          <Controller
            control={control}
            name="config.smoothing"
            render={({ field: { value, onChange } }) => (
              <div className="px-2">
                <ToggleSwitch
                  value={!!value}
                  onChange={(val) => {
                    onChange(val);
                    handleConfigUpdate({ smoothing: val });
                  }}
                />
              </div>
            )}
          />
        }
      />
      <WidgetPropertyWrapper
        title={t("dashboards.widget.common.markers")}
        input={
          <Controller
            control={control}
            name="config.show_markers"
            render={({ field: { value, onChange } }) => (
              <div className="px-2">
                <ToggleSwitch
                  value={!!value}
                  onChange={(val) => {
                    onChange(val);
                    handleConfigUpdate({ show_markers: val });
                  }}
                />
              </div>
            )}
          />
        }
      />
    </>
  );
};
