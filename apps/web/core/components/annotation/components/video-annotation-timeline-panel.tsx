"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  KeyboardEvent as ReactKeyboardEvent,
  PointerEvent as ReactPointerEvent,
  Ref,
  UIEvent as ReactUIEvent,
} from "react";
import { Mic, ChevronRight, FastForward, Minus, Plus, Rewind, SkipBack, SkipForward, Trash2 } from "lucide-react";
import type { TCustomPlaylistAnnotation } from "../types/annotation.types";
import { getAnnotationColor, getTimelineColorWithAlpha } from "../utils/video-annotation-colors";
import {
  VIDEO_ANNOTATION_TIMELINE_CLIP_MIN_WIDTH_PX,
  VIDEO_ANNOTATION_TIMELINE_MOMENT_COLUMN_WIDTH_PX,
  VIDEO_ANNOTATION_TOOL_BUTTON_CLASS,
} from "../utils/video-annotation-editor-config";
import type { AnnotationTimelineMoment } from "../utils/video-annotation-timeline";
import {
  buildAnnotationTimelineMoments,
  clampTimelineValue,
  formatAnnotationTime,
  getAnnotationTimelineIcon,
  getAnnotationTimelineLabel,
  getAnnotationTimelineToolLabel,
  getTimelinePercent,
} from "../utils/video-annotation-timeline";
import { VideoAnnotationTimelinePlayhead } from "./video-annotation-timeline-playhead";
import { VoiceNarrationActions } from "./voice-narration-actions";
import { VoiceNarrationClip } from "./voice-narration-clip";

type VideoAnnotationTimelinePanelProps = {
  narrationActions: {
    selectedId: string | null;
    previewId: string | null;
    disabled: boolean;
    onSelect: (clip: TCustomPlaylistAnnotation) => void;
    onChange: (clip: TCustomPlaylistAnnotation) => void;
    onPreview: (clip: TCustomPlaylistAnnotation) => void;
    onReplace: (clip: TCustomPlaylistAnnotation) => void;
    onDuplicate: (clip: TCustomPlaylistAnnotation) => void;
  };
  activeAnnotationIds: Set<string>;
  annotationTimelineMoments: AnnotationTimelineMoment[];
  canZoomTimelineIn: boolean;
  canZoomTimelineOut: boolean;
  editingTimelineMoment: { id: string; value: string } | null;
  effectiveCurrentTime: number;
  isPlaying: boolean;
  onBeginEditingTimelineMoment: (moment: AnnotationTimelineMoment) => void;
  onCommitTimelineMomentTitle: (moment: AnnotationTimelineMoment, value: string) => void;
  onDeleteAnnotation: (annotationId: string) => void;
  onEditingTimelineMomentChange: (value: { id: string; value: string }) => void;
  onTimelineBodyScroll: (event: ReactUIEvent<HTMLDivElement>) => void;
  onTimelineHeaderScroll: (event: ReactUIEvent<HTMLDivElement>) => void;
  onTimelineKeyDown: (event: ReactKeyboardEvent<HTMLDivElement>) => void;
  onTimelinePointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onTimelineResizePointerEnd: (event: ReactPointerEvent<HTMLButtonElement>) => void;
  onTimelineResizePointerDown: (
    event: ReactPointerEvent<HTMLButtonElement>,
    annotation: TCustomPlaylistAnnotation
  ) => void;
  onTimelineResizePointerMove: (event: ReactPointerEvent<HTMLButtonElement>) => void;
  onTimelineSeek: (seconds: number) => void;
  onJumpToNearestAnnotation: (direction: "next" | "previous") => void;
  onJumpToRelativeTimelineTime: (deltaSeconds: number) => void;
  onSeek?: (seconds: number) => void;
  onStepTimelineZoom: (direction: "in" | "out") => void;
  onToggleTimelineMoment: (momentId: string) => void;
  openTimelineMomentIds: Set<string>;
  playbackRate: number;
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
  narrationActions,
  activeAnnotationIds,
  annotationTimelineMoments,
  canZoomTimelineIn,
  canZoomTimelineOut,
  editingTimelineMoment,
  effectiveCurrentTime,
  isPlaying,
  onBeginEditingTimelineMoment,
  onCommitTimelineMomentTitle,
  onDeleteAnnotation,
  onEditingTimelineMomentChange,
  onJumpToNearestAnnotation,
  onJumpToRelativeTimelineTime,
  onSeek,
  onStepTimelineZoom,
  onTimelineBodyScroll,
  onTimelineHeaderScroll,
  onTimelineKeyDown,
  onTimelinePointerDown,
  onTimelineResizePointerEnd,
  onTimelineResizePointerDown,
  onTimelineResizePointerMove,
  onTimelineSeek,
  onToggleTimelineMoment,
  openTimelineMomentIds,
  playbackRate,
  sortedAnnotations,
  timelineContentWidthPx,
  timelineDurationSeconds,
  timelineHeaderScrollableElementRef,
  timelineProgressPercent,
  timelineResizeId,
  timelineScrollableElementRef,
  timelineTicks,
  timelineZoomPercent,
}: VideoAnnotationTimelinePanelProps) => {
  const narrationClips = useMemo(
    () => sortedAnnotations.filter((clip) => clip.type === "audio").sort((a, b) => a.startTime - b.startTime),
    [sortedAnnotations]
  );
  const narrationMoments = useMemo(() => buildAnnotationTimelineMoments(narrationClips), [narrationClips]);
  const timelineGroups = useMemo(() => {
    const groups: { type: "narration" | "moment"; moment: AnnotationTimelineMoment }[] = [
      ...annotationTimelineMoments.map((moment) => ({ type: "moment" as const, moment })),
      ...narrationMoments.map((moment) => ({ type: "narration" as const, moment })),
    ];
    return groups.sort((a, b) => a.moment.startTime - b.moment.startTime);
  }, [annotationTimelineMoments, narrationMoments]);
  const [collapsedNarrationMomentIds, setCollapsedNarrationMomentIds] = useState<Set<string>>(() => new Set());
  const selectedNarrationMomentId = narrationMoments.find((moment) =>
    moment.annotations.some(({ annotation }) => annotation.id === narrationActions.selectedId)
  )?.id;
  useEffect(() => {
    if (!selectedNarrationMomentId) return;
    setCollapsedNarrationMomentIds((previous) => {
      if (!previous.has(selectedNarrationMomentId)) return previous;
      const next = new Set(previous);
      next.delete(selectedNarrationMomentId);
      return next;
    });
  }, [selectedNarrationMomentId, narrationActions.selectedId]);
  useEffect(() => {
    setCollapsedNarrationMomentIds((previous) => {
      const next = new Set([...previous].filter((id) => narrationMoments.some((moment) => moment.id === id)));
      return next.size === previous.size ? previous : next;
    });
  }, [narrationMoments]);
  const toggleNarrationMoment = (id: string) => {
    setCollapsedNarrationMomentIds((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const snapTimes = useMemo(
    () => [effectiveCurrentTime, ...sortedAnnotations.flatMap((clip) => [clip.startTime, clip.endTime])],
    [effectiveCurrentTime, sortedAnnotations]
  );
  return (
    <div className="overflow-hidden rounded-[6px] border border-custom-border-200 bg-custom-background-100 shadow-sm">
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
        className="grid bg-custom-background-100"
        style={{
          gridTemplateColumns: `min(${VIDEO_ANNOTATION_TIMELINE_MOMENT_COLUMN_WIDTH_PX}px, 40%) minmax(0, 1fr)`,
        }}
      >
        <div className="flex h-[30px] items-center border-b border-r border-custom-border-200 bg-custom-background-90 px-4 text-[11px] font-semibold uppercase tracking-[0.05em] text-custom-text-400">
          Moments
        </div>
        <div
          ref={timelineHeaderScrollableElementRef}
          role="slider"
          aria-label="Seek annotation timeline"
          aria-valuemax={Math.round(timelineDurationSeconds)}
          aria-valuemin={0}
          aria-valuenow={Math.round(clampTimelineValue(effectiveCurrentTime, 0, timelineDurationSeconds))}
          tabIndex={onSeek ? 0 : -1}
          onKeyDown={onTimelineKeyDown}
          className={[
            "min-w-0 cursor-pointer overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--sg-matrix-active-border)]",
            onSeek ? "" : "cursor-default",
          ].join(" ")}
          onPointerDown={onTimelinePointerDown}
          onScroll={onTimelineHeaderScroll}
        >
          <div
            className="relative h-[30px] border-b border-custom-border-200 bg-custom-background-100"
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
        className="vertical-scrollbar scrollbar-md grid max-h-[308px] overflow-y-auto overflow-x-hidden bg-custom-background-100"
        style={{
          gridTemplateColumns: `min(${VIDEO_ANNOTATION_TIMELINE_MOMENT_COLUMN_WIDTH_PX}px, 40%) minmax(0, 1fr)`,
        }}
      >
        <div className="shrink-0 border-r border-custom-border-200 bg-custom-background-90">
          {timelineGroups.map((group) => {
            const { moment } = group;
            if (group.type === "narration") {
              const isNarrationOpen = !collapsedNarrationMomentIds.has(moment.id);
              return (
                <div key={`narration-label-${moment.id}`} data-testid="narration-moment-label">
                  <button
                    type="button"
                    onClick={() => toggleNarrationMoment(moment.id)}
                    className={`flex h-11 w-full items-center gap-2 border-b border-custom-border-200 px-3 text-left text-[13px] font-medium text-custom-text-100 transition-colors hover:bg-custom-background-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-custom-primary-100/40 ${isNarrationOpen ? "bg-custom-background-80" : "bg-custom-background-90"}`}
                    aria-expanded={isNarrationOpen}
                    aria-label={`${isNarrationOpen ? "Collapse" : "Expand"} Voice narration`}
                  >
                    <ChevronRight
                      className={`size-3.5 shrink-0 transition-transform ${isNarrationOpen ? "rotate-90" : ""}`}
                    />
                    <span className="shrink-0 font-mono text-[11px] tabular-nums">
                      {formatAnnotationTime(moment.startTime)}
                    </span>
                    <span className="min-w-0 flex-1 truncate">Voice narration</span>
                    <span className="shrink-0 rounded-full border border-custom-border-200 bg-custom-background-100 px-2 text-[11px] leading-[17px] text-custom-text-300">
                      {moment.annotations.length}
                    </span>
                  </button>
                  {isNarrationOpen &&
                    moment.annotations.map(({ annotation: clip }) => (
                      <div
                        key={`narration-label-${clip.id}`}
                        data-testid="narration-layer-label"
                        className={`group flex h-[34px] w-full items-center border-b border-custom-border-200 pr-1 transition-colors hover:bg-custom-background-80 ${narrationActions.selectedId === clip.id ? "bg-custom-primary-100/10 text-custom-primary-100" : "bg-custom-background-100 text-custom-text-200"}`}
                      >
                        <button
                          type="button"
                          disabled={narrationActions.disabled}
                          onClick={() => narrationActions.onSelect(clip)}
                          aria-label={`Select narration layer ${clip.title || "Narration"}`}
                          aria-pressed={narrationActions.selectedId === clip.id}
                          className="flex h-full min-w-0 flex-1 items-center gap-2 pl-10 pr-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-custom-primary-100/40"
                          title={clip.title || "Narration"}
                        >
                          <Mic className="size-3 shrink-0 text-custom-primary-100" />
                          <span className="min-w-0 truncate text-[12px] font-medium">{clip.title || "Narration"}</span>
                        </button>
                        <div
                          className={`shrink-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100 ${narrationActions.selectedId === clip.id ? "opacity-100" : "pointer-events-none opacity-0"}`}
                        >
                          <VoiceNarrationActions
                            clip={clip}
                            disabled={narrationActions.disabled}
                            previewing={narrationActions.previewId === clip.id}
                            onSelect={narrationActions.onSelect}
                            onPreview={narrationActions.onPreview}
                            onReplace={narrationActions.onReplace}
                            onDuplicate={narrationActions.onDuplicate}
                            onDelete={onDeleteAnnotation}
                          />
                        </div>
                      </div>
                    ))}
                </div>
              );
            }
            const isMomentOpen = openTimelineMomentIds.has(moment.id);
            const isEditingMomentTitle = editingTimelineMoment?.id === moment.id;

            return (
              <div key={`moment-label-${moment.id}`} data-testid="annotation-moment-label">
                <div
                  className={[
                    "flex h-11 w-full items-center gap-2 border-b border-custom-border-200 px-3 text-left transition-colors hover:bg-custom-background-80",
                    isMomentOpen ? "bg-custom-background-80" : "bg-custom-background-90",
                  ].join(" ")}
                  title={`${formatAnnotationTime(moment.startTime)} - ${moment.title}`}
                >
                  <button
                    type="button"
                    onClick={() => onToggleTimelineMoment(moment.id)}
                    className="grid h-5 w-5 shrink-0 place-items-center rounded-[4px] text-custom-text-400 transition-colors hover:bg-custom-background-80 hover:text-custom-text-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-custom-primary-100/40"
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
                    className="shrink-0 rounded-[6px] border border-custom-border-200 bg-custom-background-100 px-1.5 py-0.5 font-mono text-[11px] font-semibold tabular-nums text-custom-text-100 transition-colors hover:border-custom-text-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-custom-primary-100/40"
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
                        className="flex h-[34px] w-full items-center gap-2 border-b border-custom-border-200 bg-custom-background-100 px-3 pl-10 text-left transition-colors hover:bg-custom-background-80"
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
          aria-label="Annotation tracks"
          className={[
            "horizontal-scrollbar scrollbar-md min-w-0 cursor-pointer overflow-x-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--sg-matrix-active-border)]",
            onSeek ? "" : "cursor-default",
          ].join(" ")}
          onKeyDown={onTimelineKeyDown}
          onPointerDown={onTimelinePointerDown}
          onScroll={onTimelineBodyScroll}
          role="group"
          tabIndex={onSeek ? 0 : -1}
        >
          <div
            className="relative min-h-full bg-custom-background-100"
            style={{ width: `max(100%, ${timelineContentWidthPx}px)` }}
          >
            {timelineTicks.map((seconds) => (
              <span
                key={`annotation-grid-${seconds}`}
                className="pointer-events-none absolute bottom-0 top-0 w-px -translate-x-px bg-custom-border-200/40"
                style={{ left: `${getTimelinePercent(seconds, timelineDurationSeconds)}%` }}
              />
            ))}

            <VideoAnnotationTimelinePlayhead
              currentTime={effectiveCurrentTime}
              durationSeconds={timelineDurationSeconds}
              isPlaying={isPlaying}
              playbackRate={playbackRate}
              progressPercent={timelineProgressPercent}
            />

            {timelineGroups.map((group) => {
              const { moment } = group;
              if (group.type === "narration") {
                const isNarrationOpen = !collapsedNarrationMomentIds.has(moment.id);
                return (
                  <div key={`narration-track-${moment.id}`} data-testid="narration-moment-track">
                    <div className="relative h-11 border-b border-custom-border-200 bg-custom-background-100">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          toggleNarrationMoment(moment.id);
                        }}
                        onPointerDown={(event) => event.stopPropagation()}
                        className={`absolute top-1/2 inline-flex h-[26px] max-w-[280px] -translate-y-1/2 items-center gap-2 rounded-[6px] border px-2 text-[11px] font-medium shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-custom-primary-100/40 ${isNarrationOpen ? "border-custom-text-400 bg-custom-background-80 text-custom-text-100" : "border-custom-border-200 bg-custom-background-90 text-custom-text-200 hover:border-custom-text-400"}`}
                        style={{ left: `${getTimelinePercent(moment.startTime, timelineDurationSeconds)}%` }}
                        aria-expanded={isNarrationOpen}
                        aria-label={`${isNarrationOpen ? "Collapse" : "Expand"} Voice narration`}
                      >
                        <ChevronRight
                          className={`size-3.5 shrink-0 transition-transform ${isNarrationOpen ? "rotate-90" : ""}`}
                        />
                        <Mic className="size-3 shrink-0 text-custom-primary-100" />
                        <span className="min-w-0 truncate">Voice narration</span>
                        <span className="shrink-0 text-custom-text-300">{moment.annotations.length}</span>
                      </button>
                    </div>
                    {isNarrationOpen &&
                      moment.annotations.map(({ annotation: clip }) => (
                        <div
                          key={`narration-track-${clip.id}`}
                          data-testid="narration-layer-track"
                          className="relative h-[34px] border-b border-custom-border-200 bg-custom-background-90"
                        >
                          <VoiceNarrationClip
                            key={clip.id}
                            clip={clip}
                            selected={narrationActions.selectedId === clip.id}
                            disabled={narrationActions.disabled}
                            duration={timelineDurationSeconds}
                            snapTimes={snapTimes}
                            onSelect={narrationActions.onSelect}
                            onChange={narrationActions.onChange}
                          />
                        </div>
                      ))}
                  </div>
                );
              }
              const isMomentOpen = openTimelineMomentIds.has(moment.id);

              return (
                <div key={`moment-track-${moment.id}`} data-testid="annotation-moment-track">
                  <div className="relative h-11 border-b border-custom-border-200 bg-custom-background-100">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onToggleTimelineMoment(moment.id);
                        onTimelineSeek(moment.startTime);
                      }}
                      onPointerDown={(event) => event.stopPropagation()}
                      className={[
                        "absolute top-1/2 inline-flex h-[26px] max-w-[280px] -translate-y-1/2 items-center gap-2 rounded-[6px] border px-2 text-[11px] font-medium shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-custom-primary-100/40",
                        isMomentOpen
                          ? "border-custom-text-400 bg-custom-background-80 text-custom-text-100"
                          : "border-custom-border-200 bg-custom-background-90 text-custom-text-200 hover:border-custom-text-400 hover:text-custom-text-100",
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
                              className="grid h-[18px] w-[18px] place-items-center rounded-[5px] border border-custom-background-100"
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
                          className="relative h-[34px] border-b border-custom-border-200 bg-custom-background-90"
                        >
                          <div
                            className={[
                              "absolute top-1/2 z-10 min-w-14 -translate-y-1/2",
                              isResizing ? "z-30" : "",
                            ].join(" ")}
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
                                "relative inline-flex h-6 w-full cursor-pointer items-center gap-1.5 overflow-hidden rounded-[5px] border px-3 pl-3 text-left text-[11px] font-semibold text-custom-text-100 shadow-sm transition-[filter,box-shadow] hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-custom-primary-100/40",
                                annotation.type === "audio" ? "pr-10" : "pr-5",
                                isResizing ? "shadow-[0_0_0_1px_rgba(37,99,235,0.24)]" : "",
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
                            {annotation.type === "audio" ? (
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.preventDefault();
                                  event.stopPropagation();
                                  onDeleteAnnotation(annotation.id);
                                }}
                                onPointerDown={(event) => event.stopPropagation()}
                                className="absolute inset-y-0 right-4 z-20 grid w-6 place-items-center text-custom-text-300 transition-colors hover:bg-red-500/10 hover:text-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40"
                                aria-label={`Delete ${annotationLabel}`}
                                title="Delete narration"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            ) : null}
                            <button
                              type="button"
                              onClick={(event) => {
                                event.preventDefault();
                                event.stopPropagation();
                              }}
                              onPointerDown={(event) => onTimelineResizePointerDown(event, annotation)}
                              onPointerMove={onTimelineResizePointerMove}
                              onPointerCancel={onTimelineResizePointerEnd}
                              onPointerUp={onTimelineResizePointerEnd}
                              className={[
                                "absolute inset-y-0 right-0 z-20 flex w-4 cursor-ew-resize touch-none select-none items-center justify-center rounded-r-[5px] border-y border-r border-l transition-[background-color,border-color,box-shadow] hover:brightness-125 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-custom-primary-100/40",
                                isResizing ? "shadow-[0_0_0_1px_rgba(37,99,235,0.26)]" : "",
                              ].join(" ")}
                              style={{
                                backgroundColor: getTimelineColorWithAlpha(color, isResizing ? 0.24 : 0.14),
                                borderColor: getTimelineColorWithAlpha(color, isResizing ? 0.46 : 0.28),
                                color: getTimelineColorWithAlpha(color, isResizing ? 0.95 : 0.7),
                              }}
                              aria-label={`Resize ${annotationLabel} duration`}
                              title="Pull to change duration"
                            >
                              <span className="flex flex-col items-center gap-px" aria-hidden="true">
                                <span className="h-0.5 w-0.5 rounded-full bg-current" />
                                <span className="h-0.5 w-0.5 rounded-full bg-current" />
                                <span className="h-0.5 w-0.5 rounded-full bg-current" />
                              </span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              );
            })}

            {annotationTimelineMoments.length === 0 && narrationClips.length === 0 && (
              <div className="relative h-11 border-b border-custom-border-200 bg-custom-background-100">
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
};
