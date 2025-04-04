import { Controller, useFormContext } from "react-hook-form";
// plane ui
import { EWidgetChartModels, EWidgetChartTypes } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { TDashboardWidget } from "@plane/types";
// local components
import { WidgetPropertySelect } from "./property-select";

type Props = {
  handleSubmit: (data: Partial<TDashboardWidget>) => Promise<void>;
};

export const WidgetConfigSidebarGroupingConfig: React.FC<Props> = (props) => {
  const { handleSubmit } = props;
  // translation
  const { t } = useTranslation();
  // form info
  const { control, watch } = useFormContext<TDashboardWidget>();
  // derived values
  const selectedChartType = watch("chart_type");
  const selectedChartModel = watch("chart_model");
  const selectedXAxisProperty = watch("x_axis_property");
  const isGroupingEnabled =
    (selectedChartType === EWidgetChartTypes.LINE_CHART && selectedChartModel === EWidgetChartModels.MULTI_LINE) ||
    (selectedChartType === EWidgetChartTypes.BAR_CHART && selectedChartModel === EWidgetChartModels.GROUPED);
  const isStackingEnabled =
    (selectedChartType === EWidgetChartTypes.AREA_CHART && selectedChartModel === EWidgetChartModels.STACKED) ||
    (selectedChartType === EWidgetChartTypes.BAR_CHART && selectedChartModel === EWidgetChartModels.STACKED);

  if (!isGroupingEnabled && !isStackingEnabled) return null;

  return (
    <div className="flex-shrink-0 space-y-1 text-sm">
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
            title={t(isStackingEnabled ? "dashboards.widget.common.stack_by" : "dashboards.widget.common.group_by")}
            value={value}
          />
        )}
      />
    </div>
  );
};
