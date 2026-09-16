"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import useSWR from "swr";
import { v4 as uuidv4 } from "uuid";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { TIssue } from "@plane/types";
import {
  buildSgEventAnnotationVideoItem,
  buildSgEventAnnotationViewKey,
  getSgEventMediaReferenceAnnotations,
} from "@/components/annotation";
import type { TCustomPlaylistAnnotation } from "@/components/annotation";
import { useProject } from "@/hooks/store/use-project";
import { useAppRouter } from "@/hooks/use-app-router";
import { IssueService } from "@/services/issue/issue.service";
import type {
  TCustomPlaylist,
  TCustomPlaylistClip,
  TCustomPlaylistUpdatePayload,
} from "@/services/media-library.service";
import { MediaLibraryService, MEDIA_EVENT_CUSTOM_PLAYLISTS_KEY } from "@/services/media-library.service";
import { RosterService } from "@/services/roster.service";
import type { TMediaItem } from "ce/features/media-library/types/media-library.types";
import { getEventMediaDetails } from "ce/features/media-library/utils/media-event";
import { CreateCardModal } from "./create-card-modal";
import { buildCardPlaylists, buildCoachingCardPlaylists } from "./create-card-model";
import type { CardFormValues } from "./create-card-model";
import { buildEventPayloadDevices, fetchSgEventDevices, loadSgMediaPayload } from "./data";
import { SgEventHeader, SgFullStreamButton } from "./header";
import { useSgEventPlaybackState } from "./hooks/use-sg-event-playback-state";
import { useSgEventTagState } from "./hooks/use-sg-event-tag-state";
import { fetchKanavioTagRowsPayload, isNumericEventId, normalizeFetchedTagPayload } from "./kanavio-tag-payload";
import { MatrixView } from "./matrix-view";
import { SgMatrixPlaylistPanel } from "./matrix-view/components/matrix-playlist-panel";
import {
  buildMatrixPlaylistItem as buildCustomPlaylistItem,
  createMatrixPlaylist as createCustomPlaylist,
} from "./matrix-view/utils/create-matrix-playlist";
import { buildTimelinePlayerLabelMap } from "./media-thumbnail-lookup";
import type { PlaylistDraft } from "./playlist-draft";
import { SgEventVideoPlayer } from "./sg-event-video-player";
import { SgEventTagsPanel } from "./tags-view";
import { SgEventTimelinePanel, isTimelineTagPlaybackOverrideId } from "./timeline-view";
import { TIMELINE_PAGE_CONTENT_CLASS, TIMELINE_PAGE_SCROLL_CLASS } from "./timeline-view/utils/timeline-layout";
import { getTimelinePlaylistRows } from "./timeline-view/utils/timeline-playlist-selection";
import type { SgEventDetailPageProps, SgEventTagViewMode, SgIssue, SgTagRow } from "./types";
import {
  asRecord,
  buildBaseEventDateTime,
  buildCustomPlaylistUrl,
  buildEventTitle,
  firstNonEmptyRecord,
  getCpServerBaseUrl,
  getLastPathSegment,
  getSportTableConfig,
  getSgTagRowStreamName,
  normalizeTagRows,
  parseTimecodeToSeconds,
  pickText,
  toText,
} from "./utils";
import { SgEventViewModeToggle } from "./view-mode-toggle";

const normalizeNumericEventId = (value: unknown) => {
  const normalizedValue = toText(value).trim();
  return /^\d+$/.test(normalizedValue) ? normalizedValue : "";
};

const pickNumericSgEventId = (sources: Array<Record<string, unknown> | null | undefined>) => {
  const keyGroups = [
    ["sg_event_id", "sgEventId", "sgEventID"],
    ["event_id", "eventId", "preview_event_id", "previewEventId"],
    ["plane_event_id", "planeEventId"],
  ];

  for (const keys of keyGroups) {
    for (const source of sources) {
      if (!source) continue;

      for (const key of keys) {
        const eventId = normalizeNumericEventId(source[key]);
        if (eventId) return eventId;
      }
    }
  }

  return "";
};

const getEventVideoErrorMessage = (error: unknown, fallbackMessage: string): string => {
  if (!error) return fallbackMessage;
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message || fallbackMessage;
  if (Array.isArray(error)) {
    const message = error
      .map((entry) => getEventVideoErrorMessage(entry, ""))
      .filter(Boolean)
      .join(" ");
    return message || fallbackMessage;
  }
  if (typeof error !== "object") return fallbackMessage;

  const errorRecord = error as Record<string, unknown>;
  for (const key of ["detail", "error", "message", "errorMessage", "error_message"]) {
    const value = errorRecord[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }

  const fieldMessages = Object.entries(errorRecord)
    .map(([field, value]) => {
      const message = getEventVideoErrorMessage(value, "");
      return message ? `${field}: ${message}` : "";
    })
    .filter(Boolean);

  return fieldMessages.join(" ") || fallbackMessage;
};

const CUSTOM_PLAYLIST_MAX_TEXT_LENGTH = 255;
const CUSTOM_PLAYLIST_MAX_BIGINT = "9223372036854775807";

const truncateCustomPlaylistText = (value: string, maxLength = CUSTOM_PLAYLIST_MAX_TEXT_LENGTH) => {
  const normalizedValue = value.trim();
  if (normalizedValue.length <= maxLength) return normalizedValue;

  return normalizedValue.slice(0, maxLength).trimEnd();
};

const normalizeCustomPlaylistFileName = (value: string | null | undefined) => {
  const fileName = getLastPathSegment(value);
  if (!fileName || fileName.length > CUSTOM_PLAYLIST_MAX_TEXT_LENGTH || /[\\/]/.test(fileName)) return "";

  return fileName;
};

const normalizeCustomPlaylistEventId = (value: string) => {
  const normalizedValue = value.trim();
  if (!/^\d+$/.test(normalizedValue)) return null;

  const withoutLeadingZeroes = normalizedValue.replace(/^0+/, "") || "0";
  if (withoutLeadingZeroes === "0") return null;
  if (
    withoutLeadingZeroes.length > CUSTOM_PLAYLIST_MAX_BIGINT.length ||
    (withoutLeadingZeroes.length === CUSTOM_PLAYLIST_MAX_BIGINT.length &&
      withoutLeadingZeroes > CUSTOM_PLAYLIST_MAX_BIGINT)
  ) {
    return null;
  }

  const numericEventId = Number(withoutLeadingZeroes);
  return Number.isSafeInteger(numericEventId) ? numericEventId : normalizedValue;
};

const buildCustomPlaylistName = (eventTitle: string, clipCount: number) => {
  const suffix = ` (${clipCount} clip${clipCount === 1 ? "" : "s"})`;
  const fallbackTitle = "Playlist";
  const titleLength = Math.max(1, CUSTOM_PLAYLIST_MAX_TEXT_LENGTH - suffix.length);
  const title = truncateCustomPlaylistText(eventTitle || fallbackTitle, titleLength) || fallbackTitle;

  return truncateCustomPlaylistText(`${title}${suffix}`);
};

const buildCustomPlaylistClips = (rows: SgTagRow[]): TCustomPlaylistClip[] =>
  rows.map((row, index) => {
    const title = truncateCustomPlaylistText(row.action || row.primaryDetail || `Clip ${index + 1}`);
    const subtitle = truncateCustomPlaylistText([row.player, row.team, row.groupValue].filter(Boolean).join(" / "));
    const tags = [row.result, row.primaryDetail, row.secondaryDetail]
      .map((tag) => truncateCustomPlaylistText(tag))
      .filter(Boolean);
    const clipDurationSeconds =
      row.clipDurationSeconds ??
      (row.clipStartSeconds !== null && row.clipEndSeconds !== null
        ? Math.max(0, row.clipEndSeconds - row.clipStartSeconds)
        : null);

    return {
      durationSeconds: clipDurationSeconds,
      endSeconds: row.clipEndSeconds,
      fallbackTimestamp: row.playlistFallbackTimestamp,
      groupValue: truncateCustomPlaylistText(row.groupValue),
      id: truncateCustomPlaylistText(row.id),
      player: truncateCustomPlaylistText(row.player),
      primaryDetail: truncateCustomPlaylistText(row.primaryDetail),
      result: truncateCustomPlaylistText(row.result),
      sourceTagId: row.sourceTagId,
      startSeconds: row.clipStartSeconds,
      subtitle,
      tags,
      team: truncateCustomPlaylistText(row.team),
      thumbnail: normalizeCustomPlaylistFileName(row.thumbnailUrl) || null,
      timestamp: row.playlistTimestamp ?? row.playlistFallbackTimestamp,
      timecode: row.timecode,
      title,
    };
  });

const getCustomPlaylistClipDurationSeconds = (clip: TCustomPlaylistClip) => {
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

  return null;
};

const getCustomPlaylistClipSourceRange = (clip: TCustomPlaylistClip): [number, number] | null => {
  const startSeconds = Number(clip.startSeconds);
  const endSeconds = Number(clip.endSeconds);
  if (Number.isFinite(startSeconds) && Number.isFinite(endSeconds) && endSeconds > startSeconds) {
    return [startSeconds, endSeconds];
  }

  const [rangeStart = "", rangeEnd = ""] = (clip.timecode ?? "").split(/\s*[-\u2013\u2014]\s*/, 2);
  const parsedStartSeconds = parseTimecodeToSeconds(rangeStart);
  const parsedEndSeconds = parseTimecodeToSeconds(rangeEnd);
  return parsedStartSeconds !== null && parsedEndSeconds !== null && parsedEndSeconds > parsedStartSeconds
    ? [parsedStartSeconds, parsedEndSeconds]
    : null;
};

const getCustomPlaylistSourceRanges = (playlist: TCustomPlaylist) => {
  const clips = Array.isArray(playlist.clips) ? playlist.clips : [];
  if (clips.length === 0) return null;

  const ranges = clips.map(getCustomPlaylistClipSourceRange);
  return ranges.every((range): range is [number, number] => range !== null) ? ranges : null;
};

const getCustomPlaylistDurationSeconds = (playlist: TCustomPlaylist) => {
  const clips = Array.isArray(playlist.clips) ? playlist.clips : [];
  if (clips.length === 0) return null;

  let durationSeconds = 0;
  for (const clip of clips) {
    const clipDurationSeconds = getCustomPlaylistClipDurationSeconds(clip);
    if (clipDurationSeconds === null) return null;
    durationSeconds += clipDurationSeconds;
  }

  return durationSeconds > 0 ? durationSeconds : null;
};

const readArtifactCustomPlaylists = (meta: Record<string, unknown>, eventId: string): TCustomPlaylist[] => {
  const value = meta[MEDIA_EVENT_CUSTOM_PLAYLISTS_KEY];
  if (!Array.isArray(value)) return [];

  const playlists: TCustomPlaylist[] = [];
  for (const entry of value) {
    const playlist = asRecord(entry);
    const id = toText(playlist.id).trim();
    const name = toText(playlist.name).trim();
    const url = toText(playlist.url).trim();
    if (!id || !name || !url) continue;

    const eventValue = playlist.event_id ?? playlist.eventId ?? eventId;
    const clipValue = playlist.clip;
    const clip = typeof clipValue === "number" && Number.isFinite(clipValue) ? clipValue : 0;
    const thumbnail = toText(playlist.thumbnail).trim();

    playlists.push({
      id,
      event_id: eventValue as number | string,
      name,
      annotations: Array.isArray(playlist.annotations) ? (playlist.annotations as TCustomPlaylistAnnotation[]) : [],
      subtitle: playlist.subtitle === null ? null : toText(playlist.subtitle).trim() || null,
      url,
      thumbnail: thumbnail || null,
      clip,
      clips: Array.isArray(playlist.clips) ? (playlist.clips as TCustomPlaylistClip[]) : [],
      ...(typeof playlist.created_at === "string" ? { created_at: playlist.created_at } : {}),
      ...(typeof playlist.updated_at === "string" ? { updated_at: playlist.updated_at } : {}),
    });
  }

  return playlists;
};

export const SgEventDetailPage = ({
  enableMatrixView = false,
  defaultTagViewMode,
  showTagListActions = true,
  issue,
  mediaItem = null,
  projectId,
  workspaceSlug,
  fallbackBackHref,
  onBack,
}: SgEventDetailPageProps) => {
  const sgIssue = issue as SgIssue | undefined;
  const router = useAppRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { getProjectById } = useProject();
  const mediaLibraryService = useMemo(() => new MediaLibraryService(), []);
  const rosterService = useMemo(() => new RosterService(), []);
  const issueService = useMemo(() => new IssueService(), []);
  const [tagViewMode, setTagViewMode] = useState<SgEventTagViewMode>(() => {
    if (defaultTagViewMode === "matrix" && !enableMatrixView) return "timeline";
    return defaultTagViewMode ?? (enableMatrixView ? "matrix" : "timeline");
  });
  const [isCreatingCustomPlaylist, setIsCreatingCustomPlaylist] = useState(false);
  const isCreatingCustomPlaylistRef = useRef(false);
  const [playlistDraft, setPlaylistDraft] = useState<PlaylistDraft | null>(null);
  const [isTimelinePlaylistSelectionMode, setIsTimelinePlaylistSelectionMode] = useState(false);

  useEffect(() => {
    setPlaylistDraft(null);
  }, [workspaceSlug, projectId, mediaItem?.id, issue?.id]);

  const mediaMeta = asRecord(mediaItem?.meta);
  const cpServerBaseUrl = useMemo(() => getCpServerBaseUrl(), []);
  const project = getProjectById(projectId);
  const resolvedWorkItemId = issue?.id || mediaItem?.workItemId || "";
  const {
    data: sgMediaPayload,
    error: sgMediaError,
    isLoading: isMediaLoading,
    mutate: mutateSgMediaPayload,
  } = useSWR(
    workspaceSlug && projectId && (resolvedWorkItemId || mediaItem?.id)
      ? `SG_EVENT_MEDIA_${workspaceSlug}_${projectId}_${resolvedWorkItemId || mediaItem?.id}`
      : null,
    () => loadSgMediaPayload(workspaceSlug, projectId, resolvedWorkItemId, mediaItem, mediaLibraryService),
    { revalidateOnFocus: false }
  );
  const {
    data: rosterPlayers,
    isLoading: isRosterLoading,
    error: rosterError,
    mutate: mutateRoster,
  } = useSWR(
    workspaceSlug && projectId ? `PROJECT_ROSTER_${workspaceSlug}_${projectId}` : null,
    () => rosterService.getRoster(workspaceSlug, projectId),
    { revalidateOnFocus: false }
  );
  const timelinePlayerLabelByNumber = useMemo(() => buildTimelinePlayerLabelMap(rosterPlayers), [rosterPlayers]);

  const eventDetails = useMemo(
    () => getEventMediaDetails(mediaItem) ?? sgMediaPayload?.eventDetails ?? null,
    [mediaItem, sgMediaPayload?.eventDetails]
  );
  const resolvedSport =
    eventDetails?.sport || toText(mediaMeta.sport) || toText((project as { sport?: unknown } | undefined)?.sport);
  const sportTableConfig = useMemo(() => getSportTableConfig(resolvedSport), [resolvedSport]);
  const sgEventMeta = asRecord(sgMediaPayload?.eventItem?.meta);
  const eventPayload = firstNonEmptyRecord(
    sgMediaPayload?.eventPayload,
    sgEventMeta.event,
    sgEventMeta.rawEvent,
    mediaMeta.event,
    mediaMeta.rawEvent,
    sgEventMeta,
    mediaMeta
  );
  const payloadSources = [
    asRecord(eventPayload),
    asRecord(asRecord(eventPayload).event),
    asRecord(asRecord(eventPayload).rawEvent),
  ];
  const sgEventItemRecord = asRecord(sgMediaPayload?.eventItem);
  const resolvedSgEventId =
    normalizeNumericEventId(sgIssue?.sg_event_id) ||
    pickNumericSgEventId([...payloadSources, sgEventMeta, sgEventItemRecord, mediaMeta, asRecord(mediaItem)]);
  const shouldUseKanavioTagApi = Boolean(resolvedSgEventId && isNumericEventId(resolvedSgEventId));
  const resolvedCustomPlaylistEventId = shouldUseKanavioTagApi ? resolvedSgEventId : null;
  const customPlaylists = useMemo(
    () => readArtifactCustomPlaylists(sgEventMeta, resolvedCustomPlaylistEventId ?? ""),
    [resolvedCustomPlaylistEventId, sgEventMeta]
  );
  const {
    data: kanavioTagsPayload,
    error: kanavioTagsError,
    isLoading: isKanavioTagsLoading,
  } = useSWR(
    shouldUseKanavioTagApi ? `KANAVIO_FETCH_TAGS_${cpServerBaseUrl}_${resolvedSgEventId}` : null,
    () => fetchKanavioTagRowsPayload(cpServerBaseUrl, resolvedSgEventId),
    { revalidateOnFocus: false }
  );
  const { data: sgEventDevices, isLoading: isLoadingViews } = useSWR(
    cpServerBaseUrl && resolvedSgEventId ? `SG_EVENT_DEVICES_${cpServerBaseUrl}_${resolvedSgEventId}` : null,
    () => fetchSgEventDevices(cpServerBaseUrl, resolvedSgEventId),
    { revalidateOnFocus: false }
  );
  const dateValue =
    pickText(payloadSources, ["dt_event", "eventDateTime", "date", "event_date", "start_date", "eventDate"]) ||
    eventDetails?.eventDateTime ||
    eventDetails?.eventDate ||
    toText(mediaMeta.start_date) ||
    issue?.start_date ||
    "";
  const timeValue =
    pickText(payloadSources, ["dt_event", "eventDateTime", "time", "event_time", "start_time", "eventTime"]) ||
    eventDetails?.eventTime ||
    toText(mediaMeta.start_time) ||
    issue?.start_time ||
    "";
  const baseEventDateTime = buildBaseEventDateTime(dateValue, timeValue);
  const apiTagSourcePayload = useMemo(() => normalizeFetchedTagPayload(kanavioTagsPayload), [kanavioTagsPayload]);
  const fallbackTagSourcePayload = useMemo(
    () => firstNonEmptyRecord(eventPayload, sgEventMeta, mediaMeta),
    [eventPayload, mediaMeta, sgEventMeta]
  );
  const tagSourcePayload = shouldUseKanavioTagApi ? apiTagSourcePayload : fallbackTagSourcePayload;
  const tagRows = useMemo(
    () =>
      tagSourcePayload
        ? normalizeTagRows(tagSourcePayload, eventDetails, sportTableConfig.sport, baseEventDateTime)
        : [],
    [baseEventDateTime, eventDetails, sportTableConfig.sport, tagSourcePayload]
  );
  const payloadViewDevices = useMemo(() => buildEventPayloadDevices(eventPayload), [eventPayload]);
  const viewDevices = sgEventDevices && sgEventDevices.length > 0 ? sgEventDevices : payloadViewDevices;
  const primaryStreamName =
    pickText(payloadSources, ["primaryStreamName", "primary_stream_name"]) || eventDetails?.primaryStreamName || "";
  const {
    activePlaybackOverrideId,
    activeTimelineTagId,
    activeVideo,
    clearActiveTimelineTag,
    fullStreamPlaybackItem,
    handlePlayTagRow,
    handlePlaybackTimeChange,
    handleResetTimelinePlayback,
    handleSeekTimelineSeconds,
    handleSwitchToFullStream,
    hasPlayableVideo,
    isPlayerPlaying,
    isPlaybackOverrideActive,
    pendingSeekRequestId,
    pendingSeekSeconds,
    playbackAnnotationItem,
    playbackItem,
    playPlaybackOverride,
    playerDurationSeconds,
    playerPlaybackRate,
    selectedViewDevice,
    selectedViewId,
    selectedViewLabel,
    setSelectedViewId,
    timelinePanelPlayheadSeconds,
  } = useSgEventPlaybackState({
    eventItem: sgMediaPayload?.eventItem,
    mediaItem,
    mediaLibraryService,
    primaryStreamName,
    resolvedWorkItemId,
    videoItems: sgMediaPayload?.videoItems,
    viewDevices,
  });
  const {
    allVisibleSelected,
    availableGroups,
    clearSelectedTagIds,
    effectiveGroupValue,
    favoriteTagIds,
    filteredRows,
    handleRemoveTag,
    handleSelectAll,
    handleToggleFavorite,
    handleToggleSearch,
    handleToggleTagSelection,
    handleUpdateTag,
    isSearchOpen,
    matrixRows,
    playlistPanelRows,
    rowFilterMode,
    searchQuery,
    selectedRows,
    selectedTagIds,
    setFocusedMatrixRows,
    setRowFilterMode,
    setSearchQuery,
    setSelectedGroupValue,
    tagTypeRows,
  } = useSgEventTagState({
    cpServerBaseUrl,
    manifestArtifacts: sgMediaPayload?.manifestArtifacts,
    mediaItems: sgMediaPayload?.mediaItems,
    onActiveTagRemoved: clearActiveTimelineTag,
    packageId: sgMediaPayload?.packageId,
    projectId,
    tagRows,
    workspaceSlug,
  });

  useEffect(() => {
    if (tagViewMode !== "timeline" && isTimelinePlaylistSelectionMode) {
      setIsTimelinePlaylistSelectionMode(false);
    }
  }, [isTimelinePlaylistSelectionMode, tagViewMode]);
  const projectName = toText((project as { name?: unknown } | undefined)?.name);
  const eventTitle = buildEventTitle({
    eventDetails,
    issue:
      issue ??
      ({
        id: mediaItem?.id ?? "",
        name: mediaItem?.title ?? "",
        opposition_team: mediaMeta.opposition ?? null,
      } as TIssue),
    payload: eventPayload,
    projectName,
  });
  const eventStatus =
    pickText(payloadSources, ["status", "event_status"]) ||
    eventDetails?.status ||
    toText(mediaMeta.status) ||
    (issue?.completed_at ? "Completed" : "Scheduled");

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }

    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }

    router.push(fallbackBackHref || `/${workspaceSlug}/projects/${projectId}/issues`);
  };

  const [createCardContext, setCreateCardContext] = useState<{
    playlists: TCustomPlaylist[];
    rows: SgTagRow[];
    requestId: string;
  } | null>(null);

  const handleCreatePlaylistCard = useCallback(
    (playlists: TCustomPlaylist[]) => {
      if (playlists.length > 0) setCreateCardContext({ playlists, rows: tagTypeRows, requestId: uuidv4() });
    },
    [tagTypeRows]
  );

  const handleCreateMatrixCard = useCallback(
    (rows: SgTagRow[]) => {
      if (rows.length === 0) return;
      setCreateCardContext({
        rows,
        requestId: uuidv4(),
        playlists: [
          {
            id: "selected-clips",
            event_id: resolvedCustomPlaylistEventId ?? "",
            name: "Selected clips",
            url: "",
            thumbnail: null,
            clip: rows.length,
            clips: buildCustomPlaylistClips(rows),
          },
        ],
      });
    },
    [resolvedCustomPlaylistEventId]
  );

  const handleCreateCards = useCallback(
    async (values: CardFormValues) => {
      if (!createCardContext || !resolvedWorkItemId) {
        throw new Error("The source event is unavailable.");
      }

      const groups = buildCardPlaylists(createCardContext.playlists, createCardContext.rows);
      const playlists = buildCoachingCardPlaylists(groups, values.playlists);
      if (playlists.length === 0) throw new Error("At least one staged tag is required.");

      const response = await issueService.createCoachingCards(workspaceSlug, projectId, {
        request_id: createCardContext.requestId,
        source_issue_id: resolvedWorkItemId,
        player_ids: values.playerIds,
        feedback: values.feedback,
        progress_status: values.progressStatus,
        sport_label: resolvedSport,
        playlists,
      });

      const cardCount = response.cards.length;
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: cardCount === 1 ? "Coaching card created" : "Coaching cards created",
        message: `${cardCount} card${cardCount === 1 ? "" : "s"} added to the New column on the coaching board.`,
      });
    },
    [createCardContext, issueService, projectId, resolvedSport, resolvedWorkItemId, workspaceSlug]
  );

  const handleCreateCustomPlaylist = useCallback(
    async (rows: SgTagRow[], name?: string) => {
      if (isCreatingCustomPlaylistRef.current) return false;
      if (rows.length === 0) {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "No clips selected",
          message: "Select at least one tag before creating a playlist.",
        });
        return false;
      }
      if (!resolvedCustomPlaylistEventId) {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Missing event",
          message: "A service gateway event id is required before creating a playlist.",
        });
        return false;
      }
      const streamName = (selectedViewDevice?.streamName || primaryStreamName).trim();
      isCreatingCustomPlaylistRef.current = true;
      setIsCreatingCustomPlaylist(true);

      try {
        const customPlaylistEventId = normalizeCustomPlaylistEventId(resolvedCustomPlaylistEventId);
        if (customPlaylistEventId === null) {
          throw new Error("A valid service gateway event id is required before creating a playlist.");
        }

        const result = await createCustomPlaylist({ mediaLibraryService, rows, streamName });
        const includedRowIds = new Set(result.rowIds);
        const includedRows = rows.filter((row) => includedRowIds.has(row.id));
        const thumbnail =
          includedRows.find((row) => row.thumbnailUrl)?.thumbnailUrl ||
          activeVideo?.thumbnail ||
          mediaItem?.thumbnail ||
          null;
        const playlistFileName = normalizeCustomPlaylistFileName(result.fileName || result.url);
        if (!playlistFileName) {
          throw new Error("The generated playlist did not include a valid file name.");
        }

        const thumbnailFileName = normalizeCustomPlaylistFileName(thumbnail);
        const customPlaylist: TCustomPlaylist = {
          id: uuidv4(),
          event_id: customPlaylistEventId,
          name:
            truncateCustomPlaylistText(name?.trim() || "") || buildCustomPlaylistName(eventTitle, includedRows.length),
          annotations: [],
          url: playlistFileName,
          thumbnail: thumbnailFileName || null,
          clip: includedRows.length,
          clips: buildCustomPlaylistClips(includedRows),
        };
        const eventArtifact = sgMediaPayload?.eventItem;
        if (!eventArtifact?.packageId || !eventArtifact.id) {
          throw new Error("The event artifact is unavailable for saving the playlist.");
        }
        const nextPlaylists = [customPlaylist, ...customPlaylists];
        await mediaLibraryService.updateArtifactMetadata(
          workspaceSlug,
          projectId,
          eventArtifact.packageId,
          eventArtifact.id,
          { ...eventArtifact.meta, [MEDIA_EVENT_CUSTOM_PLAYLISTS_KEY]: nextPlaylists }
        );

        playPlaybackOverride(
          buildCustomPlaylistItem({
            result,
            rows: includedRows,
            workItemId: resolvedWorkItemId || null,
          })
        );
        void mutateSgMediaPayload(
          (currentPayload) =>
            currentPayload
              ? {
                  ...currentPayload,
                  eventItem: currentPayload.eventItem
                    ? {
                        ...currentPayload.eventItem,
                        meta: {
                          ...currentPayload.eventItem.meta,
                          [MEDIA_EVENT_CUSTOM_PLAYLISTS_KEY]: nextPlaylists,
                        },
                      }
                    : currentPayload.eventItem,
                }
              : currentPayload,
          { revalidate: false }
        );
        clearSelectedTagIds();
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Playlist created",
          message: `${includedRows.length} selected tag${includedRows.length === 1 ? "" : "s"} are ready to play.`,
        });
        return true;
      } catch (error) {
        const message = getEventVideoErrorMessage(error, "Unable to create a playlist from the selected tags.");
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Playlist creation failed",
          message,
        });
        return false;
      } finally {
        isCreatingCustomPlaylistRef.current = false;
        setIsCreatingCustomPlaylist(false);
      }
    },
    [
      activeVideo?.thumbnail,
      clearSelectedTagIds,
      eventTitle,
      mediaLibraryService,
      mediaItem?.thumbnail,
      mutateSgMediaPayload,
      playPlaybackOverride,
      primaryStreamName,
      projectId,
      customPlaylists,
      resolvedCustomPlaylistEventId,
      resolvedWorkItemId,
      sgMediaPayload?.eventItem,
      selectedViewDevice?.streamName,
      workspaceSlug,
    ]
  );
  const timelinePlaylistRows = useMemo(
    () => getTimelinePlaylistRows(filteredRows, selectedTagIds),
    [filteredRows, selectedTagIds]
  );

  const handleCreateTimelinePlaylist = useCallback(async () => {
    const wasCreated = await handleCreateCustomPlaylist(timelinePlaylistRows);
    if (!wasCreated) return;

    setIsTimelinePlaylistSelectionMode(false);
  }, [handleCreateCustomPlaylist, timelinePlaylistRows]);

  const handleCreateMatrixPlaylist = useCallback(
    async (rows: SgTagRow[]) => {
      await handleCreateCustomPlaylist(rows);
    },
    [handleCreateCustomPlaylist]
  );

  const handleDeleteCustomPlaylist = useCallback(
    async (playlist: TCustomPlaylist) => {
      const eventArtifact = sgMediaPayload?.eventItem;
      if (!eventArtifact?.packageId || !eventArtifact.id) {
        throw new Error("The event artifact is unavailable for deleting the playlist.");
      }
      const nextPlaylists = customPlaylists.filter((currentPlaylist) => currentPlaylist.id !== playlist.id);
      await mediaLibraryService.updateEventVideoAnnotations(
        workspaceSlug,
        projectId,
        eventArtifact.packageId,
        eventArtifact.id,
        {
          annotations: [],
          delete_custom_playlist: true,
          playlist_id: playlist.id,
          view_key: `custom-playlist:${playlist.id}`,
        }
      );
      void mutateSgMediaPayload(
        (currentPayload) =>
          currentPayload
            ? {
                ...currentPayload,
                eventItem: currentPayload.eventItem
                  ? {
                      ...currentPayload.eventItem,
                      meta: {
                        ...currentPayload.eventItem.meta,
                        [MEDIA_EVENT_CUSTOM_PLAYLISTS_KEY]: nextPlaylists,
                      },
                    }
                  : currentPayload.eventItem,
              }
            : currentPayload,
        { revalidate: false }
      );
    },
    [customPlaylists, mediaLibraryService, mutateSgMediaPayload, projectId, sgMediaPayload?.eventItem, workspaceSlug]
  );

  const handleUpdateCustomPlaylist = useCallback(
    async (playlist: TCustomPlaylist, payload: TCustomPlaylistUpdatePayload) => {
      const eventArtifact = sgMediaPayload?.eventItem;
      if (!eventArtifact?.packageId || !eventArtifact.id) {
        throw new Error("The event artifact is unavailable for updating the playlist.");
      }
      const updatedPlaylist = { ...playlist, ...payload };
      const nextPlaylists = customPlaylists.map((currentPlaylist) =>
        currentPlaylist.id === updatedPlaylist.id ? updatedPlaylist : currentPlaylist
      );
      await mediaLibraryService.updateArtifactMetadata(
        workspaceSlug,
        projectId,
        eventArtifact.packageId,
        eventArtifact.id,
        { ...eventArtifact.meta, [MEDIA_EVENT_CUSTOM_PLAYLISTS_KEY]: nextPlaylists }
      );
      void mutateSgMediaPayload(
        (currentPayload) =>
          currentPayload
            ? {
                ...currentPayload,
                eventItem: currentPayload.eventItem
                  ? {
                      ...currentPayload.eventItem,
                      meta: {
                        ...currentPayload.eventItem.meta,
                        [MEDIA_EVENT_CUSTOM_PLAYLISTS_KEY]: nextPlaylists,
                      },
                    }
                  : currentPayload.eventItem,
              }
            : currentPayload,
        { revalidate: false }
      );
      return updatedPlaylist;
    },
    [customPlaylists, mediaLibraryService, mutateSgMediaPayload, projectId, sgMediaPayload?.eventItem, workspaceSlug]
  );
  const handleUpdateVideoAnnotations = useCallback(
    async (videoItem: TMediaItem, annotations: TCustomPlaylistAnnotation[]) => {
      if (!videoItem?.packageId || !videoItem.id) {
        throw new Error("Video annotations can only be saved on media library artifacts.");
      }

      const videoMeta = videoItem.meta ?? {};
      const eventArtifact = sgMediaPayload?.eventItem?.packageId ? sgMediaPayload.eventItem : videoItem;
      const eventPackageId = eventArtifact.packageId ?? videoItem.packageId;
      if (!eventPackageId) {
        throw new Error("Video annotations can only be saved on media library artifacts.");
      }
      const metaViewDeviceId = toText(videoMeta.annotationViewDeviceId);
      const metaViewStreamId = toText(videoMeta.annotationViewStreamId);
      const metaViewStreamName = toText(videoMeta.annotationViewStreamName);
      const metaViewKey = toText(videoMeta.annotationViewKey);
      const metaVideoSource = toText(videoMeta.annotationVideoSource);
      const annotationViewKey = buildSgEventAnnotationViewKey({
        deviceId: selectedViewDevice?.id ?? metaViewDeviceId,
        streamId: selectedViewDevice?.streamId ?? metaViewStreamId,
        streamName: selectedViewDevice?.streamName ?? metaViewStreamName,
        viewKey: metaViewKey,
        videoSrc: videoMeta.customPlaylistId ? metaVideoSource : (selectedViewDevice?.hlsUrl ?? metaVideoSource),
      });
      const updatedEvent = await mediaLibraryService.updateEventVideoAnnotations(
        workspaceSlug,
        projectId,
        eventPackageId,
        eventArtifact.id,
        {
          annotations,
          device_id: selectedViewDevice?.id ?? metaViewDeviceId,
          stream_id: selectedViewDevice?.streamId ?? metaViewStreamId,
          stream_name: selectedViewDevice?.streamName ?? metaViewStreamName,
          view_key: annotationViewKey,
        }
      );
      const updatedAnnotations = getSgEventMediaReferenceAnnotations(videoMeta, {
        deviceId: selectedViewDevice?.id ?? metaViewDeviceId,
        eventPayload: updatedEvent.eventPayload,
        streamId: selectedViewDevice?.streamId ?? metaViewStreamId,
        streamName: selectedViewDevice?.streamName ?? metaViewStreamName,
        viewKey: annotationViewKey,
        videoSrc: selectedViewDevice?.hlsUrl ?? metaVideoSource,
      });
      const nextMeta = {
        ...videoMeta,
        annotations: updatedAnnotations,
      };
      void mutateSgMediaPayload(
        (currentPayload) => {
          if (!currentPayload) return currentPayload;

          const updateItem = (currentItem: TMediaItem): TMediaItem =>
            currentItem.id === videoItem.id && currentItem.packageId === videoItem.packageId
              ? { ...currentItem, meta: nextMeta }
              : currentItem;

          return {
            ...currentPayload,
            eventItem: currentPayload.eventItem ? updateItem(currentPayload.eventItem) : currentPayload.eventItem,
            mediaItems: currentPayload.mediaItems.map(updateItem),
            videoItems: currentPayload.videoItems.map(updateItem),
            eventPayload: updatedEvent.eventPayload ?? currentPayload.eventPayload,
          };
        },
        { revalidate: false }
      );

      return {
        ...videoItem,
        meta: nextMeta,
      };
    },
    [mediaLibraryService, mutateSgMediaPayload, projectId, selectedViewDevice, sgMediaPayload?.eventItem, workspaceSlug]
  );
  const kanavioTagsErrorMessage =
    kanavioTagsError instanceof Error
      ? kanavioTagsError.message
      : kanavioTagsError
        ? "Unable to fetch event tags."
        : null;
  const matrixError =
    matrixRows.length === 0 && shouldUseKanavioTagApi && kanavioTagsErrorMessage
      ? kanavioTagsErrorMessage
      : matrixRows.length === 0 && sgMediaPayload?.eventPayloadStatus === "error"
        ? (sgMediaPayload.eventPayloadErrorMessage ?? "Unable to load the completed event data for Matrix View.")
        : matrixRows.length === 0 && sgMediaError instanceof Error
          ? sgMediaError
          : matrixRows.length === 0 && sgMediaError
            ? "Unable to load the event media required for Matrix View."
            : null;
  const activeMatrixRowId = isTimelineTagPlaybackOverrideId(activePlaybackOverrideId)
    ? (activePlaybackOverrideId?.slice("sg-tag-".length) ?? null)
    : null;
  const matrixStreamName = (selectedViewDevice?.streamName ?? primaryStreamName).trim();
  const hasMatrixRowStreamName = matrixRows.some((row) => Boolean(getSgTagRowStreamName(row)));
  const isMatrixWorkspaceMode = enableMatrixView && tagViewMode === "matrix";
  const activePlaylistRows = isMatrixWorkspaceMode
    ? playlistPanelRows
    : tagViewMode === "timeline"
      ? timelinePlaylistRows
      : selectedRows;
  const isTagRowsLoading = isMediaLoading || (shouldUseKanavioTagApi && isKanavioTagsLoading);
  const playbackAnnotationVideoSrc = isPlaybackOverrideActive ? playbackItem?.videoSrc : selectedViewDevice?.hlsUrl;
  const playbackAnnotationViewLabel = isPlaybackOverrideActive ? playbackItem?.title : selectedViewDevice?.name;
  const playbackAnnotationPageItem = useMemo(
    () =>
      buildSgEventAnnotationVideoItem(playbackAnnotationItem, {
        deviceId: selectedViewDevice?.id,
        eventPayload,
        streamId: selectedViewDevice?.streamId,
        streamName: selectedViewDevice?.streamName,
        title: playbackAnnotationViewLabel,
        videoSrc: playbackAnnotationVideoSrc,
      }),
    [
      eventPayload,
      playbackAnnotationItem,
      playbackAnnotationVideoSrc,
      playbackAnnotationViewLabel,
      selectedViewDevice?.id,
      selectedViewDevice?.streamId,
      selectedViewDevice?.streamName,
    ]
  );
  const canSavePlaybackAnnotations = Boolean(playbackAnnotationPageItem?.packageId);
  const currentHref = useMemo(() => {
    const queryString = searchParams.toString();
    return queryString ? `${pathname}?${queryString}` : pathname;
  }, [pathname, searchParams]);
  const handlePlayCustomPlaylist = useCallback(
    (playlist: TCustomPlaylist) => {
      const sourceItem = sgMediaPayload?.eventItem?.packageId
        ? sgMediaPayload.eventItem
        : (playbackAnnotationItem ?? activeVideo ?? mediaItem);
      const playlistUrl = buildCustomPlaylistUrl(playlist.url);

      if (!playlistUrl) {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Playlist unavailable",
          message: "This custom playlist does not have a playable video source.",
        });
        return;
      }
      if (!sourceItem?.packageId || !sourceItem.id) {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Annotation unavailable",
          message: "This event does not have a media artifact where annotations can be saved.",
        });
        return;
      }

      const params = new URLSearchParams();
      params.set("annotation", "open");
      params.set("annotationSession", String(Date.now()));
      params.set("from", currentHref);
      params.set("customPlaylistId", playlist.id);
      params.set("videoSrc", playlistUrl);
      params.set("view", playlist.name?.trim() || "Custom playlist");

      const playlistDurationSeconds = getCustomPlaylistDurationSeconds(playlist);
      if (playlistDurationSeconds !== null) {
        params.set("playlistDuration", String(playlistDurationSeconds));
      }
      const playlistSourceRanges = getCustomPlaylistSourceRanges(playlist);
      if (playlistSourceRanges) {
        params.set(
          "playlistRanges",
          playlistSourceRanges.map(([startSeconds, endSeconds]) => `${startSeconds}:${endSeconds}`).join(",")
        );
      }

      params.set("viewKey", `custom-playlist:${playlist.id}`);
      if (selectedViewDevice?.id) params.set("deviceId", String(selectedViewDevice.id));
      if (selectedViewDevice?.streamId) params.set("streamId", selectedViewDevice.streamId);
      if (selectedViewDevice?.streamName) params.set("stream", selectedViewDevice.streamName);

      router.push(
        `/${workspaceSlug}/projects/${projectId}/media-library/${encodeURIComponent(sourceItem.id)}?${params.toString()}`
      );
    },
    [
      activeVideo,
      currentHref,
      mediaItem,
      playbackAnnotationItem,
      projectId,
      router,
      selectedViewDevice,
      sgMediaPayload?.eventItem,
      workspaceSlug,
    ]
  );
  const playbackAnnotationHref = useMemo(() => {
    if (!playbackAnnotationPageItem?.packageId || !playbackAnnotationPageItem.id) {
      return null;
    }

    const params = new URLSearchParams();
    params.set("annotation", "open");
    params.set("from", currentHref);
    const viewKey = buildSgEventAnnotationViewKey({
      deviceId: selectedViewDevice?.id,
      streamId: selectedViewDevice?.streamId,
      streamName: selectedViewDevice?.streamName,
      videoSrc: playbackAnnotationVideoSrc,
    });
    if (viewKey) {
      params.set("viewKey", viewKey);
    }
    if (selectedViewDevice?.id) {
      params.set("deviceId", String(selectedViewDevice.id));
    }
    if (selectedViewDevice?.streamId) {
      params.set("streamId", selectedViewDevice.streamId);
    }
    if (selectedViewDevice?.streamName) {
      params.set("stream", selectedViewDevice.streamName);
    }
    if (playbackAnnotationVideoSrc) {
      params.set("videoSrc", playbackAnnotationVideoSrc);
    }
    if (playbackAnnotationViewLabel) {
      params.set("view", playbackAnnotationViewLabel);
    }

    return `/${workspaceSlug}/projects/${projectId}/media-library/${encodeURIComponent(playbackAnnotationPageItem.id)}?${params.toString()}`;
  }, [
    currentHref,
    playbackAnnotationPageItem?.id,
    playbackAnnotationPageItem?.packageId,
    playbackAnnotationVideoSrc,
    playbackAnnotationViewLabel,
    projectId,
    selectedViewDevice?.id,
    selectedViewDevice?.streamId,
    selectedViewDevice?.streamName,
    workspaceSlug,
  ]);
  const handleOpenPlaybackAnnotationPage = useCallback(() => {
    if (!playbackAnnotationHref) return;

    router.push(playbackAnnotationHref);
  }, [playbackAnnotationHref, router]);
  const matrixPreferenceKey = `plane:media-library:matrix-columns:${workspaceSlug}:${projectId}:${
    resolvedSgEventId || mediaItem?.id || resolvedWorkItemId || "event"
  }:${sportTableConfig.sport}`;
  const viewToggle = (
    <SgEventViewModeToggle isMatrixViewEnabled={enableMatrixView} onChange={setTagViewMode} value={tagViewMode} />
  );

  return (
    <div className="sg-matrix-workspace h-full bg-[var(--sg-matrix-page)] text-[var(--sg-matrix-text)]">
      <div className={TIMELINE_PAGE_SCROLL_CLASS}>
        <div className={TIMELINE_PAGE_CONTENT_CLASS}>
          <SgEventHeader
            eventStatus={eventStatus}
            eventTitle={eventTitle}
            handleBack={handleBack}
            isLoadingViews={isLoadingViews}
            selectedViewId={selectedViewId}
            selectedViewLabel={selectedViewLabel}
            setSelectedViewId={setSelectedViewId}
            viewDevices={viewDevices}
          />

          {isMatrixWorkspaceMode ? (
            <>
              <div className="grid min-w-0 gap-[10px] xl:grid-cols-[minmax(0,76fr)_minmax(260px,24fr)]">
                <div className="min-w-0 rounded-[5px] bg-[var(--sg-matrix-video-bg)]">
                  <SgEventVideoPlayer
                    item={playbackItem}
                    annotationItem={playbackAnnotationPageItem ?? playbackAnnotationItem}
                    compactEmpty={!hasPlayableVideo}
                    onOpenAnnotationPage={playbackAnnotationHref ? handleOpenPlaybackAnnotationPage : undefined}
                    showAnnotationButton={false}
                    showAnnotations={false}
                    onPlaybackTimeChange={handlePlaybackTimeChange}
                    onUpdateAnnotations={canSavePlaybackAnnotations ? handleUpdateVideoAnnotations : undefined}
                    seekRequestId={pendingSeekRequestId}
                    seekToSeconds={pendingSeekSeconds}
                  />
                </div>
                <SgMatrixPlaylistPanel
                  availableRows={tagTypeRows}
                  draft={playlistDraft}
                  onDraftChange={setPlaylistDraft}
                  customPlaylists={customPlaylists}
                  isCreatingPlaylist={isCreatingCustomPlaylist}
                  onCreateCard={handleCreatePlaylistCard}
                  onCreatePlaylist={handleCreateCustomPlaylist}
                  onDeletePlaylist={handleDeleteCustomPlaylist}
                  onPlayPlaylist={handlePlayCustomPlaylist}
                  onUpdatePlaylist={handleUpdateCustomPlaylist}
                  rows={activePlaylistRows}
                />
              </div>

              {isPlaybackOverrideActive && (fullStreamPlaybackItem || activeVideo) && (
                <div className="flex min-h-8 items-center px-0.5">
                  <SgFullStreamButton onClick={handleSwitchToFullStream} />
                </div>
              )}

              <div className="flex flex-col gap-2">
                <MatrixView
                  activeRowId={activeMatrixRowId}
                  className="min-h-0"
                  canCreatePlaylist={Boolean(matrixStreamName) || hasMatrixRowStreamName}
                  clipThumbnailUrl={activeVideo?.thumbnail || mediaItem?.thumbnail || playbackItem?.thumbnail || ""}
                  error={matrixError}
                  hasEvent={Boolean(mediaItem || issue || eventDetails || eventPayload)}
                  isCreatingPlaylist={isCreatingCustomPlaylist}
                  isLoading={isTagRowsLoading}
                  layout="workspace"
                  onCreateCard={handleCreateMatrixCard}
                  onCreatePlaylist={handleCreateMatrixPlaylist}
                  onFocusedRowsChange={setFocusedMatrixRows}
                  onPlayTagRow={handlePlayTagRow}
                  preferenceKey={matrixPreferenceKey}
                  sport={resolvedSport || ""}
                  tagRows={matrixRows}
                  viewToggle={viewToggle}
                />
              </div>
            </>
          ) : (
            <div className="min-w-0">
              <div className="flex min-h-0 flex-col gap-3">
                <div className="flex min-w-0 flex-col gap-3">
                  <div className="grid min-w-0 gap-[10px] xl:grid-cols-[minmax(0,76fr)_minmax(260px,24fr)]">
                    <div className="min-w-0 rounded-[5px] bg-[var(--sg-matrix-video-bg)]">
                      <SgEventVideoPlayer
                        item={playbackItem}
                        annotationItem={playbackAnnotationPageItem ?? playbackAnnotationItem}
                        compactEmpty={!hasPlayableVideo}
                        onOpenAnnotationPage={playbackAnnotationHref ? handleOpenPlaybackAnnotationPage : undefined}
                        showAnnotationButton={false}
                        showAnnotations={false}
                        onPlaybackTimeChange={handlePlaybackTimeChange}
                        onUpdateAnnotations={canSavePlaybackAnnotations ? handleUpdateVideoAnnotations : undefined}
                        seekRequestId={pendingSeekRequestId}
                        seekToSeconds={pendingSeekSeconds}
                      />
                    </div>
                    <SgMatrixPlaylistPanel
                      availableRows={tagTypeRows}
                      draft={playlistDraft}
                      onDraftChange={setPlaylistDraft}
                      customPlaylists={customPlaylists}
                      isCreatingPlaylist={isCreatingCustomPlaylist}
                      onCreateCard={handleCreatePlaylistCard}
                      onCreatePlaylist={handleCreateCustomPlaylist}
                      onDeletePlaylist={handleDeleteCustomPlaylist}
                      onPlayPlaylist={handlePlayCustomPlaylist}
                      onUpdatePlaylist={handleUpdateCustomPlaylist}
                      rows={activePlaylistRows}
                    />
                  </div>

                  {isPlaybackOverrideActive && (fullStreamPlaybackItem || activeVideo) && (
                    <div className="flex min-h-8 items-center px-0.5">
                      <SgFullStreamButton onClick={handleSwitchToFullStream} />
                    </div>
                  )}
                </div>

                {tagViewMode === "timeline" ? (
                  <SgEventTimelinePanel
                    activePlaybackOverrideId={activePlaybackOverrideId}
                    activeTagRowId={activeTimelineTagId}
                    clipThumbnailUrl={activeVideo?.thumbnail || mediaItem?.thumbnail || playbackItem?.thumbnail || ""}
                    isCreatingPlaylist={isCreatingCustomPlaylist}
                    isPlaylistSelectionMode={isTimelinePlaylistSelectionMode}
                    isMediaLoading={isTagRowsLoading}
                    onClearTagSelection={clearSelectedTagIds}
                    onCreatePlaylist={() => void handleCreateTimelinePlaylist()}
                    isPlayerPlaying={isPlayerPlaying}
                    onPlayTagRow={handlePlayTagRow}
                    onPlaylistSelectionModeChange={setIsTimelinePlaylistSelectionMode}
                    onResetPlayback={handleResetTimelinePlayback}
                    onSeekTimelineSeconds={handleSeekTimelineSeconds}
                    onToggleTagSelection={handleToggleTagSelection}
                    playerDurationSeconds={playerDurationSeconds}
                    playerPlaybackRate={playerPlaybackRate}
                    playheadSeconds={timelinePanelPlayheadSeconds}
                    rows={filteredRows}
                    selectedTagIds={selectedTagIds}
                    sport={sportTableConfig.sport}
                    tagTypeRows={tagTypeRows}
                    playerLabelByNumber={timelinePlayerLabelByNumber}
                    viewToggle={viewToggle}
                  />
                ) : (
                  <SgEventTagsPanel
                    activeFilterLabel={
                      rowFilterMode === "all"
                        ? "All rows"
                        : rowFilterMode === "favorites"
                          ? "Favorites only"
                          : "Selected rows"
                    }
                    activePlaybackOverrideId={activePlaybackOverrideId}
                    allVisibleSelected={allVisibleSelected}
                    availableGroups={availableGroups}
                    clipThumbnailUrl={activeVideo?.thumbnail || mediaItem?.thumbnail || playbackItem?.thumbnail || ""}
                    effectiveGroupValue={effectiveGroupValue}
                    favoriteTagIds={favoriteTagIds}
                    isCreatingPlaylist={isCreatingCustomPlaylist}
                    isMediaLoading={isTagRowsLoading}
                    isSearchOpen={isSearchOpen}
                    onCreatePlaylist={() => void handleCreateCustomPlaylist(activePlaylistRows)}
                    onPlayTagRow={handlePlayTagRow}
                    onRemoveTag={handleRemoveTag}
                    onRowFilterModeChange={setRowFilterMode}
                    onSearchQueryChange={setSearchQuery}
                    onSelectAll={handleSelectAll}
                    onSelectedGroupValueChange={setSelectedGroupValue}
                    onToggleFavorite={handleToggleFavorite}
                    onToggleSearch={handleToggleSearch}
                    onToggleTagSelection={handleToggleTagSelection}
                    onUpdateTag={handleUpdateTag}
                    rowFilterMode={rowFilterMode}
                    rows={filteredRows}
                    searchQuery={searchQuery}
                    selectedTagIds={selectedTagIds}
                    showCreateActions={showTagListActions}
                    sportTableConfig={sportTableConfig}
                    viewToggle={viewToggle}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      {createCardContext && (
        <CreateCardModal
          playlists={createCardContext.playlists}
          rows={createCardContext.rows}
          rosterPlayers={rosterPlayers ?? []}
          isRosterLoading={isRosterLoading}
          hasRosterError={Boolean(rosterError)}
          onRetryRoster={() => void mutateRoster().catch(() => undefined)}
          onSubmit={handleCreateCards}
          onClose={() => setCreateCardContext(null)}
          sportLabel={resolvedSport}
        />
      )}
    </div>
  );
};
