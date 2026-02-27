/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * Chart type selector grid for custom dashboard widget config.
 * Uses plain string values matching backend DashboardWidget.CHART_TYPE_CHOICES.
 */

import { BarChart3, LineChart, AreaChart, PieChart, Hash } from "lucide-react";
import { cn } from "@plane/utils";

interface WidgetTypeSelectorProps {
  selectedType: string;
  onChange: (type: string) => void;
}

/** Widget type values matching backend AnalyticsDashboardWidget.WidgetType choices */
const WIDGET_TYPES = [
  { type: "bar", label: "Bar Chart", description: "Compare values across categories", icon: BarChart3 },
  { type: "line", label: "Line Chart", description: "Show trends over time", icon: LineChart },
  { type: "area", label: "Area Chart", description: "Visualize cumulative data", icon: AreaChart },
  { type: "donut", label: "Donut Chart", description: "Proportions with center hole", icon: PieChart },
  { type: "pie", label: "Pie Chart", description: "Show proportions", icon: PieChart },
  { type: "number", label: "Number Widget", description: "Display single metric", icon: Hash },
];

export const WidgetTypeSelector = ({ selectedType, onChange }: WidgetTypeSelectorProps) => (
  <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
    {WIDGET_TYPES.map(({ type, label, description, icon: Icon }) => (
      <button
        key={type}
        type="button"
        onClick={() => onChange(type)}
        className={cn(
          "group flex flex-col items-start rounded-lg border-[1.5px] p-3 text-left transition-all",
          selectedType === type
            ? "border-color-accent-strong bg-accent-subtle"
            : "border-color-subtle hover:border-color-accent-strong hover:bg-layer-1-hover bg-surface-1"
        )}
      >
        <Icon
          className={cn("mb-2 h-6 w-6 transition-colors", {
            "text-color-accent-primary": selectedType === type,
            "text-color-tertiary group-hover:text-color-accent-primary": selectedType !== type,
          })}
        />
        <div
          className={cn(
            "font-medium transition-colors",
            selectedType === type ? "text-color-accent-primary" : "text-color-primary"
          )}
        >
          {label}
        </div>
        <div className="text-xs text-color-tertiary">{description}</div>
      </button>
    ))}
  </div>
);
