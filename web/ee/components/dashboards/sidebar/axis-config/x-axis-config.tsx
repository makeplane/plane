import { Controller, useFormContext } from "react-hook-form";
// plane ui
import { WIDGET_X_AXIS_DATE_PROPERTIES } from "@plane/constants";
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
  const { control, watch, setValue } = useFormContext<TDashboardWidget>();
  // derived values
  const selectedXAxisProperty = watch("x_axis_property");
  const selectedGroupByProperty = watch("group_by");
  const isDateGroupingEnabled =
    !!selectedXAxisProperty && WIDGET_X_AXIS_DATE_PROPERTIES.includes(selectedXAxisProperty);

  return (
    <div className="flex-shrink-0 space-y-1 text-sm">
      <Controller
        control={control}
        name="x_axis_property"
        render={({ field: { value, onChange } }) => (
          <WidgetPropertySelect
            onChange={(val) => {
              const isGroupBySame = selectedGroupByProperty === val;
              onChange(val);
              if (isGroupBySame) {
                setValue("group_by", null);
              }
              handleSubmit({ x_axis_property: val, ...(isGroupBySame ? { group_by: null } : {}) });
            }}
            placeholder={t("dashboards.widget.common.add_property")}
            title={t("chart.x_axis")}
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
    </div>
  );
};
