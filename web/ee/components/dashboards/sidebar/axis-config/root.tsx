import React, { useState } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { ChevronRight } from "lucide-react";
// plane imports
import {
  CIRCULAR_WIDGET_CHART_TYPES,
  EWidgetChartTypes,
  EWidgetYAxisMetric,
  NUMBER_WIDGET_Y_AXIS_METRICS_LIST,
} from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { TDashboardWidget } from "@plane/types";
import { Collapsible } from "@plane/ui";
import { cn } from "@plane/utils";
// local components
import { WidgetConfigSidebarCircularChartConfig } from "./circular-chart-config";
import { WidgetConfigSidebarGroupingConfig } from "./grouping-config";
import { WidgetMetricSelect } from "./metric-select";
import { WidgetConfigSidebarXAxisConfig } from "./x-axis-config";
import { WidgetConfigSidebarYAxisConfig } from "./y-axis-config";

type Props = {
  handleSubmit: (data: Partial<TDashboardWidget>) => Promise<void>;
};

export const WidgetConfigSidebarAxisConfig: React.FC<Props> = (props) => {
  const { handleSubmit } = props;
  // states
  const [isCollapsibleIcon, setIsCollapsibleIcon] = useState(true);
  // form info
  const { control, watch } = useFormContext<TDashboardWidget>();
  // derived values
  const selectedChartType = watch("chart_type");
  const shouldSHowCircularChartConfig = !!selectedChartType && CIRCULAR_WIDGET_CHART_TYPES.includes(selectedChartType);
  // translation
  const { t } = useTranslation();

  return (
    <div className="flex-shrink-0 space-y-3 text-sm">
      <Collapsible
        isOpen={isCollapsibleIcon}
        onToggle={() => setIsCollapsibleIcon((prev) => !prev)}
        title={
          <div className="flex items-center gap-0.5 p-1 -ml-1 hover:bg-custom-background-80 rounded transition-colors">
            <h6 className="font-semibold text-custom-text-200">{t("dashboards.widget.common.widget_configuration")}</h6>
            <div className="flex-shrink-0 size-4 grid place-items-center">
              <ChevronRight
                className={cn("size-2.5 transition-all", {
                  "rotate-90": isCollapsibleIcon,
                })}
              />
            </div>
          </div>
        }
      >
        <div className="mt-3 flex flex-col gap-y-1">
          {selectedChartType === EWidgetChartTypes.NUMBER ? (
            <Controller
              control={control}
              name="y_axis_metric"
              render={({ field: { value, onChange } }) => (
                <WidgetMetricSelect
                  onChange={(val: EWidgetYAxisMetric) => {
                    onChange(val);
                    handleSubmit({ y_axis_metric: val });
                  }}
                  options={NUMBER_WIDGET_Y_AXIS_METRICS_LIST}
                  placeholder={t("dashboards.widget.common.add_metric")}
                  title={t("chart.metric")}
                  value={value}
                />
              )}
            />
          ) : shouldSHowCircularChartConfig ? (
            <>
              <WidgetConfigSidebarCircularChartConfig handleSubmit={handleSubmit} />
            </>
          ) : (
            <>
              <WidgetConfigSidebarXAxisConfig handleSubmit={handleSubmit} />
              <WidgetConfigSidebarYAxisConfig handleSubmit={handleSubmit} />
              <WidgetConfigSidebarGroupingConfig handleSubmit={handleSubmit} />
            </>
          )}
        </div>
      </Collapsible>
    </div>
  );
};
