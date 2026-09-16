"use client";
import { memo, useState } from "react";
import { Copy, Download, Loader2, Pencil, Play, RefreshCw, Square, Trash2 } from "lucide-react";
import { CustomMenu } from "@plane/ui";
import type { TCustomPlaylistAnnotation } from "../types/annotation.types";
import { finalizeNarrationAudio } from "../utils/narration-audio-container";
import { narrationAudio, narrationDownloadRequest } from "../utils/voice-narration";

type Props = {
  clip: TCustomPlaylistAnnotation;
  disabled: boolean;
  previewing: boolean;
  onSelect: (clip: TCustomPlaylistAnnotation) => void;
  onPreview: (clip: TCustomPlaylistAnnotation) => void;
  onReplace: (clip: TCustomPlaylistAnnotation) => void;
  onDuplicate: (clip: TCustomPlaylistAnnotation) => void;
  onDelete: (id: string) => void;
};

export const VoiceNarrationActions = memo(function VoiceNarrationActions({
  clip,
  disabled,
  previewing,
  onSelect,
  onPreview,
  onReplace,
  onDuplicate,
  onDelete,
}: Props) {
  const [downloadError, setDownloadError] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const download = async () => {
    if (downloading) return;
    setDownloadError(false);
    setDownloading(true);
    try {
      const request = narrationDownloadRequest(clip.content ?? "", window.location.origin);
      const response = await fetch(request.url, { credentials: request.credentials });
      if (!response.ok) throw new Error("Audio download failed");
      const sourceBlob = await response.blob();
      const mimeType = clip.mimeType || sourceBlob.type;
      const blob = await finalizeNarrationAudio(
        sourceBlob.slice(0, sourceBlob.size, mimeType),
        narrationAudio(clip).sourceDuration
      );
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${(clip.title || "Narration").replace(/[^a-zA-Z0-9 _-]/g, "")}.${blob.type.includes("mp4") ? "m4a" : blob.type.includes("ogg") ? "ogg" : "webm"}`;
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      setDownloadError(true);
    } finally {
      setDownloading(false);
    }
  };
  return (
    <div className="relative flex shrink-0 items-center">
      <button
        type="button"
        disabled={disabled}
        aria-label={previewing ? "Stop narration preview" : "Play narration"}
        title={previewing ? "Stop preview" : "Play narration"}
        onClick={() => onPreview(clip)}
        className="hidden size-7 place-items-center rounded text-custom-primary-100 hover:bg-custom-background-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-custom-primary-100 md:grid"
      >
        {previewing ? <Square className="size-3.5" /> : <Play className="size-3.5" />}
      </button>
      <CustomMenu
        ellipsis
        ariaLabel="Narration actions"
        disabled={disabled || downloading}
        closeOnSelect
        buttonClassName={downloading ? "!size-7 !opacity-0" : "!size-7"}
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
          <Pencil className="size-3.5 shrink-0" /> Rename
        </CustomMenu.MenuItem>
        <CustomMenu.MenuItem className="flex items-center gap-2" onClick={() => onReplace(clip)}>
          <RefreshCw className="size-3.5 shrink-0" /> Replace recording
        </CustomMenu.MenuItem>
        <CustomMenu.MenuItem className="flex items-center gap-2" onClick={() => onDuplicate(clip)}>
          <Copy className="size-3.5 shrink-0" /> Duplicate
        </CustomMenu.MenuItem>
        <CustomMenu.MenuItem className="flex items-center gap-2" onClick={() => void download()}>
          <Download className="size-3.5 shrink-0" /> Download original audio
        </CustomMenu.MenuItem>
        <CustomMenu.MenuItem className="flex items-center gap-2" onClick={() => onDelete(clip.id)}>
          <Trash2 className="size-3.5 shrink-0 text-red-500" /> Delete
        </CustomMenu.MenuItem>
      </CustomMenu>
      {downloading ? (
        <span
          role="status"
          aria-label="Preparing audio download"
          className="pointer-events-none absolute right-0 top-0 grid size-7 place-items-center"
        >
          <Loader2 className="size-3.5 animate-spin" />
        </span>
      ) : null}
      {downloadError ? (
        <span
          role="alert"
          className="absolute right-0 top-full z-[60] min-w-36 rounded border border-red-500 bg-custom-background-100 p-2 text-xs text-red-500"
        >
          Download failed. Try again.
        </span>
      ) : null}
    </div>
  );
});
