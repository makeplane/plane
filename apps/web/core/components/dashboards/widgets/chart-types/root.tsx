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

import { useCallback, useMemo, useRef } from "react";
import { toJS } from "mobx";
import { observer } from "mobx-react";
import { useParams } from "react-router";
import useSWR from "swr";
// plane imports
import { EWidgetGridBreakpoints } from "@plane/constants";
import type { TWorkItemFilterExpression } from "@plane/types";
import { EWidgetChartTypes } from "@plane/types";
// hooks
import { useAppRouter } from "@/hooks/use-app-router";
// plane web hooks
import { useDashboards } from "@/plane-web/hooks/store";
// chart types
import { DashboardWidgetNotConfiguredState } from "../empty-states/not-configured-state";
import { DashboardAreaChartWidget } from "./area-chart";
import { DashboardBarChartWidget } from "./bar-chart";
import { DashboardWidgetContent } from "./content";
import { DashboardDonutChartWidget } from "./donut-chart";
import { DashboardWidgetHeader } from "./header";
import { DashboardLineChartWidget } from "./line-chart";
import { DashboardNumberWidget } from "./number";
import { DashboardPieChartWidget } from "./pie-chart";
import { DashboardTableChartWidget } from "./table-chart";
import type { TWidgetComponentProps } from "./";
import { commonWidgetClassName, parseWidgetData } from "./";

type Props = {
  activeBreakpoint: EWidgetGridBreakpoints;
  dashboardId: string;
  widgetId: string;
};

export const DashboardWidgetRoot = observer(function DashboardWidgetRoot(props: Props) {
  const { activeBreakpoint, dashboardId, widgetId } = props;
  // refs
  const widgetRef = useRef<HTMLDivElement>(null);
  // router
  const router = useAppRouter();
  const { workspaceSlug } = useParams();
  // store hooks
  const { getDashboardById } = useDashboards();
  // derived values
  const dashboardDetails = getDashboardById(dashboardId);
  const { isViewModeEnabled, widgetsStore } = dashboardDetails ?? {};
  const { getWidgetById, isEditingWidget, toggleEditWidget } = widgetsStore ?? {};
  const widget = getWidgetById?.(widgetId);
  const {
    canCurrentUserEditWidget,
    chart_type,
    data,
    isConfigurationMissing,
    isWidgetAvailableInCurrentPlan,
    x_axis_property,
    fetchWidgetData,
    group_by,
    x_axis_date_grouping,
  } = widget ?? {};
  const isWidgetSelected = isEditingWidget === widgetId;
  const isWidgetConfigured = !isConfigurationMissing;
  const isEditingEnabled = !isViewModeEnabled && !!canCurrentUserEditWidget;
  const parsedData = useMemo(
    () => parseWidgetData(toJS(data), x_axis_property, group_by, x_axis_date_grouping),
    [data, group_by, x_axis_date_grouping, x_axis_property]
  );

  useSWR(
    isWidgetConfigured && isWidgetAvailableInCurrentPlan && widgetId ? `WIDGET_DATA_${widgetId}` : null,
    isWidgetConfigured && isWidgetAvailableInCurrentPlan && widgetId ? () => fetchWidgetData?.() : null
  );

  const handleChartClick = useCallback(
    (chartExpression?: TWorkItemFilterExpression) => {
      if (isEditingEnabled) return;
      const finalExpression: TWorkItemFilterExpression = {
        and: [],
      };
      if (dashboardDetails?.filters && Object.keys(dashboardDetails.filters).length > 0) {
        finalExpression.and.push(toJS(dashboardDetails.filters));
      }
      if (widget?.filters && Object.keys(widget.filters).length > 0) {
        finalExpression.and.push(toJS(widget.filters));
      }
      if (chartExpression && Object.keys(chartExpression).length > 0) {
        finalExpression.and.push(chartExpression);
      }
      router.push(
        `/${workspaceSlug}/workspace-views/all-issues/?rich_filters=${encodeURIComponent(JSON.stringify(finalExpression))}`
      );
    },
    [dashboardDetails?.filters, isEditingEnabled, widget?.filters, router, workspaceSlug]
  );

  let WidgetComponent: React.FC<TWidgetComponentProps> | null = null;
  switch (chart_type) {
    case EWidgetChartTypes.NUMBER:
      WidgetComponent = DashboardNumberWidget;
      break;
    case EWidgetChartTypes.BAR_CHART:
      WidgetComponent = DashboardBarChartWidget;
      break;
    case EWidgetChartTypes.LINE_CHART:
      WidgetComponent = DashboardLineChartWidget;
      break;
    case EWidgetChartTypes.AREA_CHART:
      WidgetComponent = DashboardAreaChartWidget;
      break;
    case EWidgetChartTypes.DONUT_CHART:
      WidgetComponent = DashboardDonutChartWidget;
      break;
    case EWidgetChartTypes.PIE_CHART:
      WidgetComponent = DashboardPieChartWidget;
      break;
    case EWidgetChartTypes.TABLE_CHART:
      WidgetComponent = DashboardTableChartWidget;
      break;
    default:
      WidgetComponent = null;
  }

  if (isWidgetAvailableInCurrentPlan && !isWidgetConfigured) {
    return (
      <DashboardWidgetNotConfiguredState
        activeBreakpoint={activeBreakpoint}
        dashboardId={dashboardId}
        widgetId={widgetId}
      />
    );
  }

  if (!widget || !WidgetComponent) return null;

  return (
    <div
      ref={widgetRef}
      className={commonWidgetClassName({
        isEditingEnabled,
        isSelected: isWidgetSelected,
        isResizingDisabled: !isEditingEnabled || activeBreakpoint === EWidgetGridBreakpoints.XXS,
      })}
      onClick={() => {
        if (!isEditingEnabled || isEditingWidget === widgetId) return;
        toggleEditWidget?.(widgetId);
      }}
      role={isEditingEnabled ? "button" : "none"}
      tabIndex={isEditingEnabled ? 0 : undefined}
      onKeyDown={(e) => {
        if (["Enter", " "].includes(e.key) && isEditingEnabled) {
          e.preventDefault();
          e.stopPropagation();
          toggleEditWidget?.(widgetId);
        }
      }}
    >
      <DashboardWidgetHeader dashboardId={dashboardId} widget={widget} widgetRef={widgetRef} />
      <DashboardWidgetContent
        activeBreakpoint={activeBreakpoint}
        dashboardId={dashboardId}
        isDataAvailable={!!data}
        isDataEmpty={data?.data.length === 0}
        widget={widget}
      >
        <WidgetComponent parsedData={parsedData} widget={widget} onClick={handleChartClick} />
      </DashboardWidgetContent>
    </div>
  );
});
