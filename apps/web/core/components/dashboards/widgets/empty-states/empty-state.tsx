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

import { useCallback } from "react";
import { observer } from "mobx-react";
import { useTheme } from "next-themes";
// plane imports
import { EWidgetGridBreakpoints } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
// components
import { SimpleEmptyState } from "@/components/empty-state/simple-empty-state-root";
// plane web hooks
import { useDashboards } from "@/plane-web/hooks/store";
// plane web stores
import type { DashboardWidgetInstance } from "@/store/dashboards/widget";
import { CHART_ASSET_MAP } from "./helper";

type Props = {
  activeBreakpoint: EWidgetGridBreakpoints;
  dashboardId: string;
  widget: DashboardWidgetInstance;
};

export const DashboardWidgetEmptyState = observer(function DashboardWidgetEmptyState(props: Props) {
  const { activeBreakpoint, dashboardId, widget } = props;
  // store hooks
  const { getDashboardById } = useDashboards();
  // theme hook
  const { resolvedTheme } = useTheme();
  // derived values
  const dashboardDetails = getDashboardById(dashboardId);
  const { isViewModeEnabled } = dashboardDetails ?? {};
  const { canCurrentUserEditWidget, chart_type, height, fetchWidgetData } = widget;
  const shouldShowIcon = activeBreakpoint === EWidgetGridBreakpoints.XXS || height !== 1;
  const theme = resolvedTheme === "light" ? "light" : "dark";
  const resolvedPath = chart_type ? CHART_ASSET_MAP[chart_type]?.[theme] : undefined;
  // translation
  const { t } = useTranslation();

  const handleRefresh = useCallback(async () => {
    await fetchWidgetData?.();
  }, [fetchWidgetData]);

  return (
    <div className="size-full grid place-items-center px-4 overflow-hidden">
      <div className="flex flex-col items-center gap-3">
        <SimpleEmptyState
          title={t("dashboards.empty_state.widget_data.title")}
          assetPath={shouldShowIcon ? resolvedPath : undefined}
        />
        {canCurrentUserEditWidget &&
          (isViewModeEnabled ? (
            <p className="text-13 text-placeholder text-center whitespace-pre-line">
              {t("dashboards.empty_state.widget_data.description")}
            </p>
          ) : (
            <p className="text-13 text-placeholder text-center whitespace-pre-line">
              <Button onClick={handleRefresh} variant="link" className="w-fit inline-flex p-0">
                Refresh
              </Button>{" "}
              or add data to see it here.
            </p>
          ))}
      </div>
    </div>
  );
});
