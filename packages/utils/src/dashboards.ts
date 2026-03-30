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
import { STATE_GROUPS } from "@plane/constants";
import type { TWorkItemFilterExpression } from "@plane/types";
import { EWidgetYAxisMetric } from "@plane/types";
// local imports
import { renderFormattedPayloadDate } from "./datetime";

type GetChartExpressionArgs = {
  y_axis_metric: EWidgetYAxisMetric;
};

export const getChartExpressionForNumberWidget = (args: GetChartExpressionArgs): TWorkItemFilterExpression => {
  const { y_axis_metric } = args;

  let expression: TWorkItemFilterExpression = {};
  switch (y_axis_metric) {
    case EWidgetYAxisMetric.PENDING_WORK_ITEM_COUNT:
      expression = {
        state_group__in: [STATE_GROUPS.unstarted.key, STATE_GROUPS.started.key, STATE_GROUPS.backlog.key].join(","),
      };
      break;
    case EWidgetYAxisMetric.COMPLETED_WORK_ITEM_COUNT:
      expression = {
        state_group__in: STATE_GROUPS.completed.key,
      };
      break;
    case EWidgetYAxisMetric.IN_PROGRESS_WORK_ITEM_COUNT:
      expression = {
        state_group__in: [STATE_GROUPS.unstarted.key, STATE_GROUPS.started.key].join(","),
      };
      break;
    case EWidgetYAxisMetric.WORK_ITEM_DUE_TODAY_COUNT: {
      expression = {
        target_date__exact: renderFormattedPayloadDate(new Date()),
      };
      break;
    }
    case EWidgetYAxisMetric.WORK_ITEM_DUE_THIS_WEEK_COUNT: {
      const today = new Date();
      const day = today.getDay();
      const daysToMonday = day === 0 ? -6 : 1 - day;
      const daysToSunday = day === 0 ? 0 : 7 - day;
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() + daysToMonday);
      const endOfWeek = new Date(today);
      endOfWeek.setDate(today.getDate() + daysToSunday);
      expression = {
        target_date__range: [renderFormattedPayloadDate(startOfWeek), renderFormattedPayloadDate(endOfWeek)].join(","),
      };
      break;
    }
    default:
      expression = {};
  }

  return expression;
};
