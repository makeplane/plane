# Phase 8: Widget Configuration UI

## Context Links

- **Parent Plan**: [plan.md](./plan.md)
- **Previous Phase**: [Phase 7: Widget Components & Grid](./phase-07-widget-components-grid.md)
- **Research Reports**:
  - [Frontend Patterns](./research/researcher-02-frontend-patterns.md)
  - [Brainstorm](../reports/brainstorm-260214-2203-dashboard-pro-feature.md)
- **Dependencies**: All previous phases must be completed

## Overview

**Date**: 2026-02-14
**Priority**: P1
**Status**: Completed
**Estimated Effort**: 7 hours

Implement comprehensive widget configuration UI with chart type selection, property/metric pickers, color presets, and style controls.

## Key Insights

1. **Form Management**: Use react-hook-form for complex form state
2. **Live Preview**: Show chart preview as config changes (optional)
3. **Conditional Fields**: Different options per widget type
4. **Color Visualization**: Show color swatches for presets
5. **Default Values**: Use DEFAULT_WIDGET_CONFIGS from constants

## Requirements

### Functional Requirements

1. Widget configuration modal with tabbed interface
2. Chart type selector with icons and descriptions
3. Property dropdown (x-axis: priority, state, assignee, etc.)
4. Metric dropdown (y-axis: count, estimate_points)
5. Color preset selector with visual swatches
6. Style controls: fill opacity, border, smoothing, markers
7. Display controls: legend, tooltip, center value
8. Widget title input
9. Save and cancel actions
10. Form validation

### Non-Functional Requirements

1. Form state persists during editing
2. Validation feedback inline
3. Responsive modal layout
4. Keyboard navigation support
5. Preview updates in real-time (optional enhancement)

## Architecture

### Component Hierarchy

```
WidgetConfigModal
├── ModalHeader (title, close)
├── WidgetTypeSelector
│   └── TypeCard[] (6 types with icons)
├── ConfigForm
│   ├── BasicSettings
│   │   ├── TitleInput
│   │   ├── PropertySelect
│   │   └── MetricSelect
│   ├── StyleSettings
│   │   ├── ColorPresetSelector
│   │   ├── FillOpacitySlider
│   │   ├── BorderToggle
│   │   └── SmoothingToggle (conditional)
│   └── DisplaySettings
│       ├── LegendToggle
│       ├── TooltipToggle
│       ├── CenterValueToggle (donut/pie only)
│       └── MarkersToggle (line only)
└── ModalFooter (cancel, save)
```

### Form State Flow

1. Modal opens → load widget config or defaults
2. User changes field → update form state
3. User changes type → reset config to type defaults
4. User submits → validate → call create/update API
5. Success → close modal → refresh widget

## Related Code Files

### Files to Create

<!-- Updated: Validation Session 1 - Config components moved to core/components/dashboards/ for reusability -->

1. **`apps/web/core/components/dashboards/widget-config-modal.tsx`**
   - Main widget configuration modal

2. **`apps/web/core/components/dashboards/config/widget-type-selector.tsx`**
   - Widget type selection grid

3. **`apps/web/core/components/dashboards/config/basic-settings-section.tsx`**
   - Title, property, metric inputs

4. **`apps/web/core/components/dashboards/config/style-settings-section.tsx`**
   - Color preset, opacity, border, smoothing

5. **`apps/web/core/components/dashboards/config/display-settings-section.tsx`**
   - Legend, tooltip, center value, markers

6. **`apps/web/core/components/dashboards/config/color-preset-selector.tsx`**
   - Color preset visual selector

### Files to Modify

1. **`apps/web/app/(all)/[workspaceSlug]/(projects)/dashboards/[dashboardId]/page.tsx`**
   - Wire up widget config modal

2. **`apps/web/app/(all)/[workspaceSlug]/(projects)/dashboards/[dashboardId]/components/widget-card.tsx`**
   - Connect configure action to modal

## Implementation Steps

### Step 1: Create Widget Type Selector

<!-- Updated: Validation Session 2 - ALL config components moved to core/components/dashboards/config/ -->
**File**: `apps/web/core/components/dashboards/config/widget-type-selector.tsx`

```typescript
import { observer } from "mobx-react";
import {
  BarChart3,
  LineChart,
  AreaChart,
  PieChart,
  Hash,
} from "lucide-react";
import type { EWidgetType } from "@plane/types";

interface WidgetTypeSelectorProps {
  selectedType: EWidgetType;
  onChange: (type: EWidgetType) => void;
}

const WIDGET_TYPES = [
  {
    type: "bar" as EWidgetType,
    label: "Bar Chart",
    description: "Compare values across categories",
    icon: BarChart3,
  },
  {
    type: "line" as EWidgetType,
    label: "Line Chart",
    description: "Show trends over time",
    icon: LineChart,
  },
  {
    type: "area" as EWidgetType,
    label: "Area Chart",
    description: "Visualize cumulative data",
    icon: AreaChart,
  },
  {
    type: "donut" as EWidgetType,
    label: "Donut Chart",
    description: "Proportions with center hole",
    icon: PieChart,
  },
  {
    type: "pie" as EWidgetType,
    label: "Pie Chart",
    description: "Show proportions",
    icon: PieChart,
  },
  {
    type: "number" as EWidgetType,
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
            className={`flex flex-col items-start rounded-lg border-2 p-3 text-left transition-all ${
              selectedType === type
                ? "border-custom-primary-100 bg-custom-primary-100/10"
                : "border-custom-border-200 hover:border-custom-border-300"
            }`}
          >
            <Icon
              className={`mb-2 h-6 w-6 ${
                selectedType === type
                  ? "text-custom-primary-100"
                  : "text-custom-text-300"
              }`}
            />
            <div className="font-medium text-custom-text-100">{label}</div>
            <div className="text-xs text-custom-text-300">{description}</div>
          </button>
        ))}
      </div>
    );
  }
);

WidgetTypeSelector.displayName = "WidgetTypeSelector";
```

### Step 2: Create Color Preset Selector

**File**: `apps/web/core/components/dashboards/config/color-preset-selector.tsx`

```typescript
import { observer } from "mobx-react";
import { COLOR_PRESETS } from "@plane/constants";

interface ColorPresetSelectorProps {
  selectedPreset: string;
  onChange: (presetId: string) => void;
}

export const ColorPresetSelector = observer(
  ({ selectedPreset, onChange }: ColorPresetSelectorProps) => {
    return (
      <div className="space-y-3">
        {Object.values(COLOR_PRESETS).map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => onChange(preset.id)}
            className={`flex w-full items-center gap-3 rounded-lg border-2 p-3 text-left transition-all ${
              selectedPreset === preset.id
                ? "border-custom-primary-100 bg-custom-primary-100/10"
                : "border-custom-border-200 hover:border-custom-border-300"
            }`}
          >
            {/* Color Swatches */}
            <div className="flex gap-1">
              {preset.colors.slice(0, 6).map((color, index) => (
                <div
                  key={index}
                  className="h-8 w-8 rounded"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>

            {/* Preset Info */}
            <div className="flex-1">
              <div className="font-medium text-custom-text-100">
                {preset.name}
              </div>
              <div className="text-xs text-custom-text-300">
                {preset.description}
              </div>
            </div>
          </button>
        ))}
      </div>
    );
  }
);

ColorPresetSelector.displayName = "ColorPresetSelector";
```

### Step 3: Create Basic Settings Section

**File**: `apps/web/core/components/dashboards/config/basic-settings-section.tsx`

```typescript
import { observer } from "mobx-react";
import { Controller, Control } from "react-hook-form";
import { Input } from "@plane/propel/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@plane/propel/select";
import {
  CHART_PROPERTY_OPTIONS,
  CHART_METRIC_OPTIONS,
} from "@plane/constants";

interface BasicSettingsSectionProps {
  control: Control<any>;
  errors: any;
}

export const BasicSettingsSection = observer(
  ({ control, errors }: BasicSettingsSectionProps) => {
    return (
      <div className="space-y-4">
        {/* Title */}
        <div>
          <label className="mb-1 block text-sm font-medium">
            Widget Title <span className="text-red-500">*</span>
          </label>
          <Controller
            name="title"
            control={control}
            rules={{ required: "Title is required" }}
            render={({ field }) => (
              <Input
                {...field}
                placeholder="Issues by Priority"
                hasError={!!errors.title}
              />
            )}
          />
          {errors.title && (
            <p className="mt-1 text-xs text-red-500">{errors.title.message}</p>
          )}
        </div>

        {/* Property (X-Axis) */}
        <div>
          <label className="mb-1 block text-sm font-medium">
            Property (X-Axis) <span className="text-red-500">*</span>
          </label>
          <Controller
            name="chart_property"
            control={control}
            rules={{ required: "Property is required" }}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select property" />
                </SelectTrigger>
                <SelectContent>
                  {CHART_PROPERTY_OPTIONS.map((option) => (
                    <SelectItem key={option.key} value={option.key}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.chart_property && (
            <p className="mt-1 text-xs text-red-500">
              {errors.chart_property.message}
            </p>
          )}
        </div>

        {/* Metric (Y-Axis) */}
        <div>
          <label className="mb-1 block text-sm font-medium">
            Metric (Y-Axis) <span className="text-red-500">*</span>
          </label>
          <Controller
            name="chart_metric"
            control={control}
            rules={{ required: "Metric is required" }}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select metric" />
                </SelectTrigger>
                <SelectContent>
                  {CHART_METRIC_OPTIONS.map((option) => (
                    <SelectItem key={option.key} value={option.key}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.chart_metric && (
            <p className="mt-1 text-xs text-red-500">
              {errors.chart_metric.message}
            </p>
          )}
        </div>
      </div>
    );
  }
);

BasicSettingsSection.displayName = "BasicSettingsSection";
```

### Step 4: Create Style Settings Section

**File**: `apps/web/core/components/dashboards/config/style-settings-section.tsx`

```typescript
import { observer } from "mobx-react";
import { Controller, Control } from "react-hook-form";
import { Slider } from "@plane/propel/slider";
import { Switch } from "@plane/propel/switch";
import type { EWidgetType } from "@plane/types";
import { ColorPresetSelector } from "./color-preset-selector";

interface StyleSettingsSectionProps {
  control: Control<any>;
  widgetType: EWidgetType;
}

export const StyleSettingsSection = observer(
  ({ control, widgetType }: StyleSettingsSectionProps) => {
    const showFillOpacity = ["bar", "area"].includes(widgetType);
    const showSmoothing = ["line", "area"].includes(widgetType);
    const showBorder = widgetType === "bar";

    return (
      <div className="space-y-4">
        {/* Color Preset */}
        <div>
          <label className="mb-2 block text-sm font-medium">Color Preset</label>
          <Controller
            name="config.color_preset"
            control={control}
            render={({ field }) => (
              <ColorPresetSelector
                selectedPreset={field.value}
                onChange={field.onChange}
              />
            )}
          />
        </div>

        {/* Fill Opacity */}
        {showFillOpacity && (
          <div>
            <label className="mb-2 block text-sm font-medium">
              Fill Opacity
            </label>
            <Controller
              name="config.fill_opacity"
              control={control}
              render={({ field }) => (
                <div className="flex items-center gap-4">
                  <Slider
                    value={[field.value * 100]}
                    onValueChange={(values) => field.onChange(values[0] / 100)}
                    min={0}
                    max={100}
                    step={10}
                    className="flex-1"
                  />
                  <span className="text-sm text-custom-text-300">
                    {Math.round(field.value * 100)}%
                  </span>
                </div>
              )}
            />
          </div>
        )}

        {/* Show Border */}
        {showBorder && (
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Show Border</label>
            <Controller
              name="config.show_border"
              control={control}
              render={({ field }) => (
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              )}
            />
          </div>
        )}

        {/* Smoothing */}
        {showSmoothing && (
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Smooth Lines</label>
            <Controller
              name="config.smoothing"
              control={control}
              render={({ field }) => (
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              )}
            />
          </div>
        )}
      </div>
    );
  }
);

StyleSettingsSection.displayName = "StyleSettingsSection";
```

### Step 5: Create Display Settings Section

**File**: `apps/web/core/components/dashboards/config/display-settings-section.tsx`

```typescript
import { observer } from "mobx-react";
import { Controller, Control } from "react-hook-form";
import { Switch } from "@plane/propel/switch";
import type { EWidgetType } from "@plane/types";

interface DisplaySettingsSectionProps {
  control: Control<any>;
  widgetType: EWidgetType;
}

export const DisplaySettingsSection = observer(
  ({ control, widgetType }: DisplaySettingsSectionProps) => {
    const showLegend = widgetType !== "number";
    const showTooltip = widgetType !== "number";
    const showCenterValue = ["donut", "pie"].includes(widgetType);
    const showMarkers = widgetType === "line";

    return (
      <div className="space-y-4">
        {/* Legend */}
        {showLegend && (
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Show Legend</label>
            <Controller
              name="config.show_legend"
              control={control}
              render={({ field }) => (
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              )}
            />
          </div>
        )}

        {/* Tooltip */}
        {showTooltip && (
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Show Tooltip</label>
            <Controller
              name="config.show_tooltip"
              control={control}
              render={({ field }) => (
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              )}
            />
          </div>
        )}

        {/* Center Value */}
        {showCenterValue && (
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Show Center Value</label>
            <Controller
              name="config.center_value"
              control={control}
              render={({ field }) => (
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              )}
            />
          </div>
        )}

        {/* Markers */}
        {showMarkers && (
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Show Data Points</label>
            <Controller
              name="config.show_markers"
              control={control}
              render={({ field }) => (
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              )}
            />
          </div>
        )}
      </div>
    );
  }
);

DisplaySettingsSection.displayName = "DisplaySettingsSection";
```

### Step 6: Create Widget Config Modal

**File**: `apps/web/core/components/dashboards/widget-config-modal.tsx`

```typescript
import { observer } from "mobx-react";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import type { IDashboardWidget, EWidgetType, TWidgetCreate, TWidgetUpdate } from "@plane/types";
import { DEFAULT_WIDGET_CONFIGS, DEFAULT_WIDGET_SIZES } from "@plane/constants";
import { Button } from "@plane/propel/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@plane/propel/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@plane/propel/tabs";

import { WidgetTypeSelector } from "./config/widget-type-selector";
import { BasicSettingsSection } from "./config/basic-settings-section";
import { StyleSettingsSection } from "./config/style-settings-section";
import { DisplaySettingsSection } from "./config/display-settings-section";

interface WidgetConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TWidgetCreate | TWidgetUpdate) => Promise<void>;
  widget?: IDashboardWidget | null;
}

interface FormData {
  widget_type: EWidgetType;
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

export const WidgetConfigModal = observer(
  ({ isOpen, onClose, onSubmit, widget }: WidgetConfigModalProps) => {
    const [isSubmitting, setIsSubmitting] = useState(false);

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
            widget_type: "bar" as EWidgetType,
            title: "",
            chart_property: "priority",
            chart_metric: "count",
            config: DEFAULT_WIDGET_CONFIGS.bar,
            position: { row: 0, col: 0, ...DEFAULT_WIDGET_SIZES.bar },
          },
    });

    const widgetType = watch("widget_type");

    // Reset config when widget type changes
    useEffect(() => {
      if (!widget && widgetType) {
        setValue("config", DEFAULT_WIDGET_CONFIGS[widgetType] || {});
        setValue("position", {
          row: 0,
          col: 0,
          ...DEFAULT_WIDGET_SIZES[widgetType],
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
      onClose();
    };

    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {widget ? "Configure Widget" : "Add Widget"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit(handleFormSubmit)}>
            <Tabs defaultValue="type" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="type">Type</TabsTrigger>
                <TabsTrigger value="basic">Basic</TabsTrigger>
                <TabsTrigger value="style">Style</TabsTrigger>
                <TabsTrigger value="display">Display</TabsTrigger>
              </TabsList>

              {/* Type Tab */}
              <TabsContent value="type" className="space-y-4">
                <WidgetTypeSelector
                  selectedType={widgetType}
                  onChange={(type) => setValue("widget_type", type)}
                />
              </TabsContent>

              {/* Basic Tab */}
              <TabsContent value="basic" className="space-y-4">
                <BasicSettingsSection control={control} errors={errors} />
              </TabsContent>

              {/* Style Tab */}
              <TabsContent value="style" className="space-y-4">
                <StyleSettingsSection control={control} widgetType={widgetType} />
              </TabsContent>

              {/* Display Tab */}
              <TabsContent value="display" className="space-y-4">
                <DisplaySettingsSection
                  control={control}
                  widgetType={widgetType}
                />
              </TabsContent>
            </Tabs>

            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={isSubmitting}>
                {isSubmitting
                  ? "Saving..."
                  : widget
                  ? "Update Widget"
                  : "Add Widget"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    );
  }
);

WidgetConfigModal.displayName = "WidgetConfigModal";
```

### Step 7: Wire Up Config Modal in Dashboard Page

Update the dashboard detail page to use the config modal for add/edit operations.

## Todo List

- [ ] Create widget type selector component
- [ ] Create color preset selector component
- [ ] Create basic settings section
- [ ] Create style settings section
- [ ] Create display settings section
- [ ] Create widget config modal
- [ ] Wire up add widget functionality
- [ ] Wire up edit widget functionality
- [ ] Wire up delete widget functionality
- [ ] Test form validation
- [ ] Test widget type switching
- [ ] Test color preset selection
- [ ] Test conditional fields (per widget type)
- [ ] Test form submission (create)
- [ ] Test form submission (update)
- [ ] Verify defaults from constants apply
- [ ] Test responsive modal layout
- [ ] Add keyboard navigation support

## Success Criteria

1. ✅ Widget config modal opens for add/edit
2. ✅ All 6 widget types selectable
3. ✅ Property and metric dropdowns work
4. ✅ Color presets display with visual swatches
5. ✅ Style controls work (opacity, border, smoothing)
6. ✅ Display controls work (legend, tooltip, etc.)
7. ✅ Conditional fields show/hide per widget type
8. ✅ Form validation works
9. ✅ Create widget saves correctly
10. ✅ Update widget saves correctly
11. ✅ Delete widget works with confirmation
12. ✅ Default configs apply when creating new widget

## Risk Assessment

**Risk**: Form state gets out of sync
- **Mitigation**: Use react-hook-form controlled components

**Risk**: Widget type change loses user edits
- **Mitigation**: Confirm before resetting config

**Risk**: Color presets don't render correctly
- **Mitigation**: Test color swatch rendering with valid hex codes

**Risk**: Conditional fields cause form errors
- **Mitigation**: Clear validation errors when fields hidden

## Security Considerations

1. **Input Validation**: Form validates all user input
2. **XSS Prevention**: React auto-escapes all text
3. **API Validation**: Backend validates widget config
4. **No Injection**: All values passed through safe APIs

## Completion

This phase completes the Dashboard Pro feature implementation. All 8 phases provide:
- ✅ Backend models and API endpoints
- ✅ Frontend types, constants, and services
- ✅ MobX store for state management
- ✅ Navigation and routing
- ✅ Dashboard CRUD UI
- ✅ Widget components with charts
- ✅ Widget configuration UI

**Total Estimated Effort**: 32 hours
**Implementation Ready**: Yes
