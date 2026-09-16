import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import { ChevronDown, ChevronRight, ClipboardList, Pencil, Plus, Trash2, Video, X } from "lucide-react";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { AlertModalCore, Checkbox } from "@plane/ui";
import type {
  TCustomPlaylist,
  TCustomPlaylistClip,
  TCustomPlaylistUpdatePayload,
} from "@/services/media-library.service";
import { HlsVideo } from "ce/features/media-library/components/hls-video";
import { PLAYER_FRAME_CLASS } from "../../constants";
import type { PlaylistDraft } from "../../playlist-draft";
import type { SgTagRow } from "../../types";
import { buildCustomPlaylistThumbnailUrl, buildCustomPlaylistUrl, parseTimecodeToSeconds } from "../../utils";
import { PlaylistClipThumbnail } from "./playlist-clip-thumbnail";
import { PlaylistDraftEditor } from "./playlist-draft-editor";

type SgMatrixPlaylistPanelProps = {
  availableRows: SgTagRow[];
  draft: PlaylistDraft | null;
  onDraftChange: (draft: PlaylistDraft | null) => void;
  customPlaylists: TCustomPlaylist[];
  isCreatingPlaylist?: boolean;
  onCreateCard?: (playlists: TCustomPlaylist[]) => void;
  onCreatePlaylist: (rows: SgTagRow[], name?: string) => Promise<boolean>;
  onDeletePlaylist: (playlist: TCustomPlaylist) => Promise<void>;
  onUpdatePlaylist: (playlist: TCustomPlaylist, payload: TCustomPlaylistUpdatePayload) => Promise<TCustomPlaylist>;
  onPlayPlaylist?: (playlist: TCustomPlaylist) => void;
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
const GENERATED_PLAYLIST_NAME_SUFFIX = /\s*\(\d+\s+clips?\)\s*$/i;

type PlaylistTextEditField = "name" | "subtitle";

type PlaylistTextEditState = {
  focusField: PlaylistTextEditField;
  name: string;
  playlistId: string;
  subtitle: string;
};

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

const getSavedClipDurationSeconds = (clip: TCustomPlaylistClip) => {
  const explicitDuration = Number(clip.durationSeconds);
  if (Number.isFinite(explicitDuration) && explicitDuration > 0) return explicitDuration;

  const startSeconds = Number(clip.startSeconds);
  const endSeconds = Number(clip.endSeconds);
  if (Number.isFinite(startSeconds) && Number.isFinite(endSeconds) && endSeconds > startSeconds) {
    return endSeconds - startSeconds;
  }

  const [rangeStart = "", rangeEnd = ""] = (clip.timecode ?? "").split(/\s*[-\u2013\u2014]\s*/, 2);
  const parsedStartSeconds = parseTimecodeToSeconds(rangeStart);
  const parsedEndSeconds = parseTimecodeToSeconds(rangeEnd);
  if (parsedStartSeconds !== null && parsedEndSeconds !== null && parsedEndSeconds > parsedStartSeconds) {
    return parsedEndSeconds - parsedStartSeconds;
  }

  return 0;
};

const getPlaylistDurationSeconds = (playlist: TCustomPlaylist) =>
  (Array.isArray(playlist.clips) ? playlist.clips : []).reduce(
    (durationSeconds, clip) => durationSeconds + getSavedClipDurationSeconds(clip),
    0
  );

const formatPlaylistDuration = (seconds: number) => {
  const totalSeconds = Math.max(0, Math.floor(Number.isFinite(seconds) ? seconds : 0));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const remainingSeconds = totalSeconds % 60;

  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`
    : `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
};

const getPlaylistCardTitle = (playlist: TCustomPlaylist) => {
  const savedName = normalizeCardText(playlist.name);
  if (savedName && !GENERATED_PLAYLIST_NAME_SUFFIX.test(savedName)) return savedName;

  const savedClips = Array.isArray(playlist.clips) ? playlist.clips : [];
  const groupValues = Array.from(new Set(savedClips.map((clip) => normalizeCardText(clip.groupValue)).filter(Boolean)));
  if (groupValues.length === 1) return groupValues[0];

  const cleanedName = savedName.replace(GENERATED_PLAYLIST_NAME_SUFFIX, "");
  return normalizeCardText(cleanedName) || normalizeCardText(savedClips[0]?.title) || "Playlist";
};

const getPlaylistCardSubtitle = (playlist: TCustomPlaylist) => {
  const savedSubtitle = normalizeCardText(playlist.subtitle);
  if (savedSubtitle) return savedSubtitle;

  const savedClips = Array.isArray(playlist.clips) ? playlist.clips : [];
  const clipTitles = Array.from(new Set(savedClips.map((clip) => normalizeCardText(clip.title)).filter(Boolean)));
  return clipTitles.join(", ") || normalizeCardText(savedClips[0]?.subtitle) || "No clips yet";
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

  useEffect(() => {
    if (!playlist) return;

    const originalBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalBodyOverflow;
    };
  }, [playlist]);

  useEffect(() => {
    if (!playlist) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, playlist]);

  const handlePlayFullPlaylist = useCallback(() => {
    setActiveClipIndex(null);

    const video = videoRef.current;
    if (!video) return;

    video.currentTime = 0;
    void video.play().catch(() => undefined);
  }, []);

  if (!playlist) return null;

  return (
    <div
      className="fixed inset-0 z-[40] flex items-center justify-center overflow-y-auto bg-black/45 p-3 text-[var(--sg-matrix-text)] backdrop-blur-sm sm:p-5"
      aria-label={playlistTitle}
      aria-modal="true"
      role="dialog"
    >
      <div className="flex max-h-[calc(100dvh-1.5rem)] w-[min(1180px,calc(100vw-1.5rem))] min-h-0 flex-col overflow-hidden rounded-[8px] border border-[var(--sg-matrix-border)] bg-[var(--sg-matrix-panel)] text-[var(--sg-matrix-text)] shadow-[0_24px_80px_rgba(0,0,0,0.36)] sm:max-h-[calc(100dvh-2.5rem)] sm:w-[min(1180px,calc(100vw-2.5rem))]">
        <div className="flex min-h-0 flex-col">
          <div className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-[var(--sg-matrix-border)] bg-[var(--sg-matrix-panel)] px-4 sm:h-16 sm:px-6">
            <div className="flex min-w-0 items-center gap-2.5">
              <h3 className="truncate text-[16px] font-semibold leading-6 text-[var(--sg-matrix-text)] sm:text-[18px]">
                {playlistTitle}
              </h3>
              <span className="shrink-0 rounded-[5px] border border-[var(--sg-matrix-active-border)] bg-[var(--sg-matrix-selected-nav)] px-2 py-1 text-[11px] font-medium leading-none text-[var(--sg-matrix-primary-blue)]">
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
                onClick={onClose}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[6px] bg-[var(--sg-matrix-selected-nav)] text-[var(--sg-matrix-text-secondary)] transition-colors hover:bg-[var(--sg-matrix-hover)] hover:text-[var(--sg-matrix-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sg-matrix-active-border)] sm:h-10 sm:w-10"
                aria-label="Close playlist video"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-5 lg:overflow-hidden">
            <div className="grid min-h-0 gap-4 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-stretch xl:grid-cols-[minmax(0,1fr)_320px]">
              <div className="relative aspect-video min-h-[180px] w-full overflow-hidden rounded-[5px] border border-[var(--sg-matrix-border)] bg-black shadow-[0_18px_54px_rgba(0,0,0,0.24)] sm:min-h-[240px] lg:max-h-[calc(100dvh-8rem)]">
                {playlist && playlistUrl ? (
                  <HlsVideo
                    key={playlistUrl}
                    src={playlistUrl}
                    poster={thumbnailUrl || undefined}
                    autoPlay
                    controls
                    videoRef={videoRef}
                    className="block h-full w-full bg-black object-contain"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center px-4 text-center text-sm text-white/60">
                    Playlist video is unavailable.
                  </div>
                )}
              </div>

              <aside className="flex max-h-[260px] min-h-0 w-full min-w-0 flex-col overflow-hidden rounded-[6px] border border-[var(--sg-matrix-border)] bg-[var(--sg-matrix-panel-secondary)] lg:max-h-none">
                <div className="flex h-11 shrink-0 items-center justify-between gap-3 border-b border-[var(--sg-matrix-border)] px-3">
                  <div className="text-[14px] font-semibold text-[var(--sg-matrix-text)]">
                    Clips ({clipCards.length || clipCount})
                  </div>
                  <button
                    type="button"
                    onClick={handlePlayFullPlaylist}
                    className="inline-flex h-7 shrink-0 items-center gap-1.5 rounded-[5px] border border-[var(--sg-matrix-active-border)] bg-[var(--sg-matrix-selected-nav)] px-2 text-[11px] font-medium text-[var(--sg-matrix-primary-blue)] transition-colors hover:bg-[var(--sg-matrix-hover)]"
                  >
                    <Video className="h-3.5 w-3.5" />
                    <span>Full playlist</span>
                  </button>
                </div>

                <div className="vertical-scrollbar scrollbar-md min-h-0 flex-1 overflow-y-auto overscroll-contain p-2.5">
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
                                  ? "border-[var(--sg-matrix-active-border)] bg-[var(--sg-matrix-selected-nav)]"
                                  : "border-[var(--sg-matrix-grid-border)] bg-[var(--sg-matrix-panel)] hover:bg-[var(--sg-matrix-hover)]",
                                !canSeek ? "cursor-not-allowed opacity-55" : "",
                              ].join(" ")}
                              aria-pressed={isActive}
                            >
                              <span className="absolute right-2 top-2 inline-flex max-w-[92px] items-center rounded-[4px] border border-[var(--sg-matrix-active-border)] bg-[var(--sg-matrix-selected-nav)] px-1.5 py-0.5 text-[10px] leading-none text-[var(--sg-matrix-primary-blue)]">
                                <span className="truncate">
                                  {clipCard.timestampLabel || `Clip ${clipCard.index + 1}`}
                                </span>
                              </span>

                              <span className="relative flex h-[50px] w-[76px] shrink-0 items-center justify-center overflow-hidden rounded-[5px] bg-black text-white/50">
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
                                <span className="block truncate text-[12px] font-medium leading-4 text-[var(--sg-matrix-text)]">
                                  {clipCard.title}
                                </span>
                                {clipCard.subtitle ? (
                                  <span className="mt-0.5 block truncate text-[11px] leading-4 text-[var(--sg-matrix-text-muted)]">
                                    {clipCard.subtitle}
                                  </span>
                                ) : null}
                                {clipCard.tags.length > 0 ? (
                                  <span className="mt-1.5 flex min-w-0 gap-1">
                                    {clipCard.tags.map((tag) => (
                                      <span
                                        key={tag}
                                        className="mr-1.5 max-w-full truncate rounded-[4px] bg-[var(--sg-matrix-selected-nav)] px-1.5 py-0.5 text-[10px] text-[var(--sg-matrix-primary-blue)]"
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
                    <div className="flex h-full items-center justify-center px-4 text-center text-xs leading-5 text-[var(--sg-matrix-text-muted)]">
                      Clip cards will appear after the playlist metadata is available.
                    </div>
                  )}
                </div>
              </aside>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const SgMatrixPlaylistPanel = ({
  availableRows,
  draft,
  onDraftChange,
  isCreatingPlaylist = false,
  onCreatePlaylist,
  customPlaylists,
  onCreateCard,
  onPlayPlaylist,
  onDeletePlaylist,
  onUpdatePlaylist,
  rows,
}: SgMatrixPlaylistPanelProps) => {
  const [activePlaylist, setActivePlaylist] = useState<TCustomPlaylist | null>(null);
  const [expandedPlaylistId, setExpandedPlaylistId] = useState<string | null>(null);
  const [selectedPlaylistIds, setSelectedPlaylistIds] = useState<Set<string>>(() => new Set());
  const [editingPlaylistText, setEditingPlaylistText] = useState<PlaylistTextEditState | null>(null);
  const [savingPlaylistText, setSavingPlaylistText] = useState<Pick<PlaylistTextEditState, "playlistId"> | null>(null);
  const [playlistPendingDelete, setPlaylistPendingDelete] = useState<TCustomPlaylist | null>(null);
  const [isDeletingPlaylist, setIsDeletingPlaylist] = useState(false);
  const titleEditInputRef = useRef<HTMLInputElement | null>(null);
  const subtitleEditInputRef = useRef<HTMLInputElement | null>(null);
  const isSubmittingTextEditRef = useRef(false);
  const playlistOpenTimeoutRef = useRef<number | null>(null);
  const skipNextTextEditBlurRef = useRef(false);
  const editingPlaylistTextFocusField = editingPlaylistText?.focusField ?? null;
  const editingPlaylistTextPlaylistId = editingPlaylistText?.playlistId ?? null;

  const clearPendingPlaylistOpen = useCallback(() => {
    if (!playlistOpenTimeoutRef.current) return;
    window.clearTimeout(playlistOpenTimeoutRef.current);
    playlistOpenTimeoutRef.current = null;
  }, []);

  useEffect(() => {
    if (!activePlaylist) return;

    const updatedActivePlaylist = customPlaylists.find((playlist) => playlist.id === activePlaylist.id);
    if (!updatedActivePlaylist) {
      setActivePlaylist(null);
      return;
    }

    if (updatedActivePlaylist !== activePlaylist) {
      setActivePlaylist(updatedActivePlaylist);
    }
  }, [activePlaylist, customPlaylists]);

  useEffect(() => {
    if (!editingPlaylistTextFocusField || !editingPlaylistTextPlaylistId) return;
    const input =
      editingPlaylistTextFocusField === "subtitle" ? subtitleEditInputRef.current : titleEditInputRef.current;
    if (!input) return;

    input.focus();
    if (editingPlaylistTextFocusField === "name") {
      input.select();
      return;
    }

    const cursorPosition = input.value.length;
    input.setSelectionRange(cursorPosition, cursorPosition);
  }, [editingPlaylistTextFocusField, editingPlaylistTextPlaylistId]);

  useEffect(() => clearPendingPlaylistOpen, [clearPendingPlaylistOpen]);

  const getPlaylistTextUpdatePayload = (
    playlist: TCustomPlaylist,
    currentName: string,
    currentSubtitle: string,
    nextName: string,
    nextSubtitle: string
  ): TCustomPlaylistUpdatePayload | null => {
    const payload: TCustomPlaylistUpdatePayload = {};

    if (nextName && nextName !== currentName) {
      payload.name = nextName;
    }

    const savedSubtitle = normalizeCardText(playlist.subtitle);
    if (!nextSubtitle) {
      if (savedSubtitle) payload.subtitle = null;
    } else if (savedSubtitle) {
      if (nextSubtitle !== savedSubtitle) payload.subtitle = nextSubtitle;
    } else if (nextSubtitle !== currentSubtitle) {
      payload.subtitle = nextSubtitle;
    }

    return Object.keys(payload).length > 0 ? payload : null;
  };

  const handleStartTextEdit = (
    event: ReactMouseEvent<HTMLElement>,
    playlist: TCustomPlaylist,
    focusField: PlaylistTextEditField,
    currentName: string,
    currentSubtitle: string
  ) => {
    event.preventDefault();
    event.stopPropagation();
    clearPendingPlaylistOpen();
    setEditingPlaylistText({
      focusField,
      name: currentName,
      playlistId: playlist.id,
      subtitle: currentSubtitle,
    });
  };

  const handleCancelTextEdit = (skipBlurCommit = false) => {
    if (skipBlurCommit) {
      skipNextTextEditBlurRef.current = true;
    }
    setEditingPlaylistText(null);
  };

  const handleSubmitTextEdit = async (playlist: TCustomPlaylist, currentName: string, currentSubtitle: string) => {
    if (isSubmittingTextEditRef.current || !editingPlaylistText) return;

    const { playlistId } = editingPlaylistText;
    if (playlistId !== playlist.id) return;

    const nextName = editingPlaylistText.name.trim();
    if (!nextName) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Edit custom playlist failed",
        message: "Playlist title is required.",
      });
      return;
    }

    const payload = getPlaylistTextUpdatePayload(
      playlist,
      currentName,
      currentSubtitle,
      nextName,
      editingPlaylistText.subtitle.trim()
    );
    if (!payload) {
      handleCancelTextEdit();
      return;
    }

    isSubmittingTextEditRef.current = true;
    setSavingPlaylistText({ playlistId: playlist.id });
    try {
      const updatedPlaylist = await onUpdatePlaylist(playlist, payload);
      if (activePlaylist?.id === updatedPlaylist.id) {
        setActivePlaylist(updatedPlaylist);
      }
      setEditingPlaylistText(null);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Custom playlist updated",
        message: "The playlist details were updated.",
      });
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Edit custom playlist failed",
        message: "Unable to edit this playlist. Please try again.",
      });
    } finally {
      isSubmittingTextEditRef.current = false;
      setSavingPlaylistText(null);
    }
  };

  const handleTogglePlaylistClips = (event: ReactMouseEvent<HTMLButtonElement>, playlistId: string) => {
    event.stopPropagation();
    clearPendingPlaylistOpen();
    setExpandedPlaylistId((currentPlaylistId) => (currentPlaylistId === playlistId ? null : playlistId));
  };

  const handleTogglePlaylistSelection = (playlistId: string) => {
    setSelectedPlaylistIds((currentIds) => {
      const nextIds = new Set(currentIds);
      if (nextIds.has(playlistId)) nextIds.delete(playlistId);
      else nextIds.add(playlistId);
      return nextIds;
    });
  };

  const handleOpenPlaylist = (playlist: TCustomPlaylist) => {
    clearPendingPlaylistOpen();
    playlistOpenTimeoutRef.current = window.setTimeout(() => {
      setActivePlaylist(playlist);
      playlistOpenTimeoutRef.current = null;
    }, 260);
  };

  const handleOpenDeleteModal = (playlist: TCustomPlaylist) => {
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
      setSelectedPlaylistIds((currentIds) => {
        const nextIds = new Set(currentIds);
        nextIds.delete(playlistPendingDelete.id);
        return nextIds;
      });
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

  const selectedPlaylists = useMemo(
    () => customPlaylists.filter((playlist) => selectedPlaylistIds.has(playlist.id)),
    [customPlaylists, selectedPlaylistIds]
  );
  const isCreateCardDisabled =
    !onCreateCard || !selectedPlaylists.some((playlist) => (playlist.clips ?? []).length > 0);
  const deletePlaylistClipCount = playlistPendingDelete ? getPlaylistCardClipCount(playlistPendingDelete) : 0;
  const deletePlaylistName =
    playlistPendingDelete?.name?.trim().replace(GENERATED_PLAYLIST_NAME_SUFFIX, "") || "Playlist";

  return (
    <>
      <aside
        aria-label="Staging Area"
        className={`${PLAYER_FRAME_CLASS} flex min-h-0 flex-col overflow-hidden rounded-[5px] border border-[var(--sg-matrix-border)] bg-[var(--sg-matrix-panel-secondary)]`}
      >
        <div className="flex h-9 shrink-0 items-center justify-between gap-2 px-2">
          <div className="flex min-w-0 items-baseline gap-2">
            <h3 className="truncate text-sm font-normal text-[var(--sg-matrix-text-secondary)]">Staging Area</h3>
            <span className="shrink-0 text-[10px] font-normal text-[var(--sg-matrix-primary-blue)]">
              {customPlaylists.length} Playlist{customPlaylists.length === 1 ? "" : "s"}
            </span>
          </div>
          <button
            type="button"
            aria-label="Add playlist"
            title={draft ? "Finish the current playlist first" : "Add playlist"}
            disabled={isCreatingPlaylist || Boolean(draft)}
            onClick={() => onDraftChange({ name: "New playlist", rowIds: [] })}
            className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-[4px] border border-[var(--sg-matrix-grid-border)] text-[var(--sg-matrix-text-secondary)] transition-colors hover:bg-[var(--sg-matrix-hover)] hover:text-[var(--sg-matrix-text)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--sg-matrix-active-border)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        <div className="vertical-scrollbar scrollbar-md min-h-0 flex-1 overflow-y-auto px-1.5 pb-1.5">
          {draft && (
            <PlaylistDraftEditor
              availableRows={availableRows}
              draft={draft}
              isSaving={isCreatingPlaylist}
              onChange={onDraftChange}
              onSave={onCreatePlaylist}
              selectedRows={rows ?? []}
            />
          )}
          {customPlaylists.length > 0 ? (
            <ul className="space-y-1.5" aria-label="Staged playlists">
              {customPlaylists.map((playlist) => {
                const clipCount = getPlaylistCardClipCount(playlist);
                const durationLabel = formatPlaylistDuration(getPlaylistDurationSeconds(playlist));
                const cardTitle = getPlaylistCardTitle(playlist);
                const cardSubtitle = getPlaylistCardSubtitle(playlist);
                const activeTextEdit = editingPlaylistText?.playlistId === playlist.id ? editingPlaylistText : null;
                const isEditing = Boolean(activeTextEdit);
                const isSavingText = savingPlaylistText?.playlistId === playlist.id;
                const isExpanded = expandedPlaylistId === playlist.id;
                const isSelected = selectedPlaylistIds.has(playlist.id);
                const savedClips = Array.isArray(playlist.clips) ? playlist.clips : [];
                const clipListId = `custom-playlist-${playlist.id}-clips`;

                return (
                  <li
                    key={playlist.id}
                    className="overflow-hidden rounded-[4px] border border-[var(--sg-matrix-grid-border)] bg-[var(--sg-matrix-selected-nav)]"
                  >
                    <div
                      className={`group flex h-11 min-w-0 items-center px-2 ${isExpanded ? "border-b border-[var(--sg-matrix-grid-border)]" : ""}`}
                    >
                      <Checkbox
                        checked={isSelected}
                        onChange={() => handleTogglePlaylistSelection(playlist.id)}
                        className={`size-3.5 rounded-[1px] bg-transparent hover:bg-transparent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--sg-matrix-active-border)] ${
                          isSelected
                            ? "border-[var(--sg-matrix-primary-blue)] hover:border-[var(--sg-matrix-primary-blue)]"
                            : "border-[var(--sg-matrix-text-muted)] hover:border-[var(--sg-matrix-text-secondary)]"
                        }`}
                        iconClassName="size-3.5 stroke-[var(--sg-matrix-primary-blue)]"
                        aria-label={`Select ${cardTitle}`}
                      />

                      <button
                        type="button"
                        onClick={(event) => handleTogglePlaylistClips(event, playlist.id)}
                        className="ml-1.5 inline-flex h-5 w-4 shrink-0 items-center justify-center text-[var(--sg-matrix-text-muted)] transition-colors hover:text-[var(--sg-matrix-text)] focus-visible:outline-none focus-visible:text-[var(--sg-matrix-text)]"
                        aria-controls={clipListId}
                        aria-expanded={isExpanded}
                        aria-label={`${isExpanded ? "Hide" : "Show"} clips in ${cardTitle}`}
                      >
                        {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                      </button>

                      {isEditing ? (
                        <form
                          className="ml-0.5 flex min-w-0 flex-1 items-center"
                          onSubmit={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            void handleSubmitTextEdit(playlist, cardTitle, cardSubtitle);
                          }}
                          onBlur={(event) => {
                            if (skipNextTextEditBlurRef.current) {
                              skipNextTextEditBlurRef.current = false;
                              return;
                            }
                            if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
                            void handleSubmitTextEdit(playlist, cardTitle, cardSubtitle);
                          }}
                        >
                          <input
                            ref={titleEditInputRef}
                            type="text"
                            value={activeTextEdit?.name ?? ""}
                            disabled={isSavingText}
                            onChange={(event) =>
                              setEditingPlaylistText((currentState) =>
                                currentState ? { ...currentState, name: event.target.value } : currentState
                              )
                            }
                            onKeyDown={(event) => {
                              if (event.key !== "Escape") return;
                              event.preventDefault();
                              event.stopPropagation();
                              handleCancelTextEdit(true);
                            }}
                            className="h-6 w-full min-w-0 border-0 bg-transparent px-1 text-[11px] font-medium leading-none text-[var(--sg-matrix-text)] outline-none placeholder:text-[var(--sg-matrix-text-muted)] focus:ring-0"
                            aria-label="Playlist title"
                          />
                        </form>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            onPlayPlaylist?.(playlist);
                            if (!onPlayPlaylist) handleOpenPlaylist(playlist);
                          }}
                          className="ml-1 flex h-full min-w-0 flex-1 flex-col justify-center gap-1 rounded-sm px-1 text-left focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--sg-matrix-active-border)]"
                          title={`Play ${cardTitle}`}
                        >
                          <span className="flex w-full min-w-0 items-center gap-1.5">
                            <span className="min-w-0 truncate text-[11px] font-normal leading-4 text-[var(--sg-matrix-text)]">
                              {cardTitle}
                            </span>
                            <span className="shrink-0 whitespace-nowrap rounded-[3px] bg-[var(--sg-matrix-panel)] px-1 py-0.5 text-[9px] leading-none text-[var(--sg-matrix-primary-blue)]">
                              {String(clipCount).padStart(2, "0")} Clip{clipCount === 1 ? "" : "s"}
                            </span>
                            <span className="shrink-0 rounded-[3px] bg-[var(--sg-matrix-panel)] px-1 py-0.5 text-[9px] leading-none tabular-nums text-[var(--sg-matrix-primary-blue)]">
                              {durationLabel}
                            </span>
                          </span>
                          <span
                            className="block w-full truncate text-[10px] leading-3 text-[var(--sg-matrix-text-secondary)]"
                            title={cardSubtitle}
                          >
                            {cardSubtitle}
                          </span>
                        </button>
                      )}

                      {!isEditing ? (
                        <button
                          type="button"
                          onClick={(event) => handleStartTextEdit(event, playlist, "name", cardTitle, cardSubtitle)}
                          className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-[3px] text-[var(--sg-matrix-text-muted)] transition-colors hover:bg-[var(--sg-matrix-hover)] hover:text-[var(--sg-matrix-text)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--sg-matrix-active-border)]"
                          aria-label={`Edit ${cardTitle}`}
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                      ) : null}

                      <button
                        type="button"
                        onClick={() => handleOpenDeleteModal(playlist)}
                        className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-[3px] text-red-500 transition-colors hover:bg-red-500/10 hover:text-red-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-400/70"
                        aria-label={`Delete ${cardTitle}`}
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>

                    {isExpanded ? (
                      <div id={clipListId}>
                        {savedClips.length > 0 ? (
                          <ul className="py-1" aria-label={`Clips in ${cardTitle}`}>
                            {savedClips.map((clip, index) => {
                              const clipTitle = normalizeCardText(clip.title) || `Clip ${index + 1}`;
                              const clipDurationLabel = formatPlaylistDuration(getSavedClipDurationSeconds(clip));

                              return (
                                <li
                                  key={clip.id || `${playlist.id}-clip-${index + 1}`}
                                  className="mx-2 mb-1 flex min-h-[58px] min-w-0 items-center gap-2 rounded-[5px] border border-gray-400/15 border-l-2 border-l-[#A3A39F] bg-gray-400/[0.04] px-1.5 py-1.5 last:mb-0"
                                >
                                  <PlaylistClipThumbnail
                                    thumbnail={clip.thumbnail || playlist.thumbnail}
                                    className="h-11 w-[72px]"
                                  />
                                  <span className="min-w-0 flex-1">
                                    <span className="block truncate text-[10px] font-medium uppercase leading-4 text-[var(--sg-matrix-text)]">
                                      {clipTitle}
                                    </span>
                                    <span className="block truncate text-[9px] leading-3 text-[var(--sg-matrix-text-muted)]">
                                      {normalizeCardText(clip.subtitle) || normalizeCardText(clip.groupValue)}
                                    </span>
                                  </span>
                                  <span className="shrink-0 text-[8px] tabular-nums text-[var(--sg-matrix-text-muted)]">
                                    {clipDurationLabel}
                                  </span>
                                </li>
                              );
                            })}
                          </ul>
                        ) : (
                          <div className="px-2.5 pb-2.5 pt-1.5 text-[10px] italic leading-4 text-[var(--sg-matrix-text-muted)]">
                            No clips yet.
                          </div>
                        )}
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="px-2.5 py-2 text-[10px] italic leading-4 text-[var(--sg-matrix-text-muted)]">
              No playlists yet.
            </div>
          )}
        </div>
        {selectedPlaylists.length > 0 && (
          <div className="shrink-0 px-1.5 pb-1.5 pt-2">
            <button
              type="button"
              onClick={() =>
                onCreateCard?.(
                  selectedPlaylists.map((playlist) => ({ ...playlist, name: getPlaylistCardTitle(playlist) }))
                )
              }
              disabled={isCreateCardDisabled}
              className="inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-[4px] border border-[var(--sg-matrix-grid-border)] bg-[var(--sg-matrix-panel)] text-[11px] font-normal text-[var(--sg-matrix-primary-blue)] transition-colors hover:border-[var(--sg-matrix-active-border)] hover:bg-[var(--sg-matrix-hover)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--sg-matrix-active-border)] disabled:cursor-not-allowed disabled:opacity-45"
            >
              <ClipboardList className="h-3.5 w-3.5" />
              Create Card
            </button>
          </div>
        )}
      </aside>
      <AlertModalCore
        isOpen={Boolean(playlistPendingDelete)}
        title="Delete playlist"
        content={
          <>
            Are you sure you want to delete the playlist{" "}
            <strong className="font-medium text-custom-text-100">
              {deletePlaylistName}({deletePlaylistClipCount} clip{deletePlaylistClipCount === 1 ? "" : "s"})
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
