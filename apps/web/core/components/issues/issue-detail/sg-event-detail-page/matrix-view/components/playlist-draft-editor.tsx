import { useEffect, useRef, useState } from "react";
import { ListPlus, Video, X } from "lucide-react";
import { cn } from "@plane/utils";
import { getPlaylistDraftRows, PLAYLIST_TAG_DRAG_TYPE, readPlaylistTagDragData } from "../../playlist-draft";
import type { PlaylistDraft } from "../../playlist-draft";
import type { SgTagRow } from "../../types";

type PlaylistDraftEditorProps = {
  availableRows: SgTagRow[];
  draft: PlaylistDraft;
  isSaving: boolean;
  onChange: (draft: PlaylistDraft | null) => void;
  onSave: (rows: SgTagRow[], name?: string) => Promise<boolean>;
  selectedRows: SgTagRow[];
};

export const PlaylistDraftEditor = ({
  availableRows,
  draft,
  isSaving,
  onChange,
  onSave,
  selectedRows,
}: PlaylistDraftEditorProps) => {
  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const isSubmittingRef = useRef(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState("");
  const draftRows = getPlaylistDraftRows(availableRows, draft.rowIds);

  useEffect(() => {
    nameInputRef.current?.focus();
    nameInputRef.current?.select();
  }, []);

  const addClips = (rowIds: string[]) => {
    if (isSaving || isSubmittingRef.current) return;
    const duplicateCount = [...new Set(rowIds)].filter((id) => draft.rowIds.includes(id)).length;
    const addedRows = getPlaylistDraftRows(availableRows, rowIds);
    if (addedRows.length === 0) {
      setError("These clips do not have playable timestamps.");
      return;
    }
    const nextRows = getPlaylistDraftRows(availableRows, [...draft.rowIds, ...addedRows.map((row) => row.id)]);
    onChange({ ...draft, rowIds: nextRows.map((row) => row.id) });
    const messages: string[] = [];
    if (duplicateCount > 0) {
      messages.push(
        duplicateCount === 1
          ? "This clip is already selected in this playlist."
          : `${duplicateCount} clips are already selected in this playlist.`
      );
    }
    if (addedRows.length < new Set(rowIds).size) messages.push("Clips without playable timestamps were skipped.");
    setError(messages.join(" "));
  };

  return (
    <form
      aria-label="New playlist"
      className={cn(
        "mb-2 rounded-[7px] border border-dashed p-2 transition-colors",
        isDragOver
          ? "border-custom-primary-100 bg-custom-primary-100/10"
          : "border-[var(--sg-matrix-active-border)] bg-[var(--sg-matrix-panel-secondary)]"
      )}
      onDragOver={(event) => {
        if (isSaving || !event.dataTransfer.types.includes(PLAYLIST_TAG_DRAG_TYPE)) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = "copy";
        setIsDragOver(true);
      }}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setIsDragOver(false);
      }}
      onDrop={(event) => {
        if (!event.dataTransfer.types.includes(PLAYLIST_TAG_DRAG_TYPE)) return;
        event.preventDefault();
        event.stopPropagation();
        setIsDragOver(false);
        addClips(readPlaylistTagDragData(event.dataTransfer));
      }}
      onSubmit={async (event) => {
        event.preventDefault();
        if (isSaving || isSubmittingRef.current || !draft.name.trim() || draftRows.length === 0) return;
        isSubmittingRef.current = true;
        setError("");
        try {
          if (await onSave(draftRows, draft.name.trim())) onChange(null);
        } catch {
          setError("Unable to save the playlist. Your clips are still here; please try again.");
        } finally {
          isSubmittingRef.current = false;
        }
      }}
    >
      <div className="flex items-center gap-2">
        <input
          ref={nameInputRef}
          aria-label="Playlist name"
          className="h-8 min-w-0 flex-1 rounded border border-[var(--sg-matrix-border)] bg-[var(--sg-matrix-panel)] px-2 text-xs text-[var(--sg-matrix-text)] outline-none focus:border-custom-primary-100"
          disabled={isSaving}
          maxLength={255}
          onChange={(event) => onChange({ ...draft, name: event.target.value })}
          required
          value={draft.name}
        />
        <button
          type="button"
          aria-label="Cancel new playlist"
          title="Cancel new playlist"
          disabled={isSaving}
          onClick={() => onChange(null)}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-[var(--sg-matrix-text-muted)] hover:bg-[var(--sg-matrix-hover)] disabled:opacity-40"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <p className="py-3 text-center text-[11px] text-[var(--sg-matrix-text-muted)]">
        {isDragOver ? "Drop clips here" : "Drag clips here to build your playlist"}
      </p>
      {draftRows.length > 0 && (
        <ol aria-label="Clips in new playlist" className="mb-2 max-h-40 space-y-1 overflow-y-auto">
          {draftRows.map((row, index) => (
            <li
              key={row.id}
              className="flex min-w-0 items-center gap-1.5 rounded border border-gray-400/15 bg-gray-400/[0.04] px-1.5 py-1"
            >
              <Video className="h-3 w-3 shrink-0 text-gray-400" />
              <span className="min-w-0 flex-1 truncate text-[10px] text-[var(--sg-matrix-text-secondary)]">
                {index + 1}. {row.action || row.primaryDetail || "Clip"}
              </span>
              <span className="text-[9px] text-[var(--sg-matrix-text-muted)]">{row.timecode}</span>
              <button
                type="button"
                aria-label={`Remove clip ${index + 1} from new playlist`}
                disabled={isSaving}
                onClick={() => {
                  onChange({ ...draft, rowIds: draft.rowIds.filter((id) => id !== row.id) });
                  setError("");
                }}
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-[var(--sg-matrix-text-muted)] hover:bg-[var(--sg-matrix-hover)] disabled:opacity-40"
              >
                <X className="h-3 w-3" />
              </button>
            </li>
          ))}
        </ol>
      )}
      {error && (
        <p role="alert" className="mb-2 text-[11px] text-red-400">
          {error}
        </p>
      )}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          disabled={isSaving || selectedRows.length === 0}
          onClick={() => addClips(selectedRows.map((row) => row.id))}
          className="text-[10px] text-[var(--sg-matrix-primary-blue)] hover:underline disabled:opacity-40"
        >
          Add selected clips
        </button>
        <button
          type="submit"
          disabled={isSaving || draftRows.length === 0 || !draft.name.trim()}
          className="inline-flex h-7 items-center gap-1.5 rounded bg-custom-primary-100 px-2 text-[10px] font-medium text-white hover:bg-custom-primary-200 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ListPlus className="h-3 w-3" />
          {isSaving ? "Saving…" : `Save playlist (${draftRows.length})`}
        </button>
      </div>
    </form>
  );
};
