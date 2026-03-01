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
import type { ISvgIcons } from "@plane/propel/icons";
import {
  BasicAreaChartIcon,
  BasicBarChartIcon,
  BasicDonutChartIcon,
  BasicLineChartIcon,
  BasicNumberIcon,
  BasicPieChartIcon,
  ComparisonAreaChartIcon,
  GroupedBarChartIcon,
  MultiLineLineChartIcon,
  ProgressDonutChartIcon,
  StackedAreaChartIcon,
  StackedBarChartIcon,
} from "@plane/propel/icons";
import { EWidgetChartModels, EWidgetChartTypes } from "@plane/types";

type Props = {
  chartModel: EWidgetChartModels;
  chartType: EWidgetChartTypes;
  className?: string;
};

export function WidgetChartTypeIcon(props: Props) {
  const { chartModel, chartType, className } = props;

  let Icon: React.FC<ISvgIcons> | null = null;

  if (chartType === EWidgetChartTypes.BAR_CHART) {
    if (chartModel === EWidgetChartModels.BASIC) {
      Icon = BasicBarChartIcon;
    } else if (chartModel === EWidgetChartModels.GROUPED) {
      Icon = GroupedBarChartIcon;
    } else if (chartModel === EWidgetChartModels.STACKED) {
      Icon = StackedBarChartIcon;
    }
  } else if (chartType === EWidgetChartTypes.LINE_CHART) {
    if (chartModel === EWidgetChartModels.BASIC) {
      Icon = BasicLineChartIcon;
    } else if (chartModel === EWidgetChartModels.MULTI_LINE) {
      Icon = MultiLineLineChartIcon;
    }
  } else if (chartType === EWidgetChartTypes.AREA_CHART) {
    if (chartModel === EWidgetChartModels.BASIC) {
      Icon = BasicAreaChartIcon;
    } else if (chartModel === EWidgetChartModels.STACKED) {
      Icon = StackedAreaChartIcon;
    } else if (chartModel === EWidgetChartModels.COMPARISON) {
      Icon = ComparisonAreaChartIcon;
    }
  } else if (chartType === EWidgetChartTypes.DONUT_CHART) {
    if (chartModel === EWidgetChartModels.BASIC) {
      Icon = BasicDonutChartIcon;
    } else if (chartModel === EWidgetChartModels.PROGRESS) {
      Icon = ProgressDonutChartIcon;
    }
  } else if (chartType === EWidgetChartTypes.PIE_CHART) {
    Icon = BasicPieChartIcon;
  } else if (chartType === EWidgetChartTypes.NUMBER) {
    Icon = BasicNumberIcon;
  }

  return Icon ? <Icon className={className} /> : null;
}
