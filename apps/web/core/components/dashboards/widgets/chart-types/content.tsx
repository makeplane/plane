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
import type { EWidgetGridBreakpoints } from "@plane/constants";
// plane web stores
import type { DashboardWidgetInstance } from "@/store/dashboards/widget";
// local imports
import { DashboardWidgetEmptyState } from "../empty-states/empty-state";
import { DashboardWidgetUpgradeRequiredState } from "../empty-states/upgrade-required-state";
import { DashboardWidgetLoader } from "../loader";
import { WIDGET_HEADER_HEIGHT, WIDGET_Y_SPACING } from ".";

type Props = {
  activeBreakpoint: EWidgetGridBreakpoints;
  children: React.ReactNode;
  className?: string;
  dashboardId: string;
  isDataAvailable: boolean;
  isDataEmpty: boolean;
  widget: DashboardWidgetInstance;
};

export function DashboardWidgetContent(props: Props) {
  const { activeBreakpoint, children, className, dashboardId, isDataAvailable, isDataEmpty, widget } = props;
  // derived values
  const { isWidgetAvailableInCurrentPlan } = widget;

  return (
    <div
      className={className}
      style={{
        height: `calc(100% - ${WIDGET_HEADER_HEIGHT + WIDGET_Y_SPACING}px)`,
      }}
    >
      {isWidgetAvailableInCurrentPlan ? (
        <>
          {isDataAvailable ? (
            isDataEmpty ? (
              <DashboardWidgetEmptyState
                activeBreakpoint={activeBreakpoint}
                dashboardId={dashboardId}
                widget={widget}
              />
            ) : (
              children
            )
          ) : (
            <DashboardWidgetLoader widget={widget} />
          )}
        </>
      ) : (
        <DashboardWidgetUpgradeRequiredState activeBreakpoint={activeBreakpoint} widget={widget} />
      )}
    </div>
  );
}
