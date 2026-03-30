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
// plane imports
import type { TNumberWidgetConfig } from "@plane/types";
import { cn, getChartExpressionForNumberWidget } from "@plane/utils";
// local imports
import type { TWidgetComponentProps } from ".";

export const DashboardNumberWidget = observer(function DashboardNumberWidget(props: TWidgetComponentProps) {
  const { isEditModeEnabled, widget, onClick } = props;
  // derived values
  const { data, height, y_axis_metric } = widget;
  const widgetConfig = widget.config as TNumberWidgetConfig | undefined;
  const { text_alignment, text_color } = widgetConfig ?? {};
  const textToDisplay = data?.data?.[0]?.count ?? 0;
  const chartExpression = y_axis_metric ? getChartExpressionForNumberWidget({ y_axis_metric }) : {};

  return (
    <div
      className={cn("size-full flex items-center px-4", {
        "cursor-pointer": !isEditModeEnabled,
      })}
      onClick={() => onClick?.(chartExpression)}
      role={isEditModeEnabled ? "none" : "button"}
      tabIndex={isEditModeEnabled ? undefined : 0}
      onKeyDown={(e) => {
        if (["Enter", " "].includes(e.key) && !isEditModeEnabled) {
          e.preventDefault();
          e.stopPropagation();
          onClick?.(chartExpression);
        }
      }}
    >
      <p
        className="w-full font-semibold text-primary truncate transition-all"
        style={{
          fontSize: (height ?? 1) * 1.7 + "rem",
          textAlign: text_alignment ?? "center",
          color: text_color,
        }}
      >
        {textToDisplay}
      </p>
    </div>
  );
});
