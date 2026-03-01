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

// plane imports
import { LINE_CHART_LINE_TYPES } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import type { TWidgetLineChartLineType } from "@plane/types";
import { CustomSelect } from "@plane/ui";
// local imports
import { WidgetPropertyWrapper } from "../../property-wrapper";
import { WidgetConfigSelectButton } from "../../select-button";

type Props = {
  onChange: (value: TWidgetLineChartLineType) => void;
  value: TWidgetLineChartLineType | undefined;
};

export function WidgetLineTypeSelect(props: Props) {
  const { onChange, value } = props;
  // translation
  const { t } = useTranslation();
  // derived values
  const selectedLineType = LINE_CHART_LINE_TYPES.find((p) => p.key === value);

  return (
    <WidgetPropertyWrapper
      title={t("dashboards.widget.chart_types.line_chart.line_type.label")}
      input={
        <CustomSelect
          customButton={
            <WidgetConfigSelectButton
              placeholder={t("dashboards.widget.chart_types.line_chart.line_type.placeholder")}
              title={t(selectedLineType?.i18n_label ?? "")}
              value={!!selectedLineType}
            />
          }
          customButtonClassName="w-full"
          value={value}
          onChange={onChange}
        >
          {LINE_CHART_LINE_TYPES.map((type) => (
            <CustomSelect.Option key={type.key} value={type.key}>
              {t(type.i18n_label)}
            </CustomSelect.Option>
          ))}
        </CustomSelect>
      }
    />
  );
}
