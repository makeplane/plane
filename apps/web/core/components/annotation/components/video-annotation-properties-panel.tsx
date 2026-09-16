"use client";

import type { PointerEvent as ReactPointerEvent } from "react";
import { Pencil } from "lucide-react";
import type { TCustomPlaylistAnnotationStrokeStyle, TCustomPlaylistAnnotationTool } from "../types/annotation.types";
import type { VIDEO_ANNOTATION_TOOLS } from "../utils/video-annotation-editor-config";
import {
  VIDEO_ANNOTATION_COLOR_PRESETS,
  VIDEO_ANNOTATION_DURATIONS,
  VIDEO_ANNOTATION_IMAGE_SIZE_LIMITS,
  VIDEO_ANNOTATION_SHAPE_BACKGROUND_OPACITY_LIMITS,
  VIDEO_ANNOTATION_STROKE_STYLES,
  VIDEO_ANNOTATION_STROKE_WIDTHS,
  VIDEO_ANNOTATION_TEXT_FONT_FAMILIES,
  VIDEO_ANNOTATION_TEXT_FONT_SIZES,
  VIDEO_ANNOTATION_TEXT_FONT_WEIGHTS,
  VIDEO_ANNOTATION_TOOL_BUTTON_CLASS,
} from "../utils/video-annotation-editor-config";

type VideoAnnotationToolOption = (typeof VIDEO_ANNOTATION_TOOLS)[number];

type VideoAnnotationPropertiesPanelProps = {
  annotationColor: string;
  annotationColorHsv: {
    hue: number;
    saturation: number;
    value: number;
  };
  annotationColorInputValue: string;
  annotationColorRgb: {
    blue: number;
    green: number;
    red: number;
  };
  annotationDurationSeconds: number;
  annotationImageContent: string | null;
  annotationImageHeight: number;
  annotationImageWidth: number;
  annotationOpacity: number;
  annotationPositionX: number;
  annotationPositionY: number;
  annotationRotation: number;
  annotationStartTime: number;
  annotationShapeBackgroundEnabled: boolean;
  annotationShapeBackgroundOpacity: number;
  annotationStrokeStyle: TCustomPlaylistAnnotationStrokeStyle;
  annotationStrokeWidth: number;
  annotationTextFontFamily: string;
  annotationTextFontSize: number;
  annotationTextFontWeight: number;
  annotationTool: TCustomPlaylistAnnotationTool;
  isAnnotationColorPickerOpen: boolean;
  isAnnotationMode: boolean;
  isVisualAnnotationSelected: boolean;
  onAnnotationColorChange: (colorValue: string) => void;
  onAnnotationColorChannelChange: (channel: "blue" | "green" | "red", colorValue: string) => void;
  onAnnotationColorHueChange: (hueValue: string) => void;
  onAnnotationColorInputBlur: () => void;
  onAnnotationColorInputChange: (colorValue: string) => void;
  onAnnotationColorPickerPointerDown: (event: ReactPointerEvent<HTMLButtonElement>) => void;
  onAnnotationColorPickerPointerMove: (event: ReactPointerEvent<HTMLButtonElement>) => void;
  onAnnotationImageSizeChange: (dimension: "height" | "width", value: string) => void;
  onAnnotationOpacityChange: (value: string) => void;
  onAnnotationPositionChange: (axis: "x" | "y", value: string) => void;
  onAnnotationRotationChange: (value: string) => void;
  onAnnotationStartTimeChange: (value: string) => void;
  onDurationChange: (durationSeconds: number) => void;
  onShapeBackgroundOpacityChange: (value: string) => void;
  onShapeBackgroundToggle: (enabled: boolean) => void;
  onStrokeStyleChange: (strokeStyle: TCustomPlaylistAnnotationStrokeStyle) => void;
  onStrokeWidthChange: (strokeWidth: number) => void;
  onTextFontFamilyChange: (fontFamily: string) => void;
  onTextFontSizeChange: (fontSize: number) => void;
  onTextFontWeightChange: (fontWeight: number) => void;
  selectedAnnotationToolOption: VideoAnnotationToolOption | undefined;
  setIsAnnotationColorPickerOpen: (updater: (currentValue: boolean) => boolean) => void;
};

const annotationPanelOptionClass =
  "inline-flex h-8 min-w-0 items-center justify-center rounded-[5px] border border-custom-border-200 bg-custom-background-90 px-2 text-[10px] font-semibold text-custom-text-200 transition-colors hover:bg-custom-background-80 hover:text-custom-text-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-custom-primary-100/40";

export const VideoAnnotationPropertiesPanel = ({
  annotationColor,
  annotationColorHsv,
  annotationColorInputValue,
  annotationColorRgb,
  annotationDurationSeconds,
  annotationImageContent,
  annotationImageHeight,
  annotationImageWidth,
  annotationOpacity,
  annotationPositionX,
  annotationPositionY,
  annotationRotation,
  annotationStartTime,
  annotationShapeBackgroundEnabled,
  annotationShapeBackgroundOpacity,
  annotationStrokeStyle,
  annotationStrokeWidth,
  annotationTextFontFamily,
  annotationTextFontSize,
  annotationTextFontWeight,
  annotationTool,
  isAnnotationColorPickerOpen,
  isAnnotationMode,
  isVisualAnnotationSelected,
  onAnnotationColorChange,
  onAnnotationColorChannelChange,
  onAnnotationColorHueChange,
  onAnnotationColorInputBlur,
  onAnnotationColorInputChange,
  onAnnotationColorPickerPointerDown,
  onAnnotationColorPickerPointerMove,
  onAnnotationImageSizeChange,
  onAnnotationOpacityChange,
  onAnnotationPositionChange,
  onAnnotationRotationChange,
  onAnnotationStartTimeChange,
  onDurationChange,
  onShapeBackgroundOpacityChange,
  onShapeBackgroundToggle,
  onStrokeStyleChange,
  onStrokeWidthChange,
  onTextFontFamilyChange,
  onTextFontSizeChange,
  onTextFontWeightChange,
  selectedAnnotationToolOption,
  setIsAnnotationColorPickerOpen,
}: VideoAnnotationPropertiesPanelProps) => {
  const SelectedAnnotationToolIcon = selectedAnnotationToolOption?.icon ?? Pencil;
  const shouldShowImageProperties = annotationTool === "image";
  const shouldShowDurationProperties = true;
  const shouldShowShapeBackgroundProperties = annotationTool === "rectangle" || annotationTool === "ellipse";

  return (
    <div className="vertical-scrollbar scrollbar-md flex h-full min-h-0 w-full min-w-0 flex-col gap-3 overflow-x-hidden overflow-y-auto overscroll-contain rounded-[7px] border border-custom-border-200 bg-custom-background-100 p-2 shadow-sm [scrollbar-gutter:stable]">
      <div className="min-w-0">
        <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-custom-text-400">Properties</div>
        <div className="flex min-w-0 items-center gap-1.5 text-[12px] font-semibold text-custom-text-100">
          <SelectedAnnotationToolIcon className="h-3.5 w-3.5 shrink-0" />
          <span className="min-w-0 truncate">{selectedAnnotationToolOption?.label ?? "Annotation"}</span>
        </div>
      </div>

      {isAnnotationMode ? (
        <>
          {isVisualAnnotationSelected ? (
            <div className="space-y-2 border-b border-custom-border-200 pb-3">
              <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-custom-text-400">General</div>
              <div className="grid grid-cols-2 gap-1.5">
                <label className="space-y-1">
                  <span className="text-[10px] font-medium text-custom-text-300">Starts at (sec)</span>
                  <input
                    type="number"
                    min={0}
                    step={0.1}
                    value={Number(annotationStartTime.toFixed(2))}
                    onChange={(event) => onAnnotationStartTimeChange(event.currentTarget.value)}
                    className="h-8 w-full rounded-[5px] border border-custom-border-200 bg-custom-background-90 px-2 text-[11px] font-semibold text-custom-text-100 outline-none transition-colors focus:border-custom-primary-100 focus:ring-2 focus:ring-custom-primary-100/30"
                    aria-label="Annotation start in seconds"
                  />
                </label>
                <div className="space-y-1">
                  <span className="text-[10px] font-medium text-custom-text-300">Duration</span>
                  <div className="flex h-8 items-center rounded-[5px] border border-custom-border-200 bg-custom-background-90 px-2 font-mono text-[11px] font-semibold text-custom-text-100">
                    {annotationDurationSeconds}s
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { axis: "x" as const, label: "X (%)", value: annotationPositionX },
                  { axis: "y" as const, label: "Y (%)", value: annotationPositionY },
                ].map((position) => (
                  <label key={position.axis} className="space-y-1">
                    <span className="text-[10px] font-medium text-custom-text-300">{position.label}</span>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step={0.1}
                      value={Number(position.value.toFixed(1))}
                      onChange={(event) => onAnnotationPositionChange(position.axis, event.currentTarget.value)}
                      className="h-8 w-full rounded-[5px] border border-custom-border-200 bg-custom-background-90 px-2 text-[11px] font-semibold text-custom-text-100 outline-none transition-colors focus:border-custom-primary-100 focus:ring-2 focus:ring-custom-primary-100/30"
                      aria-label={`Annotation ${position.axis.toUpperCase()} position`}
                    />
                  </label>
                ))}
                <label className="space-y-1">
                  <span className="text-[10px] font-medium text-custom-text-300">Rotation</span>
                  <input
                    type="number"
                    min={0}
                    max={359}
                    step={1}
                    value={Math.round(annotationRotation)}
                    onChange={(event) => onAnnotationRotationChange(event.currentTarget.value)}
                    className="h-8 w-full rounded-[5px] border border-custom-border-200 bg-custom-background-90 px-2 text-[11px] font-semibold text-custom-text-100 outline-none transition-colors focus:border-custom-primary-100 focus:ring-2 focus:ring-custom-primary-100/30"
                    aria-label="Annotation rotation in degrees"
                  />
                </label>
              </div>
            </div>
          ) : null}

          {!shouldShowImageProperties ? (
            <div className="space-y-1.5">
              <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-custom-text-400">Color</div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAnnotationColorPickerOpen((currentValue) => !currentValue)}
                    className={[
                      "flex h-9 w-12 shrink-0 cursor-pointer items-center justify-center rounded-[5px] border border-custom-border-200 bg-custom-background-90 transition-colors hover:bg-custom-background-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-custom-primary-100/40",
                      isAnnotationColorPickerOpen ? "border-custom-primary-100 bg-custom-primary-100/10" : "",
                    ].join(" ")}
                    aria-expanded={isAnnotationColorPickerOpen}
                    aria-label={`Open annotation color picker. Current color ${annotationColor.toUpperCase()}`}
                    title={`Pick annotation color (${annotationColor.toUpperCase()})`}
                  >
                    <span
                      className="h-5 w-7 rounded-[4px] border border-custom-border-200 shadow-sm"
                      style={{ backgroundColor: annotationColor }}
                    />
                  </button>
                  <input
                    type="text"
                    value={annotationColorInputValue}
                    onBlur={onAnnotationColorInputBlur}
                    onChange={(event) => onAnnotationColorInputChange(event.currentTarget.value)}
                    className="h-9 min-w-0 flex-1 rounded-[5px] border border-custom-border-200 bg-custom-background-90 px-2 font-mono text-[11px] font-semibold uppercase text-custom-text-100 outline-none transition-colors placeholder:text-custom-text-400 focus:border-custom-primary-100 focus:ring-2 focus:ring-custom-primary-100/30"
                    aria-label="Annotation color hex value"
                    placeholder="#F97316"
                    spellCheck={false}
                  />
                </div>
                {isAnnotationColorPickerOpen ? (
                  <div className="space-y-2 rounded-[6px] border border-custom-border-200 bg-custom-background-90 p-2 shadow-sm">
                    <button
                      type="button"
                      onPointerDown={onAnnotationColorPickerPointerDown}
                      onPointerMove={onAnnotationColorPickerPointerMove}
                      className="relative h-28 w-full touch-none overflow-hidden rounded-[5px] border border-custom-border-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-custom-primary-100/40"
                      style={{
                        background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, rgba(255,255,255,0)), hsl(${annotationColorHsv.hue}, 100%, 50%)`,
                      }}
                      aria-label="Pick annotation color shade"
                      title="Drag to pick color"
                    >
                      <span
                        className="pointer-events-none absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.65)]"
                        style={{
                          left: `${annotationColorHsv.saturation * 100}%`,
                          top: `${(1 - annotationColorHsv.value) * 100}%`,
                        }}
                      />
                    </button>
                    <label className="block space-y-1">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-custom-text-400">
                        Hue
                      </span>
                      <input
                        type="range"
                        min={0}
                        max={360}
                        value={Math.round(annotationColorHsv.hue)}
                        onChange={(event) => onAnnotationColorHueChange(event.currentTarget.value)}
                        className="h-2 w-full cursor-pointer appearance-none rounded-full"
                        style={{
                          background:
                            "linear-gradient(to right, #ef4444, #eab308, #22c55e, #38bdf8, #6366f1, #a855f7, #ef4444)",
                        }}
                        aria-label="Annotation color hue"
                      />
                    </label>
                    <div className="space-y-1">
                      {[
                        { channel: "red" as const, label: "R", value: annotationColorRgb.red },
                        { channel: "green" as const, label: "G", value: annotationColorRgb.green },
                        { channel: "blue" as const, label: "B", value: annotationColorRgb.blue },
                      ].map((colorChannel) => (
                        <label key={colorChannel.channel} className="flex items-center gap-2">
                          <span className="w-4 text-[10px] font-semibold text-custom-text-300">
                            {colorChannel.label}
                          </span>
                          <input
                            type="range"
                            min={0}
                            max={255}
                            value={colorChannel.value}
                            onChange={(event) =>
                              onAnnotationColorChannelChange(colorChannel.channel, event.currentTarget.value)
                            }
                            className="h-1.5 min-w-0 flex-1 accent-custom-primary-100"
                            aria-label={`${colorChannel.label} color channel`}
                          />
                          <span className="w-6 text-right font-mono text-[10px] font-semibold text-custom-text-300">
                            {colorChannel.value}
                          </span>
                        </label>
                      ))}
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                      {VIDEO_ANNOTATION_COLOR_PRESETS.map((colorPreset) => {
                        const isSelected = annotationColor.toLowerCase() === colorPreset;

                        return (
                          <button
                            key={colorPreset}
                            type="button"
                            onClick={() => onAnnotationColorChange(colorPreset)}
                            className={[
                              "grid h-7 place-items-center rounded-[5px] border border-custom-border-200 bg-custom-background-100 transition-colors hover:bg-custom-background-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-custom-primary-100/40",
                              isSelected ? "border-custom-primary-100 ring-2 ring-custom-primary-100/30" : "",
                            ].join(" ")}
                            aria-label={`Use ${colorPreset.toUpperCase()} annotation color`}
                            aria-pressed={isSelected}
                            title={colorPreset.toUpperCase()}
                          >
                            <span
                              className="h-3.5 w-3.5 rounded-full border border-custom-border-200 shadow-sm"
                              style={{ backgroundColor: colorPreset }}
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

          {shouldShowDurationProperties ? (
            <div className="space-y-1.5">
              <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-custom-text-400">Duration</div>
              <div className="grid grid-cols-1 gap-1">
                {VIDEO_ANNOTATION_DURATIONS.map((durationSeconds) => {
                  const isSelected = annotationDurationSeconds === durationSeconds;

                  return (
                    <button
                      key={durationSeconds}
                      type="button"
                      onClick={() => onDurationChange(durationSeconds)}
                      className={[
                        annotationPanelOptionClass,
                        isSelected ? "border-custom-primary-100 bg-custom-primary-100/15 text-custom-primary-100" : "",
                      ].join(" ")}
                      aria-label={`Show annotation for ${durationSeconds} seconds`}
                      aria-pressed={isSelected}
                      title={`${durationSeconds}s duration`}
                    >
                      {durationSeconds}s
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-custom-text-400">
                Opacity
              </span>
              <span className="font-mono text-[10px] font-semibold text-custom-text-300">
                {Math.round(annotationOpacity * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={10}
              max={100}
              value={Math.round(annotationOpacity * 100)}
              onChange={(event) => onAnnotationOpacityChange(event.currentTarget.value)}
              className="h-1.5 w-full accent-custom-primary-100"
              aria-label={`${selectedAnnotationToolOption?.label ?? "Annotation"} opacity`}
            />
          </div>

          {shouldShowImageProperties ? (
            <div className="space-y-2">
              <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-custom-text-400">Image</div>
              {annotationImageContent ? (
                <div className="flex h-20 items-center justify-center overflow-hidden rounded-[5px] border border-custom-border-200 bg-custom-background-90">
                  <img
                    src={annotationImageContent}
                    alt=""
                    className="max-h-full max-w-full object-contain"
                    style={{ opacity: annotationOpacity }}
                  />
                </div>
              ) : null}
              <div className="space-y-1.5">
                <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-custom-text-400">Size</div>
                <div className="grid grid-cols-2 gap-1.5">
                  <label className="space-y-1">
                    <span className="text-[10px] font-medium text-custom-text-300">Width</span>
                    <input
                      type="number"
                      min={VIDEO_ANNOTATION_IMAGE_SIZE_LIMITS.min}
                      max={VIDEO_ANNOTATION_IMAGE_SIZE_LIMITS.max}
                      value={annotationImageWidth}
                      onChange={(event) => onAnnotationImageSizeChange("width", event.currentTarget.value)}
                      className="h-8 w-full rounded-[5px] border border-custom-border-200 bg-custom-background-90 px-2 text-[11px] font-semibold text-custom-text-100 outline-none transition-colors focus:border-custom-primary-100 focus:ring-2 focus:ring-custom-primary-100/30"
                      aria-label="Image annotation width"
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-[10px] font-medium text-custom-text-300">Height</span>
                    <input
                      type="number"
                      min={VIDEO_ANNOTATION_IMAGE_SIZE_LIMITS.min}
                      max={VIDEO_ANNOTATION_IMAGE_SIZE_LIMITS.max}
                      value={annotationImageHeight}
                      onChange={(event) => onAnnotationImageSizeChange("height", event.currentTarget.value)}
                      className="h-8 w-full rounded-[5px] border border-custom-border-200 bg-custom-background-90 px-2 text-[11px] font-semibold text-custom-text-100 outline-none transition-colors focus:border-custom-primary-100 focus:ring-2 focus:ring-custom-primary-100/30"
                      aria-label="Image annotation height"
                    />
                  </label>
                </div>
              </div>
            </div>
          ) : annotationTool === "text" ? (
            <div className="space-y-2">
              <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-custom-text-400">Text</div>
              <div className="space-y-1.5">
                <div className="text-[11px] font-medium text-custom-text-300">Font</div>
                <div className="grid grid-cols-1 gap-1">
                  {VIDEO_ANNOTATION_TEXT_FONT_FAMILIES.map((fontFamilyOption) => {
                    const isSelected = annotationTextFontFamily === fontFamilyOption.value;

                    return (
                      <button
                        key={fontFamilyOption.value}
                        type="button"
                        onClick={() => onTextFontFamilyChange(fontFamilyOption.value)}
                        className={[
                          annotationPanelOptionClass,
                          isSelected
                            ? "border-custom-primary-100 bg-custom-primary-100/15 text-custom-primary-100"
                            : "",
                        ].join(" ")}
                        aria-label={`${fontFamilyOption.label} font`}
                        aria-pressed={isSelected}
                      >
                        {fontFamilyOption.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="text-[11px] font-medium text-custom-text-300">Size</div>
                <div className="grid grid-cols-1 gap-1">
                  {VIDEO_ANNOTATION_TEXT_FONT_SIZES.map((fontSize) => {
                    const isSelected = annotationTextFontSize === fontSize;

                    return (
                      <button
                        key={fontSize}
                        type="button"
                        onClick={() => onTextFontSizeChange(fontSize)}
                        className={[
                          annotationPanelOptionClass,
                          isSelected
                            ? "border-custom-primary-100 bg-custom-primary-100/15 text-custom-primary-100"
                            : "",
                        ].join(" ")}
                        aria-label={`${fontSize}px text size`}
                        aria-pressed={isSelected}
                      >
                        {fontSize}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="text-[11px] font-medium text-custom-text-300">Weight</div>
                <div className="grid grid-cols-1 gap-1">
                  {VIDEO_ANNOTATION_TEXT_FONT_WEIGHTS.map((fontWeightOption) => {
                    const isSelected = annotationTextFontWeight === fontWeightOption.value;

                    return (
                      <button
                        key={fontWeightOption.value}
                        type="button"
                        onClick={() => onTextFontWeightChange(fontWeightOption.value)}
                        className={[
                          annotationPanelOptionClass,
                          isSelected
                            ? "border-custom-primary-100 bg-custom-primary-100/15 text-custom-primary-100"
                            : "",
                        ].join(" ")}
                        aria-label={`${fontWeightOption.label} text weight`}
                        aria-pressed={isSelected}
                      >
                        {fontWeightOption.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <>
              {shouldShowShapeBackgroundProperties ? (
                <div className="space-y-1.5">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-custom-text-400">
                    Background
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    {[
                      { label: "Hollow", value: false },
                      { label: "Fill", value: true },
                    ].map((backgroundOption) => {
                      const isSelected = annotationShapeBackgroundEnabled === backgroundOption.value;

                      return (
                        <button
                          key={backgroundOption.label}
                          type="button"
                          onClick={() => onShapeBackgroundToggle(backgroundOption.value)}
                          className={[
                            annotationPanelOptionClass,
                            isSelected
                              ? "border-custom-primary-100 bg-custom-primary-100/15 text-custom-primary-100"
                              : "",
                          ].join(" ")}
                          aria-label={`${backgroundOption.label} shape background`}
                          aria-pressed={isSelected}
                          title={backgroundOption.label}
                        >
                          {backgroundOption.label}
                        </button>
                      );
                    })}
                  </div>
                  {annotationShapeBackgroundEnabled ? (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-custom-text-400">
                          Opacity
                        </span>
                        <span className="font-mono text-[10px] font-semibold text-custom-text-300">
                          {Math.round(annotationShapeBackgroundOpacity * 100)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min={VIDEO_ANNOTATION_SHAPE_BACKGROUND_OPACITY_LIMITS.min}
                        max={VIDEO_ANNOTATION_SHAPE_BACKGROUND_OPACITY_LIMITS.max}
                        value={Math.round(annotationShapeBackgroundOpacity * 100)}
                        onChange={(event) => onShapeBackgroundOpacityChange(event.currentTarget.value)}
                        className="h-1.5 w-full accent-custom-primary-100"
                        aria-label="Shape background opacity"
                      />
                    </div>
                  ) : null}
                </div>
              ) : null}
              <div className="space-y-1.5">
                <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-custom-text-400">Stroke</div>
                <div className="grid grid-cols-1 gap-1">
                  {VIDEO_ANNOTATION_STROKE_WIDTHS.map((strokeWidth) => {
                    const isSelected = annotationStrokeWidth === strokeWidth;

                    return (
                      <button
                        key={strokeWidth}
                        type="button"
                        onClick={() => onStrokeWidthChange(strokeWidth)}
                        className={[
                          VIDEO_ANNOTATION_TOOL_BUTTON_CLASS,
                          "w-full",
                          isSelected
                            ? "border-custom-primary-100 bg-custom-primary-100/15 text-custom-primary-100"
                            : "",
                        ].join(" ")}
                        aria-label={`${strokeWidth}px annotation stroke`}
                        aria-pressed={isSelected}
                        title={`${strokeWidth}px`}
                      >
                        <span
                          className="w-4 rounded-full bg-current"
                          style={{ height: Math.max(2, strokeWidth / 1.5) }}
                        />
                      </button>
                    );
                  })}
                </div>
                <div className="grid grid-cols-1 gap-1">
                  {VIDEO_ANNOTATION_STROKE_STYLES.map((strokeStyleOption) => {
                    const isSelected = annotationStrokeStyle === strokeStyleOption.value;

                    return (
                      <button
                        key={strokeStyleOption.value}
                        type="button"
                        onClick={() => onStrokeStyleChange(strokeStyleOption.value)}
                        className={[
                          annotationPanelOptionClass,
                          isSelected
                            ? "border-custom-primary-100 bg-custom-primary-100/15 text-custom-primary-100"
                            : "",
                        ].join(" ")}
                        aria-label={`${strokeStyleOption.label} annotation stroke`}
                        aria-pressed={isSelected}
                        title={`${strokeStyleOption.label} stroke`}
                      >
                        <span
                          className={[
                            "w-8 border-t-2 border-current",
                            strokeStyleOption.value === "dotted" ? "border-dotted" : "border-solid",
                          ].join(" ")}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </>
      ) : null}
    </div>
  );
};
