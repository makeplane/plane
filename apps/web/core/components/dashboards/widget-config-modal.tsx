/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import type {
  IAnalyticsDashboardWidget,
  IAnalyticsWidgetConfig,
  TAnalyticsWidgetCreate,
  TAnalyticsWidgetUpdate,
} from "@plane/types";
import { EAnalyticsWidgetType } from "@plane/types";
import { ANALYTICS_DEFAULT_WIDGET_CONFIGS, ANALYTICS_DEFAULT_WIDGET_SIZES } from "@plane/constants";
import { Button } from "@plane/propel/button";
import { ModalCore, EModalPosition, EModalWidth, TabList } from "@plane/ui";
import { Tab } from "@headlessui/react";
import { X } from "lucide-react";
import { WidgetPreviewPanel } from "./config/widget-preview-panel";
import { WidgetConfigTabContent } from "./widget-config-tab-content";

interface WidgetConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TAnalyticsWidgetCreate | TAnalyticsWidgetUpdate) => Promise<void>;
  widget?: IAnalyticsDashboardWidget | null;
}

interface FormData {
  widget_type: EAnalyticsWidgetType;
  title: string;
  chart_property: string;
  chart_metric: string;
  config: IAnalyticsWidgetConfig;
  position: { row: number; col: number; width: number; height: number };
}

/** Type guard for date range filter values */
const isDateRangeFilter = (v: unknown): v is { after?: string; before?: string } =>
  typeof v === "object" && v !== null && !Array.isArray(v) && ("after" in v || "before" in v);

const CONFIG_TABS = [
  { key: "type", label: "Type" },
  { key: "basic", label: "Basic" },
  { key: "style", label: "Style" },
  { key: "display", label: "Display" },
  { key: "filters", label: "Filters" },
] as const;

type ConfigTabKey = (typeof CONFIG_TABS)[number]["key"];

const buildDefaults = (widget?: IAnalyticsDashboardWidget | null): FormData =>
  widget
    ? {
        widget_type: widget.widget_type,
        title: widget.title,
        chart_property: widget.chart_property,
        chart_metric: widget.chart_metric,
        config: widget.config,
        position: widget.position,
      }
    : {
        widget_type: EAnalyticsWidgetType.BAR,
        title: "",
        chart_property: "priority",
        chart_metric: "count",
        config: (ANALYTICS_DEFAULT_WIDGET_CONFIGS.bar || {}) as IAnalyticsWidgetConfig,
        position: { row: 0, col: 0, ...(ANALYTICS_DEFAULT_WIDGET_SIZES.bar || { width: 6, height: 4 }) },
      };

export const WidgetConfigModal = observer(({ isOpen, onClose, onSubmit, widget }: WidgetConfigModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<ConfigTabKey>("type");

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<FormData>({ defaultValues: buildDefaults(widget) });

  const widgetType = watch("widget_type");
  const chartProperty = watch("chart_property");
  const chartMetric = watch("chart_metric");
  const configValue = watch("config");
  const filtersValue = watch("config.filters");

  // Count active filters for badge display
  const activeFilterCount = (() => {
    if (!filtersValue || typeof filtersValue !== "object") return 0;
    let count = 0;
    for (const [, v] of Object.entries(filtersValue as Record<string, unknown>)) {
      if (Array.isArray(v) && v.length > 0) count++;
      else if (isDateRangeFilter(v) && (v.after || v.before)) count++;
    }
    return count;
  })();

  useEffect(() => {
    if (isOpen) reset(buildDefaults(widget));
  }, [widget, isOpen, reset]);

  useEffect(() => {
    if (!widget && widgetType) {
      const defaultConfig = ANALYTICS_DEFAULT_WIDGET_CONFIGS[widgetType] || {};
      const defaultSize = ANALYTICS_DEFAULT_WIDGET_SIZES[widgetType] || { width: 6, height: 4 };
      setValue("config", defaultConfig as FormData["config"]);
      setValue("position", { row: 0, col: 0, ...defaultSize });
    }
  }, [widgetType, widget, setValue]);

  const handleFormSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true);
      if (data.config.filters) {
        const cleaned = Object.fromEntries(
          Object.entries(data.config.filters).filter(([, v]) => {
            if (Array.isArray(v)) return v.length > 0;
            if (isDateRangeFilter(v)) return v.after || v.before;
            return false;
          })
        );
        data.config.filters = Object.keys(cleaned).length > 0 ? (cleaned as typeof data.config.filters) : undefined;
      }
      await onSubmit(data);
      reset();
      onClose();
    } catch (error) {
      console.error("Failed to save widget:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    reset();
    setActiveTab("type");
    onClose();
  };

  return (
    <ModalCore isOpen={isOpen} handleClose={handleClose} position={EModalPosition.CENTER} width={EModalWidth.XXL}>
      <div className="flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-subtle px-5 py-4">
          <h3 className="text-lg font-semibold text-primary">{widget ? "Configure Widget" : "Add Widget"}</h3>
          <button
            type="button"
            onClick={handleClose}
            className="flex h-6 w-6 items-center justify-center rounded hover:bg-layer-2"
          >
            <X className="h-4 w-4 text-tertiary" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={(e) => void handleSubmit(handleFormSubmit)(e)}>
          <div className="flex gap-4 px-5 py-4">
            <div className="w-[55%] min-w-0">
              <div className="w-full">
                <Tab.Group
                  selectedIndex={CONFIG_TABS.findIndex((t) => t.key === activeTab)}
                  onChange={(index) => setActiveTab(CONFIG_TABS[index].key)}
                >
                  <TabList
                    autoWrap={false}
                    tabs={CONFIG_TABS.map((tab) => ({
                      key: tab.key,
                      label: (
                        <span className="flex items-center gap-1">
                          {tab.label}
                          {tab.key === "filters" && activeFilterCount > 0 && (
                            <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-primary px-1 text-[10px] font-medium text-white">
                              {activeFilterCount}
                            </span>
                          )}
                        </span>
                      ),
                    }))}
                    selectedTab={activeTab}
                    tabListClassName="bg-layer-2"
                  />
                </Tab.Group>
              </div>
              <WidgetConfigTabContent
                activeTab={activeTab}
                widgetType={widgetType}
                control={control}
                errors={errors}
                onWidgetTypeChange={(type) => setValue("widget_type", type)}
              />
            </div>
            <div className="w-[45%] min-w-0">
              <WidgetPreviewPanel
                widgetType={widgetType}
                config={(configValue ? { ...configValue } : {}) as IAnalyticsWidgetConfig}
                chartProperty={chartProperty}
                chartMetric={chartMetric}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-subtle px-5 py-4">
            <Button type="button" variant="secondary" size="sm" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" loading={isSubmitting} disabled={isSubmitting}>
              {widget ? "Update Widget" : "Add Widget"}
            </Button>
          </div>
        </form>
      </div>
    </ModalCore>
  );
});
