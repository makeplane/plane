import { Controller, useFormContext } from "react-hook-form";
// plane imports
import { useTranslation } from "@plane/i18n";
import { EWidgetChartModels, TDashboardWidget, TDashboardWidgetConfig } from "@plane/types";
import { ToggleSwitch } from "@plane/ui";
// local components
import { WidgetPropertyWrapper } from "../../property-wrapper";
import { WidgetColorPicker } from "./color-picker";
import { WidgetColorSchemeSelect } from "./color-scheme-select";

type Props = {
  handleConfigUpdate: (data: Partial<TDashboardWidgetConfig>) => Promise<void>;
};

export const DonutChartAppearanceConfig: React.FC<Props> = (props) => {
  const { handleConfigUpdate } = props;
  // translation
  const { t } = useTranslation();
  // form info
  const { control, watch } = useFormContext<TDashboardWidget>();
  // derived values
  const selectedModel = watch("chart_model");

  return (
    <>
      {selectedModel === EWidgetChartModels.PROGRESS && (
        <Controller
          control={control}
          name="config.completed_color"
          render={({ field: { onChange, value } }) => (
            <WidgetColorPicker
              title={t("dashboards.widget.chart_types.donut_chart.completed_color")}
              onChange={(val) => {
                onChange(val);
                handleConfigUpdate({ completed_color: val });
              }}
              value={value}
            />
          )}
        />
      )}
      {selectedModel === EWidgetChartModels.BASIC && (
        <WidgetColorSchemeSelect handleConfigUpdate={handleConfigUpdate} />
      )}
      <WidgetPropertyWrapper
        title={t("dashboards.widget.chart_types.donut_chart.center_value")}
        input={
          <Controller
            control={control}
            name="config.center_value"
            render={({ field: { value, onChange } }) => (
              <div className="px-2">
                <ToggleSwitch
                  value={!!value}
                  onChange={(val) => {
                    onChange(val);
                    handleConfigUpdate({ center_value: val });
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
