/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { BarChart3, LineChart, AreaChart, PieChart, Hash } from "lucide-react";
import { EAnalyticsWidgetType } from "@plane/types";
import { cn } from "@plane/utils";

interface WidgetTypeSelectorProps {
  selectedType: EAnalyticsWidgetType;
  onChange: (type: EAnalyticsWidgetType) => void;
}

const WIDGET_TYPES = [
  {
    type: EAnalyticsWidgetType.BAR,
    label: "Bar Chart",
    description: "Compare values across categories",
    icon: BarChart3,
  },
  {
    type: EAnalyticsWidgetType.LINE,
    label: "Line Chart",
    description: "Show trends over time",
    icon: LineChart,
  },
  {
    type: EAnalyticsWidgetType.AREA,
    label: "Area Chart",
    description: "Visualize cumulative data",
    icon: AreaChart,
  },
  {
    type: EAnalyticsWidgetType.DONUT,
    label: "Donut Chart",
    description: "Proportions with center hole",
    icon: PieChart,
  },
  {
    type: EAnalyticsWidgetType.PIE,
    label: "Pie Chart",
    description: "Show proportions",
    icon: PieChart,
  },
  {
    type: EAnalyticsWidgetType.NUMBER,
    label: "Number Widget",
    description: "Display single metric",
    icon: Hash,
  },
];

export const WidgetTypeSelector = observer(
  ({ selectedType, onChange }: WidgetTypeSelectorProps) => {
    return (
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {WIDGET_TYPES.map(({ type, label, description, icon: Icon }) => (
          <button
            key={type}
            type="button"
            onClick={() => onChange(type)}
            className={cn(
              "group flex flex-col items-start rounded-lg border-[1.5px] p-3 text-left transition-all",
              selectedType === type
                ? "border-accent-strong bg-accent-subtle"
                : "border-subtle hover:border-accent-subtle hover:bg-layer-1-hover bg-surface-1"
            )}
          >
            <Icon
              className={cn("mb-2 h-6 w-6 transition-colors", {
                "text-accent-primary": selectedType === type,
                "text-tertiary group-hover:text-accent-primary": selectedType !== type,
              })}
            />
            <div className={cn("font-medium transition-colors", selectedType === type ? "text-accent-primary" : "text-primary group-hover:text-accent-primary")}>{label}</div>
            <div className="text-xs text-tertiary">{description}</div>
          </button>
        ))}
      </div>
    );
  }
);
