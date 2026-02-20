/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import type { IAnalyticsDashboardWidget, IAnalyticsWidgetConfig, TAnalyticsWidgetCreate, TAnalyticsWidgetUpdate } from "@plane/types";
import { EAnalyticsWidgetType } from "@plane/types";
import { ANALYTICS_DEFAULT_WIDGET_CONFIGS, ANALYTICS_DEFAULT_WIDGET_SIZES } from "@plane/constants";
import { Button, ModalCore, EModalPosition, EModalWidth, TabList } from "@plane/ui";
import { Tab } from "@headlessui/react";
import { X } from "lucide-react";
import { WidgetTypeSelector } from "./config/widget-type-selector";
import { BasicSettingsSection } from "./config/basic-settings-section";
import { StyleSettingsSection } from "./config/style-settings-section";
import { DisplaySettingsSection } from "./config/display-settings-section";
import { FilterSettingsSection } from "./config/filter-settings-section";
import { WidgetPreviewPanel } from "./config/widget-preview-panel";

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
  position: {
    row: number;
    col: number;
    width: number;
    height: number;
  };
}

const CONFIG_TABS = [
  { key: "type", label: "Type" },
  { key: "basic", label: "Basic" },
  { key: "style", label: "Style" },
  { key: "display", label: "Display" },
  { key: "filters", label: "Filters" },
] as const;

type ConfigTabKey = (typeof CONFIG_TABS)[number]["key"];

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
  } = useForm<FormData>({
    defaultValues: widget
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
        config: ANALYTICS_DEFAULT_WIDGET_CONFIGS.bar || {},
        position: {
          row: 0,
          col: 0,
          ...(ANALYTICS_DEFAULT_WIDGET_SIZES.bar || { width: 6, height: 4 }),
        },
      },
  });

  const widgetType = watch("widget_type");
  const chartProperty = watch("chart_property");
  const chartMetric = watch("chart_metric");
  const configValue = watch("config");
  const filtersValue = watch("config.filters");

  // Count active filters for badge display
  const activeFilterCount = (() => {
    if (!filtersValue || typeof filtersValue !== "object") return 0;
    let count = 0;
    for (const [, v] of Object.entries(filtersValue)) {
      if (Array.isArray(v) && v.length > 0) count++;
      else if (v && typeof v === "object" && (("after" in v && v.after) || ("before" in v && v.before))) count++;
    }
    return count;
  })();

  // Reset form when modal opens with different widget
  useEffect(() => {
    if (isOpen) {
      reset(
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
            config: ANALYTICS_DEFAULT_WIDGET_CONFIGS.bar || {},
            position: {
              row: 0,
              col: 0,
              ...(ANALYTICS_DEFAULT_WIDGET_SIZES.bar || { width: 6, height: 4 }),
            },
          }
      );
    }
  }, [widget, isOpen, reset]);

  // Reset config when widget type changes (only for new widgets)
  useEffect(() => {
    if (!widget && widgetType) {
      const defaultConfig = ANALYTICS_DEFAULT_WIDGET_CONFIGS[widgetType] || {};
      const defaultSize = ANALYTICS_DEFAULT_WIDGET_SIZES[widgetType] || {
        width: 6,
        height: 4,
      };
      setValue("config", defaultConfig as FormData["config"]);
      setValue("position", {
        row: 0,
        col: 0,
        ...defaultSize,
      });
    }
  }, [widgetType, widget, setValue]);

  const handleFormSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true);
      // Sanitize empty filters before submitting
      if (data.config.filters) {
        const cleaned = Object.fromEntries(
          Object.entries(data.config.filters).filter(([, v]) => {
            if (Array.isArray(v)) return v.length > 0;
            if (v && typeof v === "object") return ("after" in v && v.after) || ("before" in v && v.before);
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

        {/* Form — side-by-side: config (55%) + preview (45%) */}
        <form onSubmit={(e) => void handleSubmit(handleFormSubmit)(e)}>
          <div className="flex gap-4 px-5 py-4">
            {/* Config panel (left) */}
            <div className="w-[55%] min-w-0">
              {/* Tab buttons */}
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

              {/* Tab content */}
              <div className="mt-4 max-h-96 overflow-y-auto">
                {activeTab === "type" && (
                  <WidgetTypeSelector selectedType={widgetType} onChange={(type) => setValue("widget_type", type)} />
                )}
                {activeTab === "basic" && <BasicSettingsSection control={control} errors={errors} />}
                {activeTab === "style" && <StyleSettingsSection control={control} widgetType={widgetType} />}
                {activeTab === "display" && <DisplaySettingsSection control={control} widgetType={widgetType} />}
                {activeTab === "filters" && <FilterSettingsSection control={control} />}
              </div>
            </div>

            {/* Preview panel (right) */}
            <div className="w-[45%] min-w-0">
              <WidgetPreviewPanel
                widgetType={widgetType}
                config={(configValue ? { ...configValue } : {}) as any}
                chartProperty={chartProperty}
                chartMetric={chartMetric}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 border-t border-subtle px-5 py-4">
            <Button type="button" variant="neutral-primary" size="sm" onClick={handleClose} disabled={isSubmitting}>
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
