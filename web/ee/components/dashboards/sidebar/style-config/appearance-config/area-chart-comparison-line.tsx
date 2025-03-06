import { Controller, useFormContext } from "react-hook-form";
// plane imports
import { LINE_CHART_LINE_TYPES } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { TDashboardWidget, TDashboardWidgetConfig } from "@plane/types";
// local components
import { WidgetPropertyWrapper } from "../../property-wrapper";
import { WidgetColorPicker } from "./color-picker";
import { WidgetLineTypeSelect } from "./line-type-select";

type Props = {
  handleConfigUpdate: (data: Partial<TDashboardWidgetConfig>) => Promise<void>;
};

export const AreaChartComparisonLineAppearanceConfig: React.FC<Props> = (props) => {
  const { handleConfigUpdate } = props;
  // translation
  const { t } = useTranslation();
  // form info
  const { control } = useFormContext<TDashboardWidget>();

  return (
    <div className="flex-shrink-0 space-y-1 text-sm">
      <h6 className="font-medium text-custom-text-200">{t("dashboards.widget.common.comparison_line_appearance")}</h6>
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
    </div>
  );
};
