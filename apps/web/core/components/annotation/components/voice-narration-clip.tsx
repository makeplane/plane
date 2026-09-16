"use client";
import { memo, useRef, useState } from "react";
import type { PointerEvent } from "react";
import type { TCustomPlaylistAnnotation } from "../types/annotation.types";
import { getTimelinePercent } from "../utils/video-annotation-timeline";
import { moveNarration, narrationTime, trimNarration } from "../utils/voice-narration";
import { VoiceNarrationWaveform } from "./voice-narration-waveform";

type Props = {
  clip: TCustomPlaylistAnnotation;
  selected: boolean;
  disabled: boolean;
  duration: number;
  snapTimes: number[];
  onSelect: (clip: TCustomPlaylistAnnotation) => void;
  onChange: (clip: TCustomPlaylistAnnotation) => void;
};
export const VoiceNarrationClip = memo(function VoiceNarrationClip({
  clip,
  selected,
  disabled,
  duration,
  snapTimes,
  onSelect,
  onChange,
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const gesture = useRef<{
    x: number;
    width: number;
    edge: "start" | "end" | "move";
    original: TCustomPlaylistAnnotation;
    next: TCustomPlaylistAnnotation;
  } | null>(null);
  const [draft, setDraft] = useState<TCustomPlaylistAnnotation | null>(null);
  const suppressClickRef = useRef(false);
  const visible = draft ?? clip;
  const begin = (event: PointerEvent<HTMLButtonElement>, edge: "start" | "end" | "move") => {
    event.stopPropagation();
    if (disabled || event.button !== 0) return;
    suppressClickRef.current = false;
    onSelect(clip);
    event.currentTarget.setPointerCapture(event.pointerId);
    gesture.current = {
      x: event.clientX,
      width: rootRef.current?.parentElement?.clientWidth ?? 1,
      edge,
      original: clip,
      next: clip,
    };
  };
  const move = (event: PointerEvent<HTMLButtonElement>) => {
    const active = gesture.current;
    if (!active || !event.currentTarget.hasPointerCapture(event.pointerId)) return;
    event.preventDefault();
    event.stopPropagation();
    if (Math.abs(event.clientX - active.x) < 3) return;
    suppressClickRef.current = true;
    let target =
      (active.edge === "end" ? active.original.endTime : active.original.startTime) +
      ((event.clientX - active.x) / active.width) * duration;
    const snap = snapTimes.find((time) => (Math.abs(target - time) / duration) * active.width < 5);
    target = snap ?? Math.round(target * 100) / 100;
    active.next =
      active.edge === "move"
        ? moveNarration(active.original, target, duration)
        : trimNarration(active.original, active.edge, Math.min(duration, target));
    setDraft(active.next);
  };
  const finish = (event: PointerEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    const active = gesture.current;
    gesture.current = null;
    setDraft(null);
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
    if (active && active.next !== active.original && event.type !== "pointercancel") onChange(active.next);
  };
  return (
    <div
      ref={rootRef}
      className={`group absolute top-1/2 h-7 min-w-px -translate-y-1/2 rounded border bg-custom-primary-100/10 text-custom-primary-100 ${selected ? "z-20 border-custom-primary-100 ring-1 ring-custom-primary-100" : "z-10 border-custom-primary-100/30 hover:border-custom-primary-100/70"}`}
      style={{
        left: `${getTimelinePercent(visible.startTime, duration)}%`,
        width: `${getTimelinePercent(visible.endTime - visible.startTime, duration)}%`,
      }}
      onPointerDown={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
    >
      <button
        type="button"
        disabled={disabled}
        aria-label={`${clip.title || "Narration"}, starts ${narrationTime(visible.startTime)}, duration ${(visible.endTime - visible.startTime).toFixed(2)} seconds`}
        aria-pressed={selected}
        onClick={() => {
          if (!suppressClickRef.current) onSelect(clip);
          suppressClickRef.current = false;
        }}
        onPointerDown={(event) => begin(event, "move")}
        onPointerMove={move}
        onPointerUp={finish}
        onPointerCancel={finish}
        className="flex h-full w-full touch-none items-center gap-2 overflow-hidden rounded px-3 text-left text-[11px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-custom-primary-100"
        title={clip.title || "Narration"}
      >
        <span className="min-w-0 max-w-[45%] truncate">{clip.title || "Narration"}</span>
        <span className="min-w-0 flex-1">
          <VoiceNarrationWaveform clip={visible} />
        </span>
        <span className="shrink-0 font-mono tabular-nums">{(visible.endTime - visible.startTime).toFixed(1)}s</span>
      </button>
      {selected
        ? (["start", "end"] as const).map((edge) => (
            <button
              key={edge}
              type="button"
              disabled={disabled}
              aria-label={`Trim narration ${edge}`}
              title={`Trim ${edge}`}
              className={`absolute inset-y-0 z-30 w-2 cursor-ew-resize touch-none rounded bg-custom-primary-100/40 hover:bg-custom-primary-100 focus-visible:ring-2 focus-visible:ring-custom-primary-100 ${edge === "start" ? "left-0" : "right-0"}`}
              onPointerDown={(event) => begin(event, edge)}
              onPointerMove={move}
              onPointerUp={finish}
              onPointerCancel={finish}
              onKeyDown={(event) => {
                if (disabled || !["ArrowLeft", "ArrowRight"].includes(event.key)) return;
                event.preventDefault();
                event.stopPropagation();
                const delta = (event.key === "ArrowLeft" ? -1 : 1) * (event.shiftKey ? 1 : 0.1);
                onChange(
                  trimNarration(
                    clip,
                    edge,
                    Math.min(duration, (edge === "start" ? clip.startTime : clip.endTime) + delta)
                  )
                );
              }}
            />
          ))
        : null}
    </div>
  );
});
