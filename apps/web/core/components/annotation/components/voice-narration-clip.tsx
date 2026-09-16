"use client";
import { memo, useRef, useState } from "react";
import type { PointerEvent } from "react";
import { Copy, Download, Mic, Pencil, Play, RefreshCw, Square, Trash2 } from "lucide-react";
import { CustomMenu } from "@plane/ui";
import type { TCustomPlaylistAnnotation } from "../types/annotation.types";
import { getTimelinePercent } from "../utils/video-annotation-timeline";
import { moveNarration, narrationTime, trimNarration } from "../utils/voice-narration";
import { VoiceNarrationWaveform } from "./voice-narration-waveform";

type Props = {
  clip: TCustomPlaylistAnnotation;
  selected: boolean;
  disabled: boolean;
  previewing: boolean;
  duration: number;
  snapTimes: number[];
  onSelect: (clip: TCustomPlaylistAnnotation) => void;
  onChange: (clip: TCustomPlaylistAnnotation) => void;
  onPreview: (clip: TCustomPlaylistAnnotation) => void;
  onReplace: (clip: TCustomPlaylistAnnotation) => void;
  onDuplicate: (clip: TCustomPlaylistAnnotation) => void;
  onDelete: (id: string) => void;
};
export const VoiceNarrationClip = memo(function VoiceNarrationClip({
  clip,
  selected,
  disabled,
  previewing,
  duration,
  snapTimes,
  onSelect,
  onChange,
  onPreview,
  onReplace,
  onDuplicate,
  onDelete,
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
  const [downloadError, setDownloadError] = useState(false);
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
  const download = async () => {
    setDownloadError(false);
    try {
      const response = await fetch(clip.content ?? "");
      if (!response.ok) throw new Error("Audio download failed");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${(clip.title || "Narration").replace(/[^a-zA-Z0-9 _-]/g, "")}.${clip.mimeType?.includes("mp4") ? "m4a" : clip.mimeType?.includes("ogg") ? "ogg" : "webm"}`;
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      setDownloadError(true);
    }
  };
  return (
    <div
      ref={rootRef}
      className={`group absolute top-1 h-16 min-w-px rounded border bg-custom-primary-100/10 text-custom-primary-100 ${selected ? "z-20 border-custom-primary-100 ring-1 ring-custom-primary-100" : "z-10 border-custom-primary-100/30 hover:border-custom-primary-100/70"}`}
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
        className="h-full w-full touch-none overflow-hidden rounded px-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-custom-primary-100"
        title={clip.title || "Narration"}
      >
        <VoiceNarrationWaveform clip={visible} />
        <span className="flex min-w-0 items-center gap-1 text-[11px]">
          <Mic className="size-3 shrink-0" />
          <span className="min-w-0 truncate">{clip.title || "Narration"}</span>
          <span className="ml-auto shrink-0 font-mono tabular-nums">
            {(visible.endTime - visible.startTime).toFixed(1)}s
          </span>
        </span>
      </button>
      <div className="pointer-events-none absolute right-2 top-0 flex items-center rounded bg-custom-background-100 opacity-0 shadow-sm transition-opacity group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100">
        <button
          type="button"
          disabled={disabled}
          aria-label={previewing ? "Stop narration preview" : "Play narration"}
          title={previewing ? "Stop preview" : "Play narration"}
          onClick={() => onPreview(clip)}
          className="grid size-7 place-items-center rounded hover:bg-custom-background-80 focus-visible:ring-2 focus-visible:ring-custom-primary-100"
        >
          {previewing ? <Square className="size-3.5" /> : <Play className="size-3.5" />}
        </button>
        <CustomMenu
          ellipsis
          ariaLabel="Narration actions"
          disabled={disabled}
          closeOnSelect
          buttonClassName="!size-7"
          maxHeight="lg"
          menuItemsClassName="!z-[60]"
          placement="bottom-end"
          portalElement={typeof document !== "undefined" ? document.body : null}
        >
          <CustomMenu.MenuItem
            className="flex items-center gap-2"
            onClick={() => {
              onSelect(clip);
              requestAnimationFrame(() =>
                document.querySelector<HTMLInputElement>('[aria-label="Narration name"]')?.focus()
              );
            }}
          >
            <Pencil className="size-3.5 shrink-0" />
            Rename
          </CustomMenu.MenuItem>
          <CustomMenu.MenuItem className="flex items-center gap-2" onClick={() => onReplace(clip)}>
            <RefreshCw className="size-3.5 shrink-0" />
            Replace recording
          </CustomMenu.MenuItem>
          <CustomMenu.MenuItem className="flex items-center gap-2" onClick={() => onDuplicate(clip)}>
            <Copy className="size-3.5 shrink-0" />
            Duplicate
          </CustomMenu.MenuItem>
          <CustomMenu.MenuItem className="flex items-center gap-2" onClick={() => void download()}>
            <Download className="size-3.5 shrink-0" />
            Download original audio
          </CustomMenu.MenuItem>
          <CustomMenu.MenuItem className="flex items-center gap-2" onClick={() => onDelete(clip.id)}>
            <Trash2 className="size-3.5 shrink-0 text-red-500" />
            Delete
          </CustomMenu.MenuItem>
        </CustomMenu>
      </div>
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
      {downloadError ? (
        <span
          role="alert"
          className="absolute left-0 top-full z-40 min-w-36 rounded border border-red-500 bg-custom-background-100 p-2 text-xs text-red-500"
        >
          Download failed. Try again.
        </span>
      ) : null}
    </div>
  );
});
