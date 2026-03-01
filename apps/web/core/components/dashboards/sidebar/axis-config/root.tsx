/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { useState } from "react";
import { Controller, useFormContext } from "react-hook-form";
// plane imports
import { CIRCULAR_WIDGET_CHART_TYPES, NUMBER_WIDGET_Y_AXIS_METRICS_LIST } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { CollapsibleContent, Collapsible, CollapsibleTrigger } from "@plane/propel/collapsible";
import { ChevronRightIcon } from "@plane/propel/icons";
import type { EWidgetYAxisMetric, TDashboardWidget } from "@plane/types";
import { EWidgetChartTypes } from "@plane/types";
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

export function WidgetConfigSidebarAxisConfig(props: Props) {
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
    <div className="flex-shrink-0 space-y-3 text-13">
      <Collapsible open={isCollapsibleIcon} onOpenChange={setIsCollapsibleIcon}>
        <CollapsibleTrigger>
          <div className="flex items-center gap-0.5 p-1 -ml-1 hover:bg-layer-1 rounded-sm transition-colors">
            <h6 className="font-semibold text-secondary">{t("dashboards.widget.common.widget_configuration")}</h6>
            <div className="flex-shrink-0 size-4 grid place-items-center">
              <ChevronRightIcon
                className={cn("size-2.5 transition-all", {
                  "rotate-90": isCollapsibleIcon,
                })}
              />
            </div>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
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
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
