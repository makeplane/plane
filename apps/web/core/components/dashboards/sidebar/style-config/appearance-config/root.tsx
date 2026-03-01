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

import { useFormContext } from "react-hook-form";
// plane imports
import { useTranslation } from "@plane/i18n";
import type { TDashboardWidget, TDashboardWidgetConfig } from "@plane/types";
import { EWidgetChartModels, EWidgetChartTypes } from "@plane/types";
// local components
import { AreaChartAppearanceConfig } from "./area-chart";
import { AreaChartComparisonLineAppearanceConfig } from "./area-chart-comparison-line";
import { BarChartAppearanceConfig } from "./bar-chart";
import { DonutChartAppearanceConfig } from "./donut-chart";
import { LineChartAppearanceConfig } from "./line-chart";
import { NumberAppearanceConfig } from "./number";
import { PieChartAppearanceConfig } from "./pie-chart";
import { PieChartGroupingConfig } from "./pie-chart-grouping";

type Props = {
  handleConfigUpdate: (data: Partial<TDashboardWidgetConfig>) => Promise<void>;
};

export function WidgetConfigSidebarAppearanceConfig(props: Props) {
  const { handleConfigUpdate } = props;
  // translation
  const { t } = useTranslation();
  // form info
  const { watch } = useFormContext<TDashboardWidget>();
  // derived values
  const selectedChartType = watch("chart_type");
  const selectedChartModel = watch("chart_model");
  const isComparisonAreaChart =
    selectedChartType === EWidgetChartTypes.AREA_CHART && selectedChartModel === EWidgetChartModels.COMPARISON;
  const isPieChart = selectedChartType === EWidgetChartTypes.PIE_CHART;

  return (
    <>
      {isPieChart && <PieChartGroupingConfig handleConfigUpdate={handleConfigUpdate} />}
      <div className="flex-shrink-0 space-y-1 text-13">
        <h6 className="font-medium text-secondary">
          {t(isComparisonAreaChart ? "dashboards.widget.common.area_appearance" : "appearance")}
        </h6>
        {selectedChartType === EWidgetChartTypes.BAR_CHART && (
          <BarChartAppearanceConfig handleConfigUpdate={handleConfigUpdate} />
        )}
        {selectedChartType === EWidgetChartTypes.LINE_CHART && (
          <LineChartAppearanceConfig handleConfigUpdate={handleConfigUpdate} />
        )}
        {selectedChartType === EWidgetChartTypes.AREA_CHART && (
          <AreaChartAppearanceConfig handleConfigUpdate={handleConfigUpdate} />
        )}
        {selectedChartType === EWidgetChartTypes.DONUT_CHART && (
          <DonutChartAppearanceConfig handleConfigUpdate={handleConfigUpdate} />
        )}
        {selectedChartType === EWidgetChartTypes.PIE_CHART && (
          <PieChartAppearanceConfig handleConfigUpdate={handleConfigUpdate} />
        )}
        {selectedChartType === EWidgetChartTypes.NUMBER && (
          <NumberAppearanceConfig handleConfigUpdate={handleConfigUpdate} />
        )}
      </div>
      {isComparisonAreaChart && <AreaChartComparisonLineAppearanceConfig handleConfigUpdate={handleConfigUpdate} />}
    </>
  );
}
