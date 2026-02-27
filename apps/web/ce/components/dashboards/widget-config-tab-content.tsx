/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * Renders the active tab panel inside the widget config modal.
 * Uses plain string chart_type values matching backend DashboardWidget model.
 */

import type { Control, FieldErrors } from "react-hook-form";
import { WidgetTypeSelector } from "./config/widget-type-selector";
import { BasicSettingsSection } from "./config/basic-settings-section";
import { StyleSettingsSection } from "./config/style-settings-section";
import { DisplaySettingsSection } from "./config/display-settings-section";
import { FilterSettingsSection } from "./config/filter-settings-section";
import type { ConfigTabKey } from "./widget-config-modal";

interface WidgetConfigTabContentProps {
  activeTab: ConfigTabKey;
  chartType: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  errors: FieldErrors<any>;
  onChartTypeChange: (type: string) => void;
}

export const WidgetConfigTabContent = ({
  activeTab,
  chartType,
  control,
  errors,
  onChartTypeChange,
}: WidgetConfigTabContentProps) => (
  <div className="mt-4 max-h-96 overflow-y-auto">
    {activeTab === "type" && <WidgetTypeSelector selectedType={chartType} onChange={onChartTypeChange} />}
    {activeTab === "basic" && <BasicSettingsSection control={control} errors={errors} />}
    {activeTab === "style" && <StyleSettingsSection control={control} chartType={chartType} />}
    {activeTab === "display" && <DisplaySettingsSection control={control} chartType={chartType} />}
    {activeTab === "filters" && <FilterSettingsSection control={control} />}
  </div>
);
