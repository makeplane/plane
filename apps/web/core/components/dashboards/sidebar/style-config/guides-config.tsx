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
import { useTranslation } from "@plane/i18n";
import type { TDashboardWidget, TDashboardWidgetConfig } from "@plane/types";
import { Switch } from "@plane/propel/switch";
// local components
import { WidgetPropertyWrapper } from "../property-wrapper";

type Props = {
  handleConfigUpdate: (data: Partial<TDashboardWidgetConfig>) => Promise<void>;
};

export function WidgetConfigSidebarGuidesConfig(props: Props) {
  const { handleConfigUpdate } = props;
  // translation
  const { t } = useTranslation();
  // form info
  const { control } = useFormContext<TDashboardWidget>();

  return (
    <div className="flex-shrink-0 space-y-1 text-13">
      <h6 className="font-medium text-secondary">{t("dashboards.widget.common.guides")}</h6>
      <WidgetPropertyWrapper
        title={t("dashboards.widget.common.legends")}
        input={
          <Controller
            control={control}
            name="config.show_legends"
            render={({ field: { value, onChange } }) => (
              <div className="px-2">
                <Switch
                  value={!!value}
                  onChange={(val) => {
                    onChange(val);
                    handleConfigUpdate({ show_legends: val });
                  }}
                />
              </div>
            )}
          />
        }
      />
      <WidgetPropertyWrapper
        title={t("dashboards.widget.common.tooltips")}
        input={
          <Controller
            control={control}
            name="config.show_tooltip"
            render={({ field: { value, onChange } }) => (
              <div className="px-2">
                <Switch
                  value={!!value}
                  onChange={(val) => {
                    onChange(val);
                    handleConfigUpdate({ show_tooltip: val });
                  }}
                />
              </div>
            )}
          />
        }
      />
    </div>
  );
}
