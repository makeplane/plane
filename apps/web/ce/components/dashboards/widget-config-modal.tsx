/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * Widget configuration modal for Custom Dashboards (CE).
 * Fields match DashboardWidget backend model fields.
 */

import { useState, useEffect } from "react";
import { observer } from "mobx-react";
import { useForm } from "react-hook-form";
import { X } from "lucide-react";
import { Button } from "@plane/propel/button";
import { ModalCore, EModalPosition, EModalWidth, TabList } from "@plane/ui";
import { Tab } from "@headlessui/react";
import { WidgetConfigTabContent } from "./widget-config-tab-content";
import { WidgetPreviewPanel } from "./config/widget-preview-panel";

/** Form data shape matching backend DashboardWidget model */
export interface WidgetFormData {
  name: string;
  chart_type: string;
  chart_model: string;
  x_axis_property: string;
  y_axis_metric: string;
  group_by: string | null;
  config: Record<string, unknown>;
  filters: Record<string, unknown>;
  width: number;
  height: number;
}

interface WidgetConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: WidgetFormData) => Promise<void>;
  widget?: WidgetFormData | null;
}

const CONFIG_TABS = [
  { key: "type", label: "Type" },
  { key: "basic", label: "Basic" },
  { key: "style", label: "Style" },
  { key: "display", label: "Display" },
  { key: "filters", label: "Filters" },
] as const;

export type ConfigTabKey = (typeof CONFIG_TABS)[number]["key"];

const DEFAULT_FORM: WidgetFormData = {
  name: "",
  chart_type: "BAR_CHART",
  chart_model: "BASIC",
  x_axis_property: "PRIORITIES",
  y_axis_metric: "WORK_ITEM_COUNT",
  group_by: null,
  config: { color_preset: "modern", show_legend: true, show_tooltip: true },
  filters: {},
  width: 6,
  height: 2,
};

const buildDefaults = (widget?: WidgetFormData | null): WidgetFormData =>
  widget
    ? {
        name: widget.name ?? "",
        chart_type: widget.chart_type ?? "BAR_CHART",
        chart_model: widget.chart_model ?? "BASIC",
        x_axis_property: widget.x_axis_property ?? "PRIORITIES",
        y_axis_metric: widget.y_axis_metric ?? "WORK_ITEM_COUNT",
        group_by: widget.group_by ?? "",
        config: widget.config ?? {},
        filters: widget.filters ?? {},
        width: widget.width ?? 6,
        height: widget.height ?? 2,
      }
    : { ...DEFAULT_FORM };

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
  } = useForm<WidgetFormData>({
    defaultValues: buildDefaults(widget),
  });

  const chartType = watch("chart_type");
  const xAxisProperty = watch("x_axis_property");
  const yAxisMetric = watch("y_axis_metric");
  const configValue = watch("config");

  useEffect(() => {
    if (isOpen) {
      reset(buildDefaults(widget));
      setActiveTab("type");
    }
  }, [widget, isOpen, reset]);

  const handleFormSubmit = async (data: WidgetFormData) => {
    try {
      setIsSubmitting(true);
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
        <div className="flex items-center justify-between border-b border-color-subtle px-5 py-4">
          <h3 className="text-lg font-semibold text-color-primary">{widget ? "Configure Widget" : "Add Widget"}</h3>
          <button
            type="button"
            onClick={handleClose}
            className="flex h-6 w-6 items-center justify-center rounded hover:bg-layer-2"
          >
            <X className="h-4 w-4 text-color-tertiary" />
          </button>
        </div>

        <form onSubmit={(e) => void handleSubmit(handleFormSubmit)(e)}>
          <div className="flex gap-4 px-5 py-4">
            <div className="w-[55%] min-w-0">
              <Tab.Group
                selectedIndex={CONFIG_TABS.findIndex((t) => t.key === activeTab)}
                onChange={(index) => setActiveTab(CONFIG_TABS[index].key)}
              >
                <TabList
                  autoWrap={false}
                  tabs={CONFIG_TABS.map((tab) => ({ key: tab.key, label: tab.label }))}
                  selectedTab={activeTab}
                  tabListClassName="bg-layer-2"
                />
              </Tab.Group>
              <WidgetConfigTabContent
                activeTab={activeTab}
                chartType={chartType}
                control={control}
                errors={errors}
                onChartTypeChange={(type) => setValue("chart_type", type)}
              />
            </div>
            <div className="w-[45%] min-w-0">
              <WidgetPreviewPanel
                widgetType={chartType}
                config={configValue}
                chartProperty={xAxisProperty}
                chartMetric={yAxisMetric}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-color-subtle px-5 py-4">
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
