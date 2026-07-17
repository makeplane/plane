import { useState } from "react";
import { ChevronLeft, ChevronRight, ListPlus, Plus, Video } from "lucide-react";
import type { TCustomPlaylist } from "@/services/media-library.service";
import type { SgTagRow } from "../../types";

type SgMatrixPlaylistPanelProps = {
  customPlaylists: TCustomPlaylist[];
  isCreatingPlaylist: boolean;
  onCreateCard: () => void;
  onCreatePlaylist: () => void;
  onPlayPlaylist: (playlist: TCustomPlaylist) => void;
  rows: SgTagRow[];
};

export const SgMatrixPlaylistPanel = ({
  customPlaylists,
  isCreatingPlaylist,
  onCreateCard,
  onCreatePlaylist,
  onPlayPlaylist,
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
        {customPlaylists.length > 0 ? (
          <span className="text-xs tabular-nums text-[var(--sg-matrix-text-muted)]">{customPlaylists.length}</span>
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

      <div className="vertical-scrollbar scrollbar-md min-h-0 flex-1 overflow-y-auto p-1.5">
        {customPlaylists.length > 0 ? (
          <ul className="space-y-1.5">
            {customPlaylists.map((playlist) => (
              <li key={playlist.id}>
                <button
                  type="button"
                  onClick={() => onPlayPlaylist(playlist)}
                  className="group flex w-full items-center gap-2 rounded border border-[var(--sg-matrix-grid-border)] bg-[var(--sg-matrix-selected-nav)] px-2 py-2 text-left transition-colors hover:bg-[var(--sg-matrix-hover)]"
                >
                  <span className="flex h-9 w-16 shrink-0 items-center justify-center overflow-hidden rounded bg-[var(--sg-matrix-cell-empty)] text-[var(--sg-matrix-text-muted)]">
                    {playlist.thumbnail ? (
                      <img src={playlist.thumbnail} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <Video className="h-3.5 w-3.5" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[11px] font-normal text-[var(--sg-matrix-text-secondary)]">
                      {playlist.name}
                    </span>
                    <span className="block truncate text-[10px] text-[var(--sg-matrix-text-muted)]">
                      {playlist.clip} clip{playlist.clip === 1 ? "" : "s"}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="px-2 py-2 text-xs leading-5 text-[var(--sg-matrix-text-muted)]">
            Select tags or populated matrix cells, then click Create Playlist to show it here.
          </div>
        )}
      </div>
    </aside>
  );
};
