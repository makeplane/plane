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

import { useCallback, useState } from "react";
import { observer } from "mobx-react";
import { useFormContext } from "react-hook-form";
// plane imports
import { useTranslation } from "@plane/i18n";
import { ChevronRightIcon } from "@plane/propel/icons";
import type { TDashboardWidget, TDashboardWidgetConfig } from "@plane/types";
import { EWidgetChartTypes } from "@plane/types";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@plane/propel/collapsible";
import { cn } from "@plane/utils";
// local components
import { WidgetConfigSidebarAppearanceConfig } from "./appearance-config";
import { WidgetConfigSidebarGuidesConfig } from "./guides-config";

type Props = {
  handleSubmit: (data: Partial<TDashboardWidget>) => Promise<void>;
};

export const WidgetConfigSidebarStyleConfig = observer(function WidgetConfigSidebarStyleConfig(props: Props) {
  const { handleSubmit } = props;
  // states
  const [isCollapsibleIcon, setIsCollapsibleIcon] = useState(true);
  // translation
  const { t } = useTranslation();
  // form info
  const { getValues, watch } = useFormContext<TDashboardWidget>();
  // derived values
  const selectedChartType = watch("chart_type");

  const handleConfigUpdate = useCallback(
    async (data: Partial<TDashboardWidgetConfig>) => {
      const selectedConfig = getValues("config") ?? {};
      const updatedConfig = {
        ...selectedConfig,
        ...data,
      };

      await handleSubmit({
        config: updatedConfig,
      });
    },
    [handleSubmit]
  );

  return (
    <div className="flex-shrink-0 space-y-3 text-13">
      <Collapsible open={isCollapsibleIcon} onOpenChange={setIsCollapsibleIcon}>
        <CollapsibleTrigger>
          <div className="flex items-center gap-0.5 p-1 -ml-1 hover:bg-layer-1 rounded-sm transition-colors">
            <h6 className="font-semibold text-secondary">{t("dashboards.widget.common.style")}</h6>
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
          <div className="mt-3 flex flex-col gap-y-4">
            <WidgetConfigSidebarAppearanceConfig handleConfigUpdate={handleConfigUpdate} />
            {selectedChartType !== EWidgetChartTypes.NUMBER && (
              <WidgetConfigSidebarGuidesConfig handleConfigUpdate={handleConfigUpdate} />
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
});
