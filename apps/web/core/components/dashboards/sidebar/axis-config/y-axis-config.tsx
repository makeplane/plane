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

import { Controller, useFormContext } from "react-hook-form";
// plane imports
import { CHART_WIDGETS_Y_AXIS_METRICS_LIST } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import type { EWidgetYAxisMetric, TDashboardWidget } from "@plane/types";
// local components
import { WidgetMetricSelect } from "./metric-select";

type Props = {
  handleSubmit: (data: Partial<TDashboardWidget>) => Promise<void>;
};

export function WidgetConfigSidebarYAxisConfig(props: Props) {
  const { handleSubmit } = props;
  // translation
  const { t } = useTranslation();
  // form info
  const { control } = useFormContext<TDashboardWidget>();

  return (
    <div className="flex-shrink-0 space-y-1 text-13">
      <Controller
        control={control}
        name="y_axis_metric"
        render={({ field: { value, onChange } }) => (
          <WidgetMetricSelect
            onChange={(val: EWidgetYAxisMetric) => {
              onChange(val);
              handleSubmit({ y_axis_metric: val });
            }}
            options={CHART_WIDGETS_Y_AXIS_METRICS_LIST}
            placeholder={t("dashboards.widget.common.add_metric")}
            title={t("chart.y_axis")}
            value={value}
          />
        )}
      />
    </div>
  );
}
