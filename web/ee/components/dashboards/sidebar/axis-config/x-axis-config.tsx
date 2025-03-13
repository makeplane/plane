import { Controller, useFormContext } from "react-hook-form";
// plane ui
import { EWidgetChartModels, EWidgetChartTypes, WIDGET_X_AXIS_DATE_PROPERTIES } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { TDashboardWidget } from "@plane/types";
// local components
import { WidgetDateGroupSelect } from "./date-group-select";
import { WidgetPropertySelect } from "./property-select";

type Props = {
  handleSubmit: (data: Partial<TDashboardWidget>) => Promise<void>;
};

export const WidgetConfigSidebarXAxisConfig: React.FC<Props> = (props) => {
  const { handleSubmit } = props;
  // translation
  const { t } = useTranslation();
  // form info
  const { control, watch } = useFormContext<TDashboardWidget>();
  // derived values
  const selectedChartType = watch("chart_type");
  const selectedChartModel = watch("chart_model");
  const selectedXAxisProperty = watch("x_axis_property");
  const selectedGroupByProperty = watch("group_by");
  const isDateGroupingEnabled =
    !!selectedXAxisProperty && WIDGET_X_AXIS_DATE_PROPERTIES.includes(selectedXAxisProperty);
  const isGroupByEnabled =
    selectedChartType === EWidgetChartTypes.BAR_CHART && selectedChartModel === EWidgetChartModels.GROUPED;

  return (
    <div className="flex-shrink-0 space-y-1 text-sm">
      <h6 className="font-medium text-custom-text-200">{t("chart.x_axis")}</h6>
      <Controller
        control={control}
        name="x_axis_property"
        render={({ field: { value, onChange } }) => (
          <WidgetPropertySelect
            onChange={(val) => {
              onChange(val);
              handleSubmit({ x_axis_property: val });
            }}
            placeholder={t("dashboards.widget.common.add_property")}
            shouldRenderOption={(key) => key !== selectedGroupByProperty}
            title={t("common.property")}
            value={value}
          />
        )}
      />
      {isDateGroupingEnabled && (
        <Controller
          control={control}
          name="x_axis_date_grouping"
          render={({ field: { onChange, value } }) => (
            <WidgetDateGroupSelect
              onChange={(val) => {
                onChange(val);
                handleSubmit({ x_axis_date_grouping: val });
              }}
              placeholder={t("dashboards.widget.common.date_group.placeholder")}
              title={t("dashboards.widget.common.date_group.label")}
              value={value}
            />
          )}
        />
      )}
      {isGroupByEnabled && (
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
              title={t("dashboards.widget.common.group_by")}
              value={value}
            />
          )}
        />
      )}
    </div>
  );
};
