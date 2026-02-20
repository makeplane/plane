/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { Control, FieldErrors } from "react-hook-form";
import type { EAnalyticsWidgetType } from "@plane/types";
import { WidgetTypeSelector } from "./config/widget-type-selector";
import { BasicSettingsSection } from "./config/basic-settings-section";
import { StyleSettingsSection } from "./config/style-settings-section";
import { DisplaySettingsSection } from "./config/display-settings-section";
import { FilterSettingsSection } from "./config/filter-settings-section";

/** Shape of the widget config form (mirrors FormData in widget-config-modal). */
interface WidgetFormData {
  widget_type: EAnalyticsWidgetType;
  title: string;
  chart_property: string;
  chart_metric: string;
  config: Record<string, unknown>;
  position: { row: number; col: number; width: number; height: number };
}

type ConfigTabKey = "type" | "basic" | "style" | "display" | "filters";

interface WidgetConfigTabContentProps {
  activeTab: ConfigTabKey;
  widgetType: EAnalyticsWidgetType;
  /* eslint-disable @typescript-eslint/no-explicit-any */
  control: Control<any>;
  errors: FieldErrors<WidgetFormData>;
  onWidgetTypeChange: (type: EAnalyticsWidgetType) => void;
}

/** Renders the active tab panel inside the widget config modal. */
export const WidgetConfigTabContent = ({
  activeTab,
  widgetType,
  control,
  errors,
  onWidgetTypeChange,
}: WidgetConfigTabContentProps) => (
  <div className="mt-4 max-h-96 overflow-y-auto">
    {activeTab === "type" && (
      <WidgetTypeSelector selectedType={widgetType} onChange={onWidgetTypeChange} />
    )}
    {activeTab === "basic" && <BasicSettingsSection control={control} errors={errors} />}
    {activeTab === "style" && <StyleSettingsSection control={control} widgetType={widgetType} />}
    {activeTab === "display" && <DisplaySettingsSection control={control} widgetType={widgetType} />}
    {activeTab === "filters" && <FilterSettingsSection control={control} />}
  </div>
);
