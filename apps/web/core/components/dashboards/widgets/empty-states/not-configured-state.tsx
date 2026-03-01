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
// chart types
import { commonWidgetClassName } from "..";
import { CHART_ASSET_MAP } from "./helper";

type Props = {
  activeBreakpoint: EWidgetGridBreakpoints;
  dashboardId: string;
  widgetId: string;
};

export const DashboardWidgetNotConfiguredState = observer(function DashboardWidgetNotConfiguredState(props: Props) {
  const { activeBreakpoint, dashboardId, widgetId } = props;
  // store hooks
  const { getDashboardById } = useDashboards();
  // theme hook
  const { resolvedTheme } = useTheme();
  // derived values
  const dashboardDetails = getDashboardById(dashboardId);
  const { isViewModeEnabled, toggleViewingMode } = dashboardDetails ?? {};
  const { getWidgetById, isEditingWidget, toggleEditWidget } = dashboardDetails?.widgetsStore ?? {};
  const widget = getWidgetById?.(widgetId);
  const { canCurrentUserEditWidget, chart_model, chart_type, isConfigurationMissing, height } = widget ?? {};
  const isWidgetSelected = isEditingWidget === widgetId;
  const shouldShowIcon = activeBreakpoint === EWidgetGridBreakpoints.XXS || height !== 1;
  const isEditingEnabled = !isViewModeEnabled && !!canCurrentUserEditWidget;
  const theme = resolvedTheme === "light" ? "light" : "dark";
  const resolvedPath = chart_type ? CHART_ASSET_MAP[chart_type]?.[theme] : undefined;
  // translation
  const { t } = useTranslation();

  const handleConfigureWidget = () => {
    toggleEditWidget?.(widgetId);
    toggleViewingMode?.(false);
  };

  return (
    <div
      className={commonWidgetClassName({
        className: "grid place-items-center px-4 overflow-hidden",
        isEditingEnabled,
        isSelected: isWidgetSelected,
        isResizingDisabled: !isEditingEnabled || activeBreakpoint === EWidgetGridBreakpoints.XXS,
      })}
    >
      <div className="flex flex-col items-center gap-3">
        <SimpleEmptyState
          title={t(
            `dashboards.widget.not_configured_state.${chart_type?.toLowerCase()}.${chart_model?.toLowerCase()}.${isConfigurationMissing}`
          )}
          assetPath={shouldShowIcon ? resolvedPath : undefined}
        />
        {canCurrentUserEditWidget ? (
          isViewModeEnabled ? (
            <p className="text-13 text-placeholder text-center whitespace-pre-line">
              Switch to{" "}
              <Button onClick={handleConfigureWidget} variant="link" className="w-fit inline-flex p-0">
                Edit mode
              </Button>{" "}
              to configure your widget.
            </p>
          ) : (
            <Button onClick={handleConfigureWidget} variant="link" className="w-fit">
              {t("dashboards.widget.common.configure_widget")}
            </Button>
          )
        ) : (
          <p className="text-13 text-placeholder text-center whitespace-pre-line">
            {t("dashboards.widget.not_configured_state.ask_admin")}
          </p>
        )}
      </div>
    </div>
  );
});
