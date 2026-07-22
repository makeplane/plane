import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import { Maximize2, MoreVertical, Share2, Trash2, Video, X } from "lucide-react";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { AlertModalCore, EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
import type { TCustomPlaylist } from "@/services/media-library.service";
import { HlsVideo } from "ce/features/media-library/components/hls-video";
import { PLAYER_FRAME_CLASS } from "../../constants";
import type { SgTagRow } from "../../types";
import { buildCustomPlaylistThumbnailUrl, buildCustomPlaylistUrl } from "../../utils";

type SgMatrixPlaylistPanelProps = {
  customPlaylists: TCustomPlaylist[];
  isCreatingPlaylist?: boolean;
  onCreateCard?: () => void;
  onCreatePlaylist?: () => void;
  onDeletePlaylist: (playlist: TCustomPlaylist) => Promise<void>;
  rows?: SgTagRow[];
};

type SgPlaylistVideoModalProps = {
  onClose: () => void;
  playlist: TCustomPlaylist | null;
};

type PlaylistSegment = {
  durationSeconds: number;
  endSeconds: number;
  startSeconds: number;
};

type PlaylistClipCard = {
  endSeconds: number;
  id: string;
  index: number;
  startSeconds: number;
  subtitle: string;
  tags: string[];
  thumbnailUrl: string;
  timeLabel: string;
  timestampLabel: string;
  title: string;
};

const EMPTY_CARD_VALUES = new Set(["", "-", "--", "n/a", "na", "null", "undefined"]);

const normalizeCardText = (value: string | null | undefined) => {
  const normalizedValue = (value ?? "").trim();
  return EMPTY_CARD_VALUES.has(normalizedValue.toLowerCase()) ? "" : normalizedValue;
};

const formatClipTime = (seconds: number) => {
  if (!Number.isFinite(seconds) || seconds < 0) return "--:--";

  const totalSeconds = Math.floor(seconds);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const remainingSeconds = totalSeconds % 60;

  if (hours > 0) {
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
  }

  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
};

const formatSourceTimestamp = (value: string | null | undefined) => {
  const normalizedValue = normalizeCardText(value);
  if (!normalizedValue) return "";

  const isoTimeMatch = normalizedValue.match(/^\d{4}-\d{2}-\d{2}[T\s](\d{2}:\d{2}(?::\d{2})?)/);
  if (isoTimeMatch?.[1]) return isoTimeMatch[1];

  const clockMatch = normalizedValue.match(/^(\d{1,2}:\d{2}(?::\d{2})?)(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?$/);
  if (clockMatch?.[1]) return clockMatch[1];

  return normalizedValue;
};

const getPlaylistCardClipCount = (playlist: TCustomPlaylist) => {
  const savedClips = Array.isArray(playlist.clips) ? playlist.clips : [];
  const explicitCount = Number(playlist.clip ?? 0);
  return explicitCount > 0 ? explicitCount : savedClips.length;
};

const formatPlaylistCardClipCount = (count: number) =>
  `${String(Math.max(count, 0)).padStart(2, "0")} Clip${count === 1 ? "" : "s"}`;

const getPlaylistCardTitle = (playlist: TCustomPlaylist) => {
  const savedClips = Array.isArray(playlist.clips) ? playlist.clips : [];
  const groupValues = Array.from(new Set(savedClips.map((clip) => normalizeCardText(clip.groupValue)).filter(Boolean)));
  if (groupValues.length === 1) return groupValues[0];

  const cleanedName = normalizeCardText(playlist.name).replace(/\s*\(\d+\s+clips?\)\s*$/i, "");
  return normalizeCardText(cleanedName) || normalizeCardText(savedClips[0]?.title) || "Playlist";
};

const getPlaylistCardSubtitle = (playlist: TCustomPlaylist) => {
  const savedClips = Array.isArray(playlist.clips) ? playlist.clips : [];
  const clipCount = getPlaylistCardClipCount(playlist);
  if (clipCount > 1) return "All Plays";

  return normalizeCardText(savedClips[0]?.subtitle) || "Ready";
};

const parsePlaylistSegments = (playlistText: string): PlaylistSegment[] => {
  const segments: PlaylistSegment[] = [];
  let elapsedSeconds = 0;

  for (const line of playlistText.split(/\r?\n/)) {
    const match = line.trim().match(/^#EXTINF:([\d.]+)/i);
    if (!match?.[1]) continue;

    const durationSeconds = Number(match[1]);
    if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) continue;

    const startSeconds = elapsedSeconds;
    elapsedSeconds += durationSeconds;
    segments.push({
      durationSeconds,
      endSeconds: elapsedSeconds,
      startSeconds,
    });
  }

  return segments;
};

const getClipSegmentRange = (
  segments: PlaylistSegment[],
  index: number,
  count: number,
  fallbackDurationSeconds = 0
) => {
  if (segments.length > 0 && count > 0) {
    const startIndex = Math.floor((index * segments.length) / count);
    const exclusiveEndIndex = Math.floor(((index + 1) * segments.length) / count);
    const endIndex = Math.max(startIndex, exclusiveEndIndex - 1);
    const startSegment = segments[startIndex];
    const endSegment = segments[endIndex];

    if (startSegment && endSegment) {
      return {
        startSeconds: startSegment.startSeconds,
        endSeconds: Math.max(endSegment.endSeconds, startSegment.startSeconds),
      };
    }
  }

  const startSeconds = index * fallbackDurationSeconds;
  return {
    startSeconds,
    endSeconds: startSeconds + fallbackDurationSeconds,
  };
};

const buildClipCards = (playlist: TCustomPlaylist | null, segments: PlaylistSegment[]): PlaylistClipCard[] => {
  const savedClips = Array.isArray(playlist?.clips) ? playlist.clips : [];
  const explicitCount = Number(playlist?.clip ?? 0);
  const count = explicitCount > 0 ? explicitCount : savedClips.length;
  if (!playlist || count <= 0) return [];

  const fallbackDurationSeconds = segments.length > 0 ? segments[segments.length - 1].endSeconds / count : 0;

  return Array.from({ length: count }, (_, index) => {
    const savedClip = savedClips[index];
    const range = getClipSegmentRange(segments, index, count, fallbackDurationSeconds);

    const timestampLabel = formatSourceTimestamp(savedClip?.timestamp);
    const tags = Array.isArray(savedClip?.tags)
      ? savedClip.tags.map(normalizeCardText).filter(Boolean).slice(0, 2)
      : [];

    return {
      endSeconds: range.endSeconds,
      id: savedClip?.id || `${playlist.id}-clip-${index + 1}`,
      index,
      startSeconds: range.startSeconds,
      subtitle:
        normalizeCardText(savedClip?.subtitle) ||
        [savedClip?.player, savedClip?.team, savedClip?.groupValue].map(normalizeCardText).filter(Boolean).join(" / "),
      tags,
      thumbnailUrl: buildCustomPlaylistThumbnailUrl(savedClip?.thumbnail || playlist.thumbnail),
      timeLabel: formatClipTime(range.startSeconds) || timestampLabel || `Clip ${index + 1}`,
      timestampLabel,
      title: normalizeCardText(savedClip?.title) || `Clip ${index + 1}`,
    };
  });
};

const SgPlaylistVideoModal = ({ onClose, playlist }: SgPlaylistVideoModalProps) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const videoShellRef = useRef<HTMLDivElement | null>(null);
  const [activeClipIndex, setActiveClipIndex] = useState<number | null>(null);
  const [playlistSegments, setPlaylistSegments] = useState<PlaylistSegment[]>([]);
  const playlistUrl = buildCustomPlaylistUrl(playlist?.url);
  const thumbnailUrl = buildCustomPlaylistThumbnailUrl(playlist?.thumbnail);
  const clipCount = playlist?.clip ?? 0;
  const playlistTitle = playlist?.name?.trim() || "Playlist";
  const clipCards = useMemo(() => buildClipCards(playlist, playlistSegments), [playlist, playlistSegments]);
  const activeClip = activeClipIndex !== null ? clipCards[activeClipIndex] : null;

  useEffect(() => {
    setActiveClipIndex(null);
    setPlaylistSegments([]);

    if (!playlistUrl) return;

    let isCancelled = false;
    void fetch(playlistUrl, { cache: "no-store" })
      .then((response) => (response.ok ? response.text() : ""))
      .then((playlistText) => {
        if (!isCancelled) setPlaylistSegments(parsePlaylistSegments(playlistText));
      })
      .catch(() => {
        if (!isCancelled) setPlaylistSegments([]);
      });

    return () => {
      isCancelled = true;
    };
  }, [playlistUrl]);

  useEffect(() => {
    if (!playlistUrl || !videoRef.current) return;

    const video = videoRef.current;
    const playFullPlaylist = () => {
      video.currentTime = 0;
      void video.play().catch(() => undefined);
    };

    if (video.readyState >= 1) {
      playFullPlaylist();
      return;
    }

    video.addEventListener("loadedmetadata", playFullPlaylist, { once: true });
    return () => video.removeEventListener("loadedmetadata", playFullPlaylist);
  }, [playlistUrl]);

  useEffect(() => {
    if (!activeClip || !videoRef.current) return;

    const video = videoRef.current;
    const playClip = () => {
      video.currentTime = activeClip.startSeconds;
      void video.play().catch(() => undefined);
    };

    if (video.readyState >= 1) {
      playClip();
      return;
    }

    video.addEventListener("loadedmetadata", playClip, { once: true });
    return () => video.removeEventListener("loadedmetadata", playClip);
  }, [activeClip]);

  useEffect(() => {
    if (!activeClip || !videoRef.current || activeClip.endSeconds <= activeClip.startSeconds) return;

    const video = videoRef.current;
    const loopClip = () => {
      if (video.currentTime < activeClip.endSeconds - 0.08) return;

      video.currentTime = activeClip.startSeconds;
      void video.play().catch(() => undefined);
    };

    video.addEventListener("timeupdate", loopClip);
    video.addEventListener("ended", loopClip);

    return () => {
      video.removeEventListener("timeupdate", loopClip);
      video.removeEventListener("ended", loopClip);
    };
  }, [activeClip]);

  const handleOpenFullscreen = useCallback(() => {
    const fullscreenTarget = videoShellRef.current ?? videoRef.current;

    if (!fullscreenTarget || typeof document === "undefined") return;

    if (document.fullscreenElement) {
      void document.exitFullscreen();
      return;
    }

    void fullscreenTarget.requestFullscreen?.();
  }, []);

  const handlePlayFullPlaylist = useCallback(() => {
    setActiveClipIndex(null);

    const video = videoRef.current;
    if (!video) return;

    video.currentTime = 0;
    void video.play().catch(() => undefined);
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
            {/* {playlistUrl ? (
              <a
                href={playlistUrl}
                download={`${playlistTitle}.m3u8`}
                className="inline-flex h-8 items-center gap-2 rounded-[5px] px-2.5 text-[12px] font-medium text-white/88 transition-colors hover:bg-white/8 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7cc6ff]/70 sm:h-9 sm:px-3"
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Download</span>
              </a>
            ) : null} */}

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
          <div className="grid min-h-0 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_312px]">
            <div
              ref={videoShellRef}
              className="aspect-video min-h-0 overflow-hidden rounded-[5px] border border-white/10 bg-black shadow-[0_18px_54px_rgba(0,0,0,0.44)]"
            >
              {playlist && playlistUrl ? (
                <HlsVideo
                  key={playlistUrl}
                  src={playlistUrl}
                  poster={thumbnailUrl || undefined}
                  autoPlay
                  videoRef={videoRef}
                  className="block h-full w-full bg-black object-contain"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center px-4 text-center text-sm text-white/56">
                  Playlist video is unavailable.
                </div>
              )}
            </div>

            <aside className="flex w-full min-w-0 flex-col overflow-hidden rounded-[6px] border border-white/10 bg-white/[0.025]">
              <div className="flex h-11 shrink-0 items-center justify-between gap-3 border-b border-white/10 px-3">
                <div className="text-[14px] font-semibold text-white">Clips ({clipCards.length || clipCount})</div>
                <button
                  type="button"
                  onClick={handlePlayFullPlaylist}
                  className="inline-flex h-7 shrink-0 items-center gap-1.5 rounded-[5px] border border-[#338fdc]/30 bg-[#338fdc]/10 px-2 text-[11px] font-medium text-[#7cc6ff] transition-colors hover:bg-[#338fdc]/18"
                >
                  <Video className="h-3.5 w-3.5" />
                  <span>Full playlist</span>
                </button>
              </div>

              <div className="vertical-scrollbar scrollbar-md max-h-[330px] overflow-y-auto overscroll-contain p-2.5 lg:max-h-[420px]">
                {clipCards.length > 0 ? (
                  <ul className="space-y-2">
                    {clipCards.map((clipCard, index) => {
                      const isActive = activeClipIndex === index;
                      const canSeek = clipCard.endSeconds > clipCard.startSeconds;

                      return (
                        <li key={clipCard.id}>
                          <button
                            type="button"
                            disabled={!canSeek}
                            onClick={() => setActiveClipIndex(index)}
                            className={[
                              "group relative flex w-full min-w-0 gap-2 rounded-[6px] border p-2 text-left transition-colors",
                              isActive
                                ? "border-[#338fdc]/70 bg-[#338fdc]/12"
                                : "border-white/10 bg-white/[0.035] hover:bg-white/[0.055]",
                              !canSeek ? "cursor-not-allowed opacity-55" : "",
                            ].join(" ")}
                            aria-pressed={isActive}
                          >
                            <span className="absolute right-2 top-2 inline-flex max-w-[92px] items-center rounded-[4px] border border-[#338fdc]/20 bg-[#338fdc]/10 px-1.5 py-0.5 text-[10px] leading-none text-[#9bd4ff]">
                              <span className="truncate">
                                {clipCard.timestampLabel || `Clip ${clipCard.index + 1}`}
                              </span>
                            </span>

                            <span className="relative flex h-[50px] w-[76px] shrink-0 items-center justify-center overflow-hidden rounded-[5px] bg-black text-white/46">
                              {clipCard.thumbnailUrl ? (
                                <img src={clipCard.thumbnailUrl} alt="" className="h-full w-full object-cover" />
                              ) : (
                                <Video className="h-4 w-4" />
                              )}
                              <span className="absolute bottom-1 right-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] text-white">
                                {clipCard.timeLabel}
                              </span>
                            </span>

                            <span className="min-w-0 flex-1 pr-[96px]">
                              <span className="block truncate text-[12px] font-medium leading-4 text-white">
                                {clipCard.title}
                              </span>
                              {clipCard.subtitle ? (
                                <span className="mt-0.5 block truncate text-[11px] leading-4 text-white/52">
                                  {clipCard.subtitle}
                                </span>
                              ) : null}
                              {clipCard.tags.length > 0 ? (
                                <span className="mt-1.5 flex min-w-0 gap-1">
                                  {clipCard.tags.map((tag) => (
                                    <span
                                      key={tag}
                                      className="max-w-full truncate rounded-[4px] bg-[#338fdc]/12 mr-1.5  text-[10px] text-[#9bd4ff]"
                                    >
                                      {tag}
                                    </span>
                                  ))}
                                </span>
                              ) : null}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <div className="flex h-full items-center justify-center px-4 text-center text-xs leading-5 text-white/46">
                    Clip cards will appear after the playlist metadata is available.
                  </div>
                )}
              </div>
            </aside>
          </div>
        </div>
      </div>
    </ModalCore>
  );
};

export const SgMatrixPlaylistPanel = ({ customPlaylists, onDeletePlaylist }: SgMatrixPlaylistPanelProps) => {
  const [activePlaylist, setActivePlaylist] = useState<TCustomPlaylist | null>(null);
  const [menuPlaylistId, setMenuPlaylistId] = useState<string | null>(null);
  const [playlistPendingDelete, setPlaylistPendingDelete] = useState<TCustomPlaylist | null>(null);
  const [isDeletingPlaylist, setIsDeletingPlaylist] = useState(false);
  const activeMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!menuPlaylistId) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (activeMenuRef.current?.contains(event.target as Node)) return;
      setMenuPlaylistId(null);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuPlaylistId(null);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuPlaylistId]);

  const handleToggleMenu = (event: ReactMouseEvent<HTMLButtonElement>, playlistId: string) => {
    event.stopPropagation();
    setMenuPlaylistId((currentPlaylistId) => (currentPlaylistId === playlistId ? null : playlistId));
  };

  const handleSharePlaylist = async (playlist: TCustomPlaylist) => {
    setMenuPlaylistId(null);

    const playlistUrl = buildCustomPlaylistUrl(playlist.url);
    if (!playlistUrl || typeof navigator === "undefined" || !navigator.clipboard) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Share unavailable",
        message: "Unable to copy this playlist link.",
      });
      return;
    }

    try {
      await navigator.clipboard.writeText(playlistUrl);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Playlist link copied",
        message: "The playlist link is ready to share.",
      });
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Share failed",
        message: "Unable to copy this playlist link.",
      });
    }
  };

  const handleOpenDeleteModal = (playlist: TCustomPlaylist) => {
    setMenuPlaylistId(null);
    setPlaylistPendingDelete(playlist);
  };

  const handleCloseDeleteModal = () => {
    if (isDeletingPlaylist) return;
    setPlaylistPendingDelete(null);
  };

  const handleConfirmDeletePlaylist = async () => {
    if (!playlistPendingDelete) return;

    setIsDeletingPlaylist(true);
    try {
      await onDeletePlaylist(playlistPendingDelete);
      if (activePlaylist?.id === playlistPendingDelete.id) {
        setActivePlaylist(null);
      }
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Playlist deleted",
        message: "The playlist was removed from the workspace.",
      });
      setPlaylistPendingDelete(null);
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Delete failed",
        message: "Unable to delete this playlist. Please try again.",
      });
    } finally {
      setIsDeletingPlaylist(false);
    }
  };

  return (
    <>
      <aside
        className={`${PLAYER_FRAME_CLASS} flex min-h-0 flex-col overflow-hidden rounded-[5px] border border-[var(--sg-matrix-border)] bg-[var(--sg-matrix-panel-secondary)]`}
      >
        <div className="flex h-[34px] items-center justify-between gap-3 border-b border-[var(--sg-matrix-border)] px-2.5">
          <div className="min-w-0">
            <div className="truncate text-[13px] font-normal text-[var(--sg-matrix-text-secondary)]">
              Playlist Workspace
            </div>
          </div>
        </div>

        <div className="vertical-scrollbar scrollbar-md min-h-0 flex-1 overflow-y-auto p-1.5">
          {customPlaylists.length > 0 ? (
            <ul className="space-y-1.5">
              {customPlaylists.map((playlist) => {
                const thumbnailUrl = buildCustomPlaylistThumbnailUrl(playlist.thumbnail);
                const clipCount = getPlaylistCardClipCount(playlist);
                const cardTitle = getPlaylistCardTitle(playlist);
                const cardSubtitle = getPlaylistCardSubtitle(playlist);

                return (
                  <li key={playlist.id}>
                    <div
                      className="group relative rounded-[5px]"
                      ref={menuPlaylistId === playlist.id ? activeMenuRef : null}
                    >
                      <button
                        type="button"
                        onClick={() => setActivePlaylist(playlist)}
                        className="flex w-full min-w-0 items-center gap-2 rounded-[5px] border border-[var(--sg-matrix-grid-border)] bg-[var(--sg-matrix-selected-nav)] px-2 py-1.5 pr-7 text-left transition-colors hover:bg-[var(--sg-matrix-hover)]"
                      >
                        <span className="flex h-10 w-14 shrink-0 items-center justify-center overflow-hidden rounded-[4px] bg-[var(--sg-matrix-cell-empty)] text-[var(--sg-matrix-text-muted)]">
                          {thumbnailUrl ? (
                            <img src={thumbnailUrl} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <Video className="h-3.5 w-3.5" />
                          )}
                        </span>
                        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                          <span className="flex min-w-0 items-center gap-1.5">
                            <span className="truncate text-[11px] font-medium text-[var(--sg-matrix-text-secondary)]">
                              {cardTitle}
                            </span>
                            <span className="shrink-0 rounded-[4px] border border-[#338fdc]/25 bg-[#338fdc]/10 px-1.5 py-0.5 text-[9px] font-medium leading-none text-[#7cc6ff]">
                              {formatPlaylistCardClipCount(clipCount)}
                            </span>
                          </span>
                          <span className="truncate text-[10px] text-[var(--sg-matrix-text-muted)]">
                            {cardSubtitle}
                          </span>
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={(event) => handleToggleMenu(event, playlist.id)}
                        className="absolute right-1.5 top-1.5 inline-flex h-6 w-6 items-center justify-center rounded text-[var(--sg-matrix-text-muted)] opacity-70 transition-colors hover:bg-[var(--sg-matrix-hover)] hover:text-[var(--sg-matrix-text)] group-hover:opacity-100"
                        aria-label={`Open ${cardTitle} playlist actions`}
                        aria-expanded={menuPlaylistId === playlist.id}
                      >
                        <MoreVertical className="h-3.5 w-3.5" />
                      </button>

                      {menuPlaylistId === playlist.id ? (
                        <div className="absolute right-1.5 top-8 z-30 w-[86px] overflow-hidden rounded-[5px] border border-[var(--sg-matrix-grid-border)] bg-[var(--sg-matrix-panel-secondary)] py-1 shadow-[0_12px_34px_rgba(0,0,0,0.45)]">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              void handleSharePlaylist(playlist);
                            }}
                            className="flex h-7 w-full items-center gap-2 px-2 text-left text-[11px] text-[var(--sg-matrix-text-secondary)] transition-colors hover:bg-[var(--sg-matrix-hover)] hover:text-[var(--sg-matrix-text)]"
                          >
                            <Share2 className="h-3.5 w-3.5" />
                            <span>Share</span>
                          </button>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleOpenDeleteModal(playlist);
                            }}
                            className="flex h-7 w-full items-center gap-2 px-2 text-left text-[11px] text-red-400 transition-colors hover:bg-red-500/10 hover:text-red-300"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Delete</span>
                          </button>
                        </div>
                      ) : null}
                    </div>
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
      <AlertModalCore
        isOpen={Boolean(playlistPendingDelete)}
        title="Delete playlist"
        content={
          <>
            Delete{" "}
            <strong className="font-medium text-custom-text-100">
              {playlistPendingDelete?.name?.trim() || "this playlist"}
            </strong>
            ? This action cannot be undone.
          </>
        }
        handleClose={handleCloseDeleteModal}
        handleSubmit={handleConfirmDeletePlaylist}
        isSubmitting={isDeletingPlaylist}
        variant="danger"
      />
      <SgPlaylistVideoModal playlist={activePlaylist} onClose={() => setActivePlaylist(null)} />
    </>
  );
};
