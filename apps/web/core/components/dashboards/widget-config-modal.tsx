/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import type { IAnalyticsDashboardWidget, TAnalyticsWidgetCreate, TAnalyticsWidgetUpdate } from "@plane/types";
import { EAnalyticsWidgetType } from "@plane/types";
import { ANALYTICS_DEFAULT_WIDGET_CONFIGS, ANALYTICS_DEFAULT_WIDGET_SIZES } from "@plane/constants";
import { Button, ModalCore, EModalPosition, EModalWidth } from "@plane/ui";
import { cn } from "@plane/utils";
import { X } from "lucide-react";
import { WidgetTypeSelector } from "./config/widget-type-selector";
import { BasicSettingsSection } from "./config/basic-settings-section";
import { StyleSettingsSection } from "./config/style-settings-section";
import { DisplaySettingsSection } from "./config/display-settings-section";

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
  config: {
    color_preset: string;
    fill_opacity?: number;
    show_border?: boolean;
    smoothing?: boolean;
    show_legend?: boolean;
    show_tooltip?: boolean;
    center_value?: boolean;
    show_markers?: boolean;
  };
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
        <div className="flex items-center justify-between border-b border-custom-border-200 px-5 py-4">
          <h3 className="text-lg font-semibold text-custom-text-100">{widget ? "Configure Widget" : "Add Widget"}</h3>
          <button
            type="button"
            onClick={handleClose}
            className="flex h-6 w-6 items-center justify-center rounded hover:bg-custom-background-80"
          >
            <X className="h-4 w-4 text-custom-text-300" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={(e) => void handleSubmit(handleFormSubmit)(e)}>
          <div className="px-5 py-4">
            {/* Tab buttons */}
            <div className="flex w-full items-center gap-1.5 rounded-md p-0.5 bg-custom-background-80">
              {CONFIG_TABS.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    "flex items-center justify-center p-1 min-w-fit w-full text-13 font-medium outline-none cursor-pointer transition-all rounded-sm",
                    activeTab === tab.key
                      ? "bg-custom-background-100 text-custom-text-100 shadow-sm"
                      : "text-custom-text-400 hover:text-custom-text-300 hover:bg-custom-background-90"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="mt-4 max-h-96 overflow-y-auto">
              {activeTab === "type" && (
                <WidgetTypeSelector selectedType={widgetType} onChange={(type) => setValue("widget_type", type)} />
              )}
              {activeTab === "basic" && <BasicSettingsSection control={control} errors={errors} />}
              {activeTab === "style" && <StyleSettingsSection control={control} widgetType={widgetType} />}
              {activeTab === "display" && <DisplaySettingsSection control={control} widgetType={widgetType} />}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 border-t border-custom-border-200 px-5 py-4">
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
