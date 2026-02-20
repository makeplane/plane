/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import type { IAnalyticsNumberWidgetData, IAnalyticsWidgetConfig } from "@plane/types";

type NumberWidgetProps = {
  data: IAnalyticsNumberWidgetData;
  config: IAnalyticsWidgetConfig;
  chartMetric: string;
};

export const NumberWidget = observer(function NumberWidget({
  data,
  _config,
  chartMetric,
}: NumberWidgetProps) {
  const metricLabel = chartMetric.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2">
      <div className="text-5xl font-bold text-accent-primary">
        {data.value.toLocaleString()}
      </div>
      <div className="text-sm font-medium text-tertiary">
        {metricLabel}
      </div>
    </div>
  );
});

