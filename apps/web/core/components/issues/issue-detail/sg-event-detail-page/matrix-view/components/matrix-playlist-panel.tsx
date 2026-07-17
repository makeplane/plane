import { useState } from "react";
import { ChevronLeft, ChevronRight, ListPlus, Play, Plus, Video } from "lucide-react";
import type { SgTagRow } from "../../types";

type SgMatrixPlaylistPanelProps = {
  activeRowId?: string | null;
  isCreatingPlaylist: boolean;
  onCreateCard: () => void;
  onCreatePlaylist: () => void;
  onPlayTagRow: (row: SgTagRow) => void | Promise<void>;
  rows: SgTagRow[];
};

export const SgMatrixPlaylistPanel = ({
  activeRowId,
  isCreatingPlaylist,
  onCreateCard,
  onCreatePlaylist,
  onPlayTagRow,
  rows,
}: SgMatrixPlaylistPanelProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (isCollapsed) {
    return (
      <aside className="flex min-h-[240px] w-full flex-col items-center gap-3 rounded-[5px] border border-[var(--sg-matrix-border)] bg-[var(--sg-matrix-panel-secondary)] p-2 xl:w-12">
        <button
          type="button"
          onClick={() => setIsCollapsed(false)}
          className="inline-flex h-8 w-8 items-center justify-center rounded text-[var(--sg-matrix-text-secondary)] transition-colors hover:bg-[var(--sg-matrix-hover)] hover:text-[var(--sg-matrix-text)]"
          aria-label="Expand playlist workspace"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <Video aria-hidden="true" className="h-4 w-4 text-[var(--sg-matrix-text-muted)]" />
        {rows.length > 0 ? (
          <span className="text-xs tabular-nums text-[var(--sg-matrix-text-muted)]">{rows.length}</span>
        ) : null}
      </aside>
    );
  }

  return (
    <aside className="flex min-h-[240px] flex-col overflow-hidden rounded-[5px] border border-[var(--sg-matrix-border)] bg-[var(--sg-matrix-panel-secondary)]">
      <div className="flex h-[34px] items-center justify-between gap-3 border-b border-[var(--sg-matrix-border)] px-2.5">
        <div className="min-w-0">
          <div className="truncate text-[13px] font-normal text-[var(--sg-matrix-text-secondary)]">
            Playlist Workspace
          </div>
          <div className="hidden text-[10px] text-[var(--sg-matrix-text-muted)]">
            {rows.length > 0 ? `${rows.length} selected tag${rows.length === 1 ? "" : "s"}` : "No clips selected"}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsCollapsed(true)}
          className="inline-flex h-7 w-7 items-center justify-center rounded text-[var(--sg-matrix-text-secondary)] transition-colors hover:bg-[var(--sg-matrix-hover)] hover:text-[var(--sg-matrix-text)]"
          aria-label="Collapse playlist workspace"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="flex gap-2 border-b border-[var(--sg-matrix-border)] px-2 py-2">
        <button
          type="button"
          disabled={rows.length === 0}
          onClick={onCreateCard}
          className="inline-flex h-7 flex-1 items-center justify-center gap-1.5 rounded-[5px] border border-[var(--sg-matrix-border)] bg-[var(--sg-matrix-selected-nav)] px-2 text-[11px] font-normal text-[var(--sg-matrix-text-secondary)] transition-colors hover:bg-[var(--sg-matrix-hover)] hover:text-[var(--sg-matrix-text)] disabled:cursor-not-allowed disabled:text-[var(--sg-matrix-text-disabled)] disabled:opacity-45"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Create Card</span>
        </button>
        <button
          type="button"
          disabled={rows.length === 0 || isCreatingPlaylist}
          onClick={onCreatePlaylist}
          className="inline-flex h-7 flex-1 items-center justify-center gap-1.5 rounded-[5px] border border-[var(--sg-matrix-border)] bg-[var(--sg-matrix-selected-nav)] px-2 text-[11px] font-normal text-[var(--sg-matrix-text-secondary)] transition-colors hover:bg-[var(--sg-matrix-hover)] hover:text-[var(--sg-matrix-text)] disabled:cursor-not-allowed disabled:text-[var(--sg-matrix-text-disabled)] disabled:opacity-45"
        >
          <ListPlus className="h-3.5 w-3.5" />
          <span>{isCreatingPlaylist ? "Creating" : "Create Playlist"}</span>
        </button>
      </div>

      {rows.length === 0 ? (
        <div className="flex min-h-0 flex-1 items-start px-3 py-3 text-left text-xs leading-5 text-[var(--sg-matrix-text-muted)]">
          Select populated cells in the matrix to build a playlist.
        </div>
      ) : (
        <ul className="vertical-scrollbar scrollbar-md min-h-0 flex-1 space-y-1.5 overflow-y-auto p-1.5">
          {rows.map((row) => {
            const isActive = activeRowId === row.id;

            return (
              <li key={row.id}>
                <button
                  type="button"
                  onClick={() => void onPlayTagRow(row)}
                  className={`group flex w-full items-center gap-2 rounded border px-2 py-2 text-left transition-colors ${
                    isActive
                      ? "border-[var(--sg-matrix-selected-card-border)] bg-[var(--sg-matrix-selected-nav)]"
                      : "border-[var(--sg-matrix-grid-border)] bg-[var(--sg-matrix-selected-nav)] hover:bg-[var(--sg-matrix-hover)]"
                  }`}
                >
                  <span className="flex h-9 w-16 shrink-0 items-center justify-center overflow-hidden rounded bg-[var(--sg-matrix-cell-empty)] text-[var(--sg-matrix-text-muted)]">
                    {row.thumbnailUrl ? (
                      <img src={row.thumbnailUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <Play className="h-3.5 w-3.5" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[11px] font-normal text-[var(--sg-matrix-text-secondary)]">
                      {row.action}
                    </span>
                    <span className="block truncate text-[10px] text-[var(--sg-matrix-text-muted)]">
                      {[row.timecode, row.player].filter(Boolean).join(" · ")}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </aside>
  );
};
