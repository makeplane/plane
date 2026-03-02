/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * Style settings coordinator: conditionally renders sub-sections based on chart type.
 */

import { observer } from "mobx-react";
import type { Control } from "react-hook-form";
import { StyleColorPresetSection } from "./style-color-preset-section";
import { StyleChartOptionsSection } from "./style-chart-options-section";
import { StyleNumberWidgetSection } from "./style-number-widget-section";

interface StyleSettingsSectionProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<any>;
  chartType: string;
}

export const StyleSettingsSection = observer(({ control, chartType }: StyleSettingsSectionProps) => {
  const isNumber = chartType === "NUMBER";
  const showFillOpacity = ["BAR_CHART", "AREA_CHART"].includes(chartType);
  const showSmoothing = ["LINE_CHART", "AREA_CHART"].includes(chartType);
  const showBorder = chartType === "BAR_CHART";
  const showLineType = chartType === "LINE_CHART";
  const showOrientation = chartType === "BAR_CHART";

  return (
    <div className="space-y-4">
      {!isNumber && <StyleColorPresetSection control={control} showFillOpacity={showFillOpacity} />}
      <StyleChartOptionsSection
        control={control}
        showBorder={showBorder}
        showSmoothing={showSmoothing}
        showLineType={showLineType}
        showOrientation={showOrientation}
      />
      {isNumber && <StyleNumberWidgetSection control={control} />}
    </div>
  );
});
