"use client";

import type {
  KeyboardEvent as ReactKeyboardEvent,
  PointerEvent as ReactPointerEvent,
  Ref,
  UIEvent as ReactUIEvent,
} from "react";
import { ChevronRight, FastForward, Minus, Plus, Rewind, SkipBack, SkipForward } from "lucide-react";
import type { TCustomPlaylistAnnotation } from "../types/annotation.types";
import { getAnnotationColor, getTimelineColorWithAlpha } from "../utils/video-annotation-colors";
import {
  VIDEO_ANNOTATION_TIMELINE_CLIP_MIN_WIDTH_PX,
  VIDEO_ANNOTATION_TIMELINE_MOMENT_COLUMN_WIDTH_PX,
  VIDEO_ANNOTATION_TOOL_BUTTON_CLASS,
} from "../utils/video-annotation-editor-config";
import type { AnnotationTimelineMoment } from "../utils/video-annotation-timeline";
import {
  clampTimelineValue,
  formatAnnotationTime,
  getAnnotationTimelineIcon,
  getAnnotationTimelineLabel,
  getAnnotationTimelineToolLabel,
  getTimelinePercent,
} from "../utils/video-annotation-timeline";

type VideoAnnotationTimelinePanelProps = {
  activeAnnotationIds: Set<string>;
  annotationTimelineMoments: AnnotationTimelineMoment[];
  canZoomTimelineIn: boolean;
  canZoomTimelineOut: boolean;
  editingTimelineMoment: { id: string; value: string } | null;
  effectiveCurrentTime: number;
  onBeginEditingTimelineMoment: (moment: AnnotationTimelineMoment) => void;
  onCommitTimelineMomentTitle: (moment: AnnotationTimelineMoment, value: string) => void;
  onEditingTimelineMomentChange: (value: { id: string; value: string }) => void;
  onTimelineBodyScroll: (event: ReactUIEvent<HTMLDivElement>) => void;
  onTimelineHeaderScroll: (event: ReactUIEvent<HTMLDivElement>) => void;
  onTimelineKeyDown: (event: ReactKeyboardEvent<HTMLDivElement>) => void;
  onTimelinePointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onTimelineResizePointerDown: (
    event: ReactPointerEvent<HTMLButtonElement>,
    annotation: TCustomPlaylistAnnotation
  ) => void;
  onTimelineSeek: (seconds: number) => void;
  onJumpToNearestAnnotation: (direction: "next" | "previous") => void;
  onJumpToRelativeTimelineTime: (deltaSeconds: number) => void;
  onSeek?: (seconds: number) => void;
  onStepTimelineZoom: (direction: "in" | "out") => void;
  onToggleTimelineMoment: (momentId: string) => void;
  openTimelineMomentIds: Set<string>;
  sortedAnnotations: TCustomPlaylistAnnotation[];
  timelineContentWidthPx: number;
  timelineDurationSeconds: number;
  timelineHeaderScrollableElementRef: Ref<HTMLDivElement>;
  timelineProgressPercent: number;
  timelineResizeId: string | null;
  timelineScrollableElementRef: Ref<HTMLDivElement>;
  timelineTicks: number[];
  timelineZoomPercent: number;
};

export const VideoAnnotationTimelinePanel = ({
  activeAnnotationIds,
  annotationTimelineMoments,
  canZoomTimelineIn,
  canZoomTimelineOut,
  editingTimelineMoment,
  effectiveCurrentTime,
  onBeginEditingTimelineMoment,
  onCommitTimelineMomentTitle,
  onEditingTimelineMomentChange,
  onJumpToNearestAnnotation,
  onJumpToRelativeTimelineTime,
  onSeek,
  onStepTimelineZoom,
  onTimelineBodyScroll,
  onTimelineHeaderScroll,
  onTimelineKeyDown,
  onTimelinePointerDown,
  onTimelineResizePointerDown,
  onTimelineSeek,
  onToggleTimelineMoment,
  openTimelineMomentIds,
  sortedAnnotations,
  timelineContentWidthPx,
  timelineDurationSeconds,
  timelineHeaderScrollableElementRef,
  timelineProgressPercent,
  timelineResizeId,
  timelineScrollableElementRef,
  timelineTicks,
  timelineZoomPercent,
}: VideoAnnotationTimelinePanelProps) => (
  <div className="overflow-hidden rounded-[6px] border border-custom-border-200 bg-[#0c0c0c] shadow-sm">
    <div className="flex min-h-[52px] flex-wrap items-center gap-2 border-b border-custom-border-200 bg-custom-background-100 px-3 py-2">
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onTimelineSeek(0)}
          disabled={!onSeek}
          className={VIDEO_ANNOTATION_TOOL_BUTTON_CLASS}
          aria-label="Jump to start"
          title="Jump to start"
        >
          <SkipBack className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => onJumpToNearestAnnotation("previous")}
          disabled={!onSeek || sortedAnnotations.length === 0}
          className={VIDEO_ANNOTATION_TOOL_BUTTON_CLASS}
          aria-label="Previous annotation"
          title="Previous annotation"
        >
          <Rewind className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => onJumpToRelativeTimelineTime(-1)}
          disabled={!onSeek}
          className={VIDEO_ANNOTATION_TOOL_BUTTON_CLASS}
          aria-label="Step backward one second"
          title="Step backward one second"
        >
          <Minus className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => onJumpToRelativeTimelineTime(1)}
          disabled={!onSeek}
          className={VIDEO_ANNOTATION_TOOL_BUTTON_CLASS}
          aria-label="Step forward one second"
          title="Step forward one second"
        >
          <Plus className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => onJumpToNearestAnnotation("next")}
          disabled={!onSeek || sortedAnnotations.length === 0}
          className={VIDEO_ANNOTATION_TOOL_BUTTON_CLASS}
          aria-label="Next annotation"
          title="Next annotation"
        >
          <FastForward className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => onTimelineSeek(timelineDurationSeconds)}
          disabled={!onSeek}
          className={VIDEO_ANNOTATION_TOOL_BUTTON_CLASS}
          aria-label="Jump to end"
          title="Jump to end"
        >
          <SkipForward className="h-4 w-4" />
        </button>
      </div>

      <div className="flex min-w-0 items-baseline gap-2 font-mono tabular-nums">
        <span className="text-[18px] font-semibold leading-none text-custom-text-100">
          {formatAnnotationTime(effectiveCurrentTime)}
        </span>
        <span className="text-[12px] text-custom-text-400">/</span>
        <span className="text-[14px] font-semibold leading-none text-custom-text-200">
          {formatAnnotationTime(timelineDurationSeconds)}
        </span>
      </div>

      <div className="ml-auto flex min-w-0 items-center justify-end">
        <span className="hidden text-[12px] text-custom-text-300 md:inline">
          {sortedAnnotations.length} annotation{sortedAnnotations.length === 1 ? "" : "s"}
        </span>
      </div>
    </div>

    <div
      className="grid bg-[#0c0c0c]"
      style={{
        gridTemplateColumns: `${VIDEO_ANNOTATION_TIMELINE_MOMENT_COLUMN_WIDTH_PX}px minmax(0, 1fr)`,
      }}
    >
      <div className="flex h-[30px] items-center border-b border-r border-custom-border-200 bg-[#101010] px-4 text-[11px] font-semibold uppercase tracking-[0.05em] text-custom-text-400">
        Moments
      </div>
      <div
        ref={timelineHeaderScrollableElementRef}
        className={[
          "min-w-0 cursor-pointer overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--sg-matrix-active-border)]",
          onSeek ? "" : "cursor-default",
        ].join(" ")}
        onPointerDown={onTimelinePointerDown}
        onScroll={onTimelineHeaderScroll}
      >
        <div
          className="relative h-[30px] border-b border-custom-border-200 bg-[#0c0c0c]"
          style={{ width: `max(100%, ${timelineContentWidthPx}px)` }}
        >
          {timelineTicks.map((seconds) => {
            const tickPercent = getTimelinePercent(seconds, timelineDurationSeconds);

            return (
              <div
                key={`annotation-header-tick-${seconds}`}
                className="pointer-events-none absolute top-0 h-[30px] -translate-x-px"
                style={{ left: `${tickPercent}%` }}
              >
                <span className="block h-2.5 w-px bg-custom-border-300" />
                <span className="absolute left-1 top-1/2 -translate-y-1/2 whitespace-nowrap font-mono text-[11px] leading-none text-custom-text-400">
                  {formatAnnotationTime(seconds)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>

    <div
      className="vertical-scrollbar scrollbar-md grid max-h-[308px] overflow-y-auto overflow-x-hidden bg-[#0c0c0c]"
      style={{
        gridTemplateColumns: `${VIDEO_ANNOTATION_TIMELINE_MOMENT_COLUMN_WIDTH_PX}px minmax(0, 1fr)`,
      }}
    >
      <div className="shrink-0 border-r border-custom-border-200 bg-[#101010]">
        {annotationTimelineMoments.map((moment) => {
          const isMomentOpen = openTimelineMomentIds.has(moment.id);
          const isEditingMomentTitle = editingTimelineMoment?.id === moment.id;

          return (
            <div key={`moment-label-${moment.id}`}>
              <div
                className={[
                  "flex h-11 w-full items-center gap-2 border-b border-[#111] px-3 text-left transition-colors hover:bg-custom-background-90",
                  isMomentOpen ? "bg-custom-background-90" : "bg-[#101010]",
                ].join(" ")}
                title={`${formatAnnotationTime(moment.startTime)} - ${moment.title}`}
              >
                <button
                  type="button"
                  onClick={() => onToggleTimelineMoment(moment.id)}
                  className="grid h-5 w-5 shrink-0 place-items-center rounded-[4px] text-custom-text-400 transition-colors hover:bg-custom-background-80 hover:text-custom-text-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  aria-expanded={isMomentOpen}
                  aria-label={`${isMomentOpen ? "Collapse" : "Expand"} ${moment.title}`}
                >
                  <ChevronRight
                    className={["h-3.5 w-3.5 transition-transform", isMomentOpen ? "rotate-90" : ""].join(" ")}
                  />
                </button>
                <button
                  type="button"
                  onClick={() => onTimelineSeek(moment.startTime)}
                  className="shrink-0 rounded-[6px] border border-custom-border-200 bg-custom-background-100 px-1.5 py-0.5 font-mono text-[11px] font-semibold tabular-nums text-custom-text-100 transition-colors hover:border-custom-text-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  title={`Seek to ${formatAnnotationTime(moment.startTime)}`}
                >
                  {formatAnnotationTime(moment.startTime)}
                </button>
                <input
                  type="text"
                  value={isEditingMomentTitle ? editingTimelineMoment.value : moment.title}
                  onChange={(event) =>
                    onEditingTimelineMomentChange({ id: moment.id, value: event.currentTarget.value })
                  }
                  onFocus={() => onBeginEditingTimelineMoment(moment)}
                  onBlur={(event) => onCommitTimelineMomentTitle(moment, event.currentTarget.value)}
                  onClick={(event) => event.stopPropagation()}
                  onPointerDown={(event) => event.stopPropagation()}
                  onKeyDown={(event) => {
                    event.stopPropagation();
                    if (event.key === "Enter") {
                      event.preventDefault();
                      event.currentTarget.blur();
                    }
                  }}
                  className="min-w-0 flex-1 rounded-[4px] border border-transparent bg-transparent px-1 py-0.5 text-[13px] font-medium text-custom-text-100 outline-none transition-colors focus:border-custom-border-300 focus:bg-custom-background-100"
                  aria-label={`Edit title for ${formatAnnotationTime(moment.startTime)} moment`}
                />
                <span className="shrink-0 rounded-full border border-custom-border-200 bg-custom-background-100 px-2 text-[11px] leading-[17px] text-custom-text-300">
                  {moment.annotations.length}
                </span>
              </div>
              {isMomentOpen &&
                moment.annotations.map(({ annotation, index }) => {
                  const color = getAnnotationColor(annotation);
                  const annotationLabel = getAnnotationTimelineLabel(annotation, index);

                  return (
                    <button
                      key={`moment-item-label-${annotation.id}`}
                      type="button"
                      onClick={() => onTimelineSeek(annotation.startTime)}
                      className="flex h-[34px] w-full items-center gap-2 border-b border-[#0a0a0a] bg-custom-background-90 px-3 pl-10 text-left transition-colors hover:bg-custom-background-80"
                      title={annotationLabel}
                    >
                      <span className="h-2 w-2 shrink-0 rounded-[2px]" style={{ backgroundColor: color }} />
                      <span className="min-w-0 truncate text-[12px] font-medium text-custom-text-200">
                        {getAnnotationTimelineToolLabel(annotation.type)} - {annotationLabel}
                      </span>
                    </button>
                  );
                })}
            </div>
          );
        })}
      </div>

      <div
        ref={timelineScrollableElementRef}
        aria-label="Seek annotation timeline"
        aria-valuemax={Math.round(timelineDurationSeconds)}
        aria-valuemin={0}
        aria-valuenow={Math.round(clampTimelineValue(effectiveCurrentTime, 0, timelineDurationSeconds))}
        className={[
          "horizontal-scrollbar scrollbar-md min-w-0 cursor-pointer overflow-x-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--sg-matrix-active-border)]",
          onSeek ? "" : "cursor-default",
        ].join(" ")}
        onKeyDown={onTimelineKeyDown}
        onPointerDown={onTimelinePointerDown}
        onScroll={onTimelineBodyScroll}
        role="slider"
        tabIndex={onSeek ? 0 : -1}
      >
        <div className="relative min-h-full bg-[#0c0c0c]" style={{ width: `max(100%, ${timelineContentWidthPx}px)` }}>
          {timelineTicks.map((seconds) => (
            <span
              key={`annotation-grid-${seconds}`}
              className="pointer-events-none absolute bottom-0 top-0 w-px -translate-x-px bg-custom-border-200/40"
              style={{ left: `${getTimelinePercent(seconds, timelineDurationSeconds)}%` }}
            />
          ))}

          <span
            className="pointer-events-none absolute bottom-0 top-0 z-20 w-0 -translate-x-1/2 border-l-2 border-[#ef4444] drop-shadow-[0_0_8px_rgba(239,68,68,0.4)]"
            style={{ left: `${timelineProgressPercent}%` }}
          >
            <span className="absolute -top-px left-1/2 h-2 w-2.5 -translate-x-1/2 rounded-[2px] bg-[#ef4444]" />
          </span>

          {annotationTimelineMoments.map((moment) => {
            const isMomentOpen = openTimelineMomentIds.has(moment.id);

            return (
              <div key={`moment-track-${moment.id}`}>
                <div className="relative h-11 border-b border-[#0a0a0a] bg-[#0c0c0c]">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onToggleTimelineMoment(moment.id);
                      onTimelineSeek(moment.startTime);
                    }}
                    onPointerDown={(event) => event.stopPropagation()}
                    className={[
                      "absolute top-1/2 inline-flex h-[26px] max-w-[280px] -translate-y-1/2 items-center gap-2 rounded-[6px] border px-2 text-[11px] font-medium shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white",
                      isMomentOpen
                        ? "border-custom-text-400 bg-custom-background-80 text-custom-text-100"
                        : "border-custom-border-200 bg-custom-background-100 text-custom-text-200 hover:border-custom-text-400 hover:text-custom-text-100",
                    ].join(" ")}
                    style={{ left: `${getTimelinePercent(moment.startTime, timelineDurationSeconds)}%` }}
                    aria-expanded={isMomentOpen}
                    aria-label={`${isMomentOpen ? "Collapse" : "Expand"} ${moment.title}`}
                    title={`${formatAnnotationTime(moment.startTime)} - ${moment.title}`}
                  >
                    <ChevronRight
                      className={["h-3.5 w-3.5 shrink-0 transition-transform", isMomentOpen ? "rotate-90" : ""].join(
                        " "
                      )}
                    />
                    <span className="flex shrink-0 items-center">
                      {moment.annotations.slice(0, 4).map(({ annotation }, summaryIndex) => {
                        const SummaryIcon = getAnnotationTimelineIcon(annotation);
                        const color = getAnnotationColor(annotation);

                        return (
                          <span
                            key={`moment-summary-${annotation.id}`}
                            className="grid h-[18px] w-[18px] place-items-center rounded-[5px] border border-[#0c0c0c]"
                            style={{
                              backgroundColor: getTimelineColorWithAlpha(color, 0.06),
                              marginLeft: summaryIndex === 0 ? 0 : -5,
                            }}
                          >
                            <SummaryIcon
                              className="h-2.5 w-2.5"
                              style={{ color: getTimelineColorWithAlpha(color, 0.5) }}
                            />
                          </span>
                        );
                      })}
                    </span>
                    <span className="min-w-0 truncate">{moment.title}</span>
                  </button>
                </div>
                {isMomentOpen &&
                  moment.annotations.map(({ annotation, index }) => {
                    const leftPercent = getTimelinePercent(annotation.startTime, timelineDurationSeconds);
                    const rightPercent = getTimelinePercent(annotation.endTime, timelineDurationSeconds);
                    const widthPercent = Math.max(0.8, rightPercent - leftPercent);
                    const isActive = activeAnnotationIds.has(annotation.id);
                    const color = getAnnotationColor(annotation);
                    const AnnotationIcon = getAnnotationTimelineIcon(annotation);
                    const annotationLabel = getAnnotationTimelineLabel(annotation, index);
                    const annotationDurationSeconds = Math.max(0, annotation.endTime - annotation.startTime);
                    const isResizing = timelineResizeId === annotation.id;

                    return (
                      <div
                        key={`moment-item-track-${annotation.id}`}
                        className="relative h-[34px] border-b border-[#0a0a0a] bg-custom-background-90"
                      >
                        <div
                          className={["absolute top-1/2 z-10 min-w-14 -translate-y-1/2", isResizing ? "z-30" : ""].join(
                            " "
                          )}
                          style={{
                            left: `${leftPercent}%`,
                            width: `max(${VIDEO_ANNOTATION_TIMELINE_CLIP_MIN_WIDTH_PX}px, ${widthPercent}%)`,
                          }}
                        >
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              onTimelineSeek(annotation.startTime);
                            }}
                            onPointerDown={(event) => event.stopPropagation()}
                            className={[
                              "relative inline-flex h-6 w-full cursor-pointer items-center gap-1.5 overflow-hidden rounded-[5px] border px-3 pl-3 pr-4 text-left text-[11px] font-semibold text-custom-text-100 shadow-sm transition-[filter,box-shadow] hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-custom-primary-100/40",
                              isResizing ? "shadow-[0_0_0_1px_rgba(255,255,255,0.16)]" : "",
                            ].join(" ")}
                            style={{
                              backgroundColor: getTimelineColorWithAlpha(color, 0.06),
                              borderColor: getTimelineColorWithAlpha(color, isActive || isResizing ? 0.28 : 0.18),
                            }}
                            aria-current={isActive ? "true" : undefined}
                            title={`${getAnnotationTimelineToolLabel(annotation.type)} - ${annotationLabel}. Start ${formatAnnotationTime(annotation.startTime)}. Duration ${formatAnnotationTime(annotationDurationSeconds)}.`}
                          >
                            <span
                              aria-hidden="true"
                              className="absolute inset-y-0 left-0 w-[3px]"
                              style={{ backgroundColor: getTimelineColorWithAlpha(color, 0.38) }}
                            />
                            <AnnotationIcon
                              className="h-3 w-3 shrink-0"
                              style={{ color: getTimelineColorWithAlpha(color, 0.5) }}
                            />
                            <span className="min-w-0 truncate">{annotationLabel}</span>
                          </button>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                            }}
                            onPointerDown={(event) => onTimelineResizePointerDown(event, annotation)}
                            className={[
                              "absolute inset-y-0 right-0 grid w-3 cursor-ew-resize place-items-center rounded-r-[5px] text-custom-text-100/60 transition-colors hover:bg-white/15 hover:text-custom-text-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white",
                              isResizing ? "bg-white/20 text-custom-text-100" : "",
                            ].join(" ")}
                            aria-label={`Resize ${annotationLabel} duration`}
                            title="Pull to change duration"
                          >
                            <span className="h-3 w-px rounded-full bg-current" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            );
          })}

          {annotationTimelineMoments.length === 0 && (
            <div className="relative h-11 border-b border-[#0a0a0a]">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[11px] text-custom-text-400">
                No annotations yet
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
    <div className="flex h-11 items-center gap-3 border-t border-custom-border-200 bg-custom-background-100 px-3">
      <span className="shrink-0 text-[12px] font-medium text-custom-text-200">Scale Size</span>
      <div className="flex h-[28px] items-center overflow-hidden rounded-[8px] border border-custom-border-200 bg-custom-background-90">
        <button
          type="button"
          onClick={() => onStepTimelineZoom("out")}
          disabled={!canZoomTimelineOut}
          className="grid h-full w-9 place-items-center text-custom-text-200 transition-colors hover:bg-custom-background-80 hover:text-custom-text-100 disabled:cursor-not-allowed disabled:opacity-45"
          aria-label="Zoom timeline out"
          title="Zoom timeline out"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <span className="h-full w-px bg-custom-border-200" />
        <span className="inline-flex h-full min-w-14 items-center justify-center px-2 text-[12px] font-semibold text-custom-text-100 tabular-nums">
          {timelineZoomPercent}%
        </span>
        <span className="h-full w-px bg-custom-border-200" />
        <button
          type="button"
          onClick={() => onStepTimelineZoom("in")}
          disabled={!canZoomTimelineIn}
          className="grid h-full w-9 place-items-center text-custom-text-200 transition-colors hover:bg-custom-background-80 hover:text-custom-text-100 disabled:cursor-not-allowed disabled:opacity-45"
          aria-label="Zoom timeline in"
          title="Zoom timeline in"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  </div>
);
