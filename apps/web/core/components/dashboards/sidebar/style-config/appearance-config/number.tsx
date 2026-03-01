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
import { TEXT_ALIGNMENTS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import type { TDashboardWidget, TDashboardWidgetConfig, TWidgetTextAlignment } from "@plane/types";
import { CustomSelect } from "@plane/ui";
// local components
import { WidgetPropertyWrapper } from "../../property-wrapper";
import { WidgetConfigSelectButton } from "../../select-button";
import { WidgetColorPicker } from "./color-picker";

type Props = {
  handleConfigUpdate: (data: Partial<TDashboardWidgetConfig>) => Promise<void>;
};

export function NumberAppearanceConfig(props: Props) {
  const { handleConfigUpdate } = props;
  // translation
  const { t } = useTranslation();
  // form info
  const { control } = useFormContext<TDashboardWidget>();

  return (
    <>
      <WidgetPropertyWrapper
        title={t("dashboards.widget.chart_types.number.alignment.label")}
        input={
          <Controller
            control={control}
            name="config.text_alignment"
            render={({ field: { value, onChange } }) => {
              const selectedAlignment = TEXT_ALIGNMENTS.find((p) => p.key === value);
              return (
                <CustomSelect
                  customButton={
                    <WidgetConfigSelectButton
                      placeholder={t("dashboards.widget.chart_types.number.alignment.placeholder")}
                      title={t(selectedAlignment?.i18n_label ?? "")}
                      value={!!selectedAlignment}
                    />
                  }
                  customButtonClassName="w-full"
                  value={value}
                  onChange={(val: TWidgetTextAlignment) => {
                    onChange(val);
                    handleConfigUpdate({ text_alignment: val });
                  }}
                >
                  {TEXT_ALIGNMENTS.map((alignment) => (
                    <CustomSelect.Option key={alignment.key} value={alignment.key}>
                      {t(alignment.i18n_label)}
                    </CustomSelect.Option>
                  ))}
                </CustomSelect>
              );
            }}
          />
        }
      />
      <Controller
        control={control}
        name="config.text_color"
        render={({ field: { value, onChange } }) => (
          <WidgetColorPicker
            onChange={(val) => {
              onChange(val);
              handleConfigUpdate({ text_color: val });
            }}
            title={t("dashboards.widget.chart_types.number.text_color")}
            value={value}
          />
        )}
      />
    </>
  );
}
