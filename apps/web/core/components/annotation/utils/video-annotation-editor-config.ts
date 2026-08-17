import { ArrowUpRight, Circle, Image as ImageIcon, Minus, Pencil, Square, Type } from "lucide-react";
import type { TCustomPlaylistAnnotationStrokeStyle, TCustomPlaylistAnnotationTool } from "../types/annotation.types";
import { VIDEO_ANNOTATION_START_TIME_OFFSET_SECONDS } from "./playlist-annotation-creation-time";

const DEFAULT_VIDEO_ANNOTATION_COLOR = "#f97316";
const VIDEO_ANNOTATION_COLOR_PRESETS = [
  "#f97316",
  "#ef4444",
  "#eab308",
  "#22c55e",
  "#38bdf8",
  "#6366f1",
  "#a855f7",
  "#ffffff",
  "#111827",
] as const;
const MAX_VIDEO_ANNOTATION_IMAGE_BYTES = 2 * 1024 * 1024;
const VIDEO_ANNOTATION_IMAGE_SIZE_LIMITS = {
  max: 600,
  min: 40,
};
const VIDEO_ANNOTATION_DURATIONS = [1, 2, 4, 8];
const VIDEO_ANNOTATION_STROKE_WIDTHS = [3, 5, 8];
const VIDEO_ANNOTATION_STROKE_STYLES: { label: string; value: TCustomPlaylistAnnotationStrokeStyle }[] = [
  { label: "Solid", value: "solid" },
  { label: "Dotted", value: "dotted" },
];
const VIDEO_ANNOTATION_TEXT_FONT_SIZES = [20, 28, 36, 48];
const VIDEO_ANNOTATION_TEXT_FONT_WEIGHTS = [
  { label: "Regular", value: 400 },
  { label: "Bold", value: 700 },
] as const;
const VIDEO_ANNOTATION_TEXT_FONT_FAMILIES = [
  { label: "Sans", value: "sans-serif" },
  { label: "Serif", value: "serif" },
  { label: "Mono", value: "monospace" },
] as const;
const VIDEO_ANNOTATION_TIMELINE_ZOOM_STEPS = [50, 75, 100, 150, 200, 300];
const VIDEO_ANNOTATION_TIMELINE_DEFAULT_ZOOM_PERCENT = 100;
const VIDEO_ANNOTATION_TIMELINE_CLIP_MIN_WIDTH_PX = 56;
const VIDEO_ANNOTATION_TIMELINE_CLIP_GAP_PX = 8;
const VIDEO_ANNOTATION_TIMELINE_MOMENT_COLUMN_WIDTH_PX = 236;
const VIDEO_ANNOTATION_TIMELINE_MIN_DURATION_SECONDS = 0.1;
const VIDEO_ANNOTATION_TOOL_BUTTON_CLASS =
  "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[5px] border border-custom-border-200 bg-custom-background-100 text-custom-text-200 transition-colors hover:bg-custom-background-80 hover:text-custom-text-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-custom-primary-100/40 disabled:cursor-not-allowed disabled:opacity-45";
const VIDEO_ANNOTATION_TOOLS = [
  { icon: Pencil, label: "Freehand draw", type: "pen" },
  { icon: Type, label: "Text", type: "text" },
  { icon: Square, label: "Rectangle", type: "rectangle" },
  { icon: Circle, label: "Ellipse", type: "ellipse" },
  { icon: Minus, label: "Line", type: "line" },
  { icon: ArrowUpRight, label: "Arrow", type: "arrow" },
  { icon: ImageIcon, label: "Image", type: "image" },
] satisfies Array<{ icon: typeof Pencil; label: string; type: TCustomPlaylistAnnotationTool }>;

export {
  DEFAULT_VIDEO_ANNOTATION_COLOR,
  MAX_VIDEO_ANNOTATION_IMAGE_BYTES,
  VIDEO_ANNOTATION_COLOR_PRESETS,
  VIDEO_ANNOTATION_DURATIONS,
  VIDEO_ANNOTATION_IMAGE_SIZE_LIMITS,
  VIDEO_ANNOTATION_START_TIME_OFFSET_SECONDS,
  VIDEO_ANNOTATION_STROKE_STYLES,
  VIDEO_ANNOTATION_STROKE_WIDTHS,
  VIDEO_ANNOTATION_TEXT_FONT_FAMILIES,
  VIDEO_ANNOTATION_TEXT_FONT_SIZES,
  VIDEO_ANNOTATION_TEXT_FONT_WEIGHTS,
  VIDEO_ANNOTATION_TIMELINE_CLIP_GAP_PX,
  VIDEO_ANNOTATION_TIMELINE_CLIP_MIN_WIDTH_PX,
  VIDEO_ANNOTATION_TIMELINE_DEFAULT_ZOOM_PERCENT,
  VIDEO_ANNOTATION_TIMELINE_MIN_DURATION_SECONDS,
  VIDEO_ANNOTATION_TIMELINE_MOMENT_COLUMN_WIDTH_PX,
  VIDEO_ANNOTATION_TIMELINE_ZOOM_STEPS,
  VIDEO_ANNOTATION_TOOL_BUTTON_CLASS,
  VIDEO_ANNOTATION_TOOLS,
};
