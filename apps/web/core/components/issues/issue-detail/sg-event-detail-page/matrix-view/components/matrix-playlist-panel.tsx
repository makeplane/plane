import { useCallback, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Download, ListPlus, Maximize2, Plus, Video, X } from "lucide-react";
import { EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
import type { TCustomPlaylist } from "@/services/media-library.service";
import { HlsVideo } from "ce/features/media-library/components/hls-video";
import type { SgTagRow } from "../../types";
import { buildCustomPlaylistThumbnailUrl, buildCustomPlaylistUrl } from "../../utils";

type SgMatrixPlaylistPanelProps = {
  customPlaylists: TCustomPlaylist[];
  isCreatingPlaylist: boolean;
  onCreateCard: () => void;
  onCreatePlaylist: () => void;
  rows: SgTagRow[];
};

type SgPlaylistVideoModalProps = {
  onClose: () => void;
  playlist: TCustomPlaylist | null;
};

const SgPlaylistVideoModal = ({ onClose, playlist }: SgPlaylistVideoModalProps) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const videoShellRef = useRef<HTMLDivElement | null>(null);
  const playlistUrl = buildCustomPlaylistUrl(playlist?.url);
  const thumbnailUrl = buildCustomPlaylistThumbnailUrl(playlist?.thumbnail);
  const clipCount = playlist?.clip ?? 0;
  const playlistTitle = playlist?.name?.trim() || "Playlist";

  const handleOpenFullscreen = useCallback(() => {
    const fullscreenTarget = videoShellRef.current ?? videoRef.current;

    if (!fullscreenTarget || typeof document === "undefined") return;

    if (document.fullscreenElement) {
      void document.exitFullscreen();
      return;
    }

    void fullscreenTarget.requestFullscreen?.();
  }, []);

  return (
    <ModalCore
      isOpen={Boolean(playlist)}
      handleClose={onClose}
      position={EModalPosition.CENTER}
      width={EModalWidth.VIIXL}
      className="max-h-[calc(100dvh-1rem)] w-[calc(100vw-1rem)] overflow-hidden rounded-[8px] border border-white/10 bg-[#0d1016] p-0 text-white shadow-[0_28px_110px_rgba(0,0,0,0.62)] sm:!max-w-[1220px] lg:max-h-[calc(100dvh-2rem)]"
    >
      <div className="flex max-h-[calc(100dvh-1rem)] min-h-0 flex-col bg-[linear-gradient(180deg,rgba(255,255,255,0.055),rgba(255,255,255,0.015)_42%,rgba(0,0,0,0)_100%)] lg:max-h-[calc(100dvh-2rem)]">
        <div className="flex shrink-0 items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-2.5">
            <h3 className="truncate text-[16px] font-semibold leading-6 tracking-[-0.01em] text-white sm:text-[18px]">
              {playlistTitle}
            </h3>
            <span className="shrink-0 rounded-[5px] border border-[#338fdc]/30 bg-[#338fdc]/15 px-2 py-1 text-[11px] font-medium leading-none text-[#7cc6ff]">
              {clipCount} clip{clipCount === 1 ? "" : "s"}
            </span>
          </div>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
            {playlistUrl ? (
              <a
                href={playlistUrl}
                download={`${playlistTitle}.m3u8`}
                className="inline-flex h-8 items-center gap-2 rounded-[5px] px-2.5 text-[12px] font-medium text-white/88 transition-colors hover:bg-white/8 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7cc6ff]/70 sm:h-9 sm:px-3"
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Download</span>
              </a>
            ) : null}

            <button
              type="button"
              onClick={handleOpenFullscreen}
              className="inline-flex h-8 items-center gap-2 rounded-[5px] px-2.5 text-[12px] font-medium text-white/88 transition-colors hover:bg-white/8 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8b5cf6]/70 sm:h-9 sm:px-3"
              aria-label="Fullscreen playlist video"
            >
              <Maximize2 className="h-4 w-4" />
              <span className="hidden sm:inline">Fullscreen</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[6px] bg-white/[0.045] text-white/86 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8b5cf6]/70 sm:h-10 sm:w-10"
              aria-label="Close playlist video"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 px-3 pb-3 sm:px-6 sm:pb-6">
          <div
            ref={videoShellRef}
            className="mx-auto aspect-video max-h-[calc(100dvh-6.75rem)] w-full overflow-hidden rounded-[5px] border border-white/10 bg-black shadow-[0_18px_54px_rgba(0,0,0,0.44)] sm:max-h-[calc(100dvh-8.5rem)]"
          >
            {playlist && playlistUrl ? (
              <HlsVideo
                src={playlistUrl}
                poster={thumbnailUrl || undefined}
                videoRef={videoRef}
                className="block h-full w-full bg-black object-contain"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center px-4 text-center text-sm text-white/56">
                Playlist video is unavailable.
              </div>
            )}
          </div>
        </div>
      </div>
    </ModalCore>
  );
};

export const SgMatrixPlaylistPanel = ({
  customPlaylists,
  isCreatingPlaylist,
  onCreateCard,
  onCreatePlaylist,
  rows,
}: SgMatrixPlaylistPanelProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activePlaylist, setActivePlaylist] = useState<TCustomPlaylist | null>(null);

  if (isCollapsed) {
    return (
      <>
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
        <SgPlaylistVideoModal playlist={activePlaylist} onClose={() => setActivePlaylist(null)} />
      </>
    );
  }

  return (
    <>
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
              {customPlaylists.map((playlist) => {
                const thumbnailUrl = buildCustomPlaylistThumbnailUrl(playlist.thumbnail);

                return (
                  <li key={playlist.id}>
                    <button
                      type="button"
                      onClick={() => setActivePlaylist(playlist)}
                      className="group flex w-full items-center gap-2 rounded border border-[var(--sg-matrix-grid-border)] bg-[var(--sg-matrix-selected-nav)] px-2 py-2 text-left transition-colors hover:bg-[var(--sg-matrix-hover)]"
                    >
                      <span className="flex h-9 w-16 shrink-0 items-center justify-center overflow-hidden rounded bg-[var(--sg-matrix-cell-empty)] text-[var(--sg-matrix-text-muted)]">
                        {thumbnailUrl ? (
                          <img src={thumbnailUrl} alt="" className="h-full w-full object-cover" />
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
                );
              })}
            </ul>
          ) : (
            <div className="px-2 py-2 text-xs leading-5 text-[var(--sg-matrix-text-muted)]">
              Select tags or populated matrix cells, then click Create Playlist to show it here.
            </div>
          )}
        </div>
      </aside>
      <SgPlaylistVideoModal playlist={activePlaylist} onClose={() => setActivePlaylist(null)} />
    </>
  );
};
