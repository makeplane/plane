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
import { WIDGET_X_AXIS_DATE_GROUPINGS_LIST } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import type { EWidgetXAxisDateGrouping, TDashboardWidget } from "@plane/types";
import { CustomSelect } from "@plane/ui";
// local components
import { WidgetPropertyWrapper } from "../property-wrapper";
import { WidgetConfigSelectButton } from "../select-button";

type Props = {
  onChange: (value: EWidgetXAxisDateGrouping) => void;
  placeholder: string;
  title: string;
  value: TDashboardWidget["x_axis_date_grouping"];
};

export function WidgetDateGroupSelect(props: Props) {
  const { onChange, placeholder, title, value } = props;
  // translation
  const { t } = useTranslation();
  // derived values
  const selectedDateGroup = value ? WIDGET_X_AXIS_DATE_GROUPINGS_LIST[value] : undefined;

  return (
    <WidgetPropertyWrapper
      title={title}
      input={
        <CustomSelect
          customButton={
            <WidgetConfigSelectButton
              placeholder={placeholder}
              title={t(selectedDateGroup?.i18n_label ?? "")}
              value={!!selectedDateGroup}
            />
          }
          customButtonClassName="w-full"
          value={value}
          onChange={onChange}
        >
          {Object.entries(WIDGET_X_AXIS_DATE_GROUPINGS_LIST).map(([key, property]) => (
            <CustomSelect.Option key={key} value={key}>
              {t(property.i18n_label)}
            </CustomSelect.Option>
          ))}
        </CustomSelect>
      }
    />
  );
}
