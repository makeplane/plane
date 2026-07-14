"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { API_BASE_URL } from "@plane/constants";
import type { IRosterPlayer, TIssue } from "@plane/types";
import { useProject } from "@/hooks/store/use-project";
import { useAppRouter } from "@/hooks/use-app-router";
import { MediaLibraryService } from "@/services/media-library.service";
import type { TMediaArtifact } from "@/services/media-library.service";
import { RosterService } from "@/services/roster.service";
import type { TMediaItem } from "ce/features/media-library/types/media-library.types";
import { getEventMediaDetails } from "ce/features/media-library/utils/media-event";
import { buildEventPayloadDevices, fetchSgEventDevices, loadSgMediaPayload } from "./data";
import { SgEventDetailsCard } from "./details-card";
import { SgEventHeader, SgEventTitleBar } from "./header";
import { SgEventVideoPlayer } from "./sg-event-video-player";
import { SgEventTagsPanel } from "./tags-panel";
import { SgEventTimelinePanel } from "./timeline-panel";
import type { RowFilterMode, SgEventDetailPageProps, SgEventTagViewMode, SgIssue, SgTagRow } from "./types";
import {
  asRecord,
  buildArchivedPlaylistUrl,
  buildBaseEventDateTime,
  buildEventTitle,
  firstNonEmptyRecord,
  formatLongDateTime,
  getCpServerBaseUrl,
  getSportTableConfig,
  normalizeTagRows,
  parseTimecodeToSeconds,
  pickText,
  playlistHasMediaSegments,
  toText,
} from "./utils";

type TThumbnailLookupContext = {
  packageId?: string;
  projectId: string;
  workspaceSlug: string;
};

const joinApiPath = (base: string, path: string) => `${base?.replace(/\/$/, "") ?? ""}${path}`;

const buildManifestArtifactFileUrl = (context: TThumbnailLookupContext, artifactName: string) => {
  const normalizedArtifactName = artifactName.trim();

  if (!context.workspaceSlug || !context.projectId || !context.packageId || !normalizedArtifactName) {
    return "";
  }

  return joinApiPath(
    API_BASE_URL,
    `/api/workspaces/${context.workspaceSlug}/projects/${context.projectId}/media-library/packages/${context.packageId}/artifacts/${encodeURIComponent(
      normalizedArtifactName
    )}/file/`
  );
};

const resolveFallbackUrl = (value: string | null | undefined) => {
  const normalizedValue = (value ?? "").trim();
  if (!normalizedValue) return "";
  if (/^https?:\/\//i.test(normalizedValue)) return normalizedValue;
  return `/${normalizedValue.replace(/^\/+/, "")}`;
};

const getJerseyNumberKeys = (value: string | null | undefined) => {
  const normalizedValue = (value ?? "").trim().replace(/^#/, "").replace(/\s+/g, "");
  if (!normalizedValue) return [];

  const withoutLeadingZeros = normalizedValue.replace(/^0+(?=\d)/, "");
  return Array.from(new Set([normalizedValue.toLowerCase(), withoutLeadingZeros.toLowerCase()].filter(Boolean)));
};

const buildTimelinePlayerLabelMap = (players: IRosterPlayer[] | undefined) => {
  const labelMap = new Map<string, string>();

  (players ?? []).forEach((player) => {
    const playerName = player.player_name.trim();
    const jerseyNumber = player.jersey_number?.trim() ?? "";
    const playerLabel = [playerName, jerseyNumber ? `#${jerseyNumber.replace(/^#/, "")}` : ""]
      .filter(Boolean)
      .join(", ");

    if (!playerLabel) return;

    getJerseyNumberKeys(jerseyNumber).forEach((key) => {
      labelMap.set(key, playerLabel);
    });
  });

  return labelMap;
};

const getThumbnailLookupKeys = (value: string | null | undefined) => {
  const normalizedValue = (value ?? "").trim();
  if (!normalizedValue) return [];

  const keys = new Set<string>();
  const addLookupKeyVariants = (candidateValue: string) => {
    const normalizedCandidateValue = candidateValue.trim().toLowerCase();
    if (!normalizedCandidateValue) return;

    keys.add(normalizedCandidateValue);

    if (normalizedCandidateValue.startsWith("/")) {
      keys.add(normalizedCandidateValue.replace(/^\/+/, ""));
    } else if (!/^https?:\/\//i.test(normalizedCandidateValue)) {
      keys.add(`/${normalizedCandidateValue}`);
    }

    const fileName = normalizedCandidateValue.split("/").pop() ?? "";
    if (!fileName || fileName === normalizedCandidateValue) return;

    keys.add(fileName);

    const fileStem = fileName.replace(/\.[a-z0-9]+$/i, "");
    if (fileStem && fileStem !== fileName) {
      keys.add(fileStem);
    }
  };

  const baseValue = normalizedValue.split("?")[0].split("#")[0];
  addLookupKeyVariants(baseValue);

  try {
    const url = new URL(normalizedValue, typeof window !== "undefined" ? window.location.origin : "http://localhost");
    url.hash = "";
    url.search = "";
    addLookupKeyVariants(`${url.origin}${url.pathname}`);
    addLookupKeyVariants(url.pathname);
  } catch {
    // Keep the normalized raw value when URL parsing is unavailable for this input.
  }

  return Array.from(keys).filter(Boolean);
};

const getArtifactIdFromPath = (value: string) => {
  const normalizedValue = value.trim();
  if (!normalizedValue) return "";

  try {
    const url = new URL(normalizedValue, typeof window !== "undefined" ? window.location.origin : "http://localhost");
    const match = url.pathname.match(/(?:^|\/)artifacts\/([^/]+)(?:\/|$)/);
    return match?.[1] ? decodeURIComponent(match[1]) : "";
  } catch {
    const match = normalizedValue.match(/(?:^|\/)artifacts\/([^/]+)(?:\/|$)/);
    return match?.[1] ? decodeURIComponent(match[1]) : "";
  }
};

const getCoachProxyThumbnailName = (value: string | null | undefined) => {
  const normalizedValue = (value ?? "").trim();
  if (!normalizedValue) return "";

  try {
    const url = new URL(normalizedValue, typeof window !== "undefined" ? window.location.origin : "http://localhost");
    const normalizedPath = url.pathname.replace(/\/$/, "");
    if (!normalizedPath.endsWith("/api/coach/media/proxy")) return "";

    return (url.searchParams.get("thumbnail") ?? "").trim().replace(/\.jpg$/i, "");
  } catch {
    return "";
  }
};

const resolveCoachTagThumbnailUrl = (value: string | null | undefined, cpServerBaseUrl: string) => {
  const normalizedValue = (value ?? "").trim();
  const normalizedCpServerBaseUrl = cpServerBaseUrl.replace(/\/$/, "");
  if (!normalizedValue || !normalizedCpServerBaseUrl) return "";

  const thumbnailName = getCoachProxyThumbnailName(normalizedValue);
  if (thumbnailName) {
    return `${normalizedCpServerBaseUrl}/blobs/thumbnails/${encodeURIComponent(thumbnailName)}.jpg`;
  }

  try {
    const url = new URL(normalizedValue, typeof window !== "undefined" ? window.location.origin : "http://localhost");
    if (/^https?:\/\//i.test(normalizedValue)) {
      return "";
    }
    if (url.pathname.startsWith("/blobs/thumbnails/")) {
      return `${normalizedCpServerBaseUrl}${url.pathname}${url.search}`;
    }
  } catch {
    if (normalizedValue.startsWith("/blobs/thumbnails/")) {
      return `${normalizedCpServerBaseUrl}${normalizedValue}`;
    }
  }

  return "";
};

const isManifestThumbnailArtifact = (artifact: TMediaArtifact) =>
  (artifact.format ?? "").toLowerCase() === "thumbnail" || (artifact.action ?? "").toLowerCase() === "preview";

const buildMediaThumbnailLookup = (
  items: TMediaItem[] | undefined,
  manifestArtifacts: TMediaArtifact[] | undefined,
  context: TThumbnailLookupContext
) => {
  const lookup = new Map<string, string>();
  const addLookup = (value: string | null | undefined, thumbnail: string) => {
    getThumbnailLookupKeys(value).forEach((key) => {
      if (!lookup.has(key)) lookup.set(key, thumbnail);
    });
  };
  const artifactByKey = new Map<string, TMediaArtifact>();
  const addArtifactLookupKeys = (artifact: TMediaArtifact, thumbnail: string) => {
    addLookup(artifact.name, thumbnail);
    addLookup(artifact.path, thumbnail);
    addLookup(artifact.link, thumbnail);

    const artifactIdFromPath = getArtifactIdFromPath(artifact.path);
    addLookup(artifactIdFromPath, thumbnail);
  };
  const resolveArtifactByValue = (value: string | null | undefined) => {
    for (const key of getThumbnailLookupKeys(value)) {
      const artifact = artifactByKey.get(key);
      if (artifact) return artifact;
    }

    return undefined;
  };

  (manifestArtifacts ?? []).forEach((artifact) => {
    getThumbnailLookupKeys(artifact.name).forEach((key) => artifactByKey.set(key, artifact));
    getThumbnailLookupKeys(artifact.path).forEach((key) => {
      if (!artifactByKey.has(key)) artifactByKey.set(key, artifact);
    });
  });

  (manifestArtifacts ?? []).forEach((artifact) => {
    if (!isManifestThumbnailArtifact(artifact)) return;

    const thumbnailUrl = buildManifestArtifactFileUrl(context, artifact.name) || resolveFallbackUrl(artifact.path);
    if (!thumbnailUrl) return;

    addArtifactLookupKeys(artifact, thumbnailUrl);

    const linkedArtifact = resolveArtifactByValue(artifact.link);
    if (linkedArtifact) {
      addArtifactLookupKeys(linkedArtifact, thumbnailUrl);
    }
  });

  (items ?? []).forEach((item) => {
    if (!item.thumbnail) return;

    addLookup(item.id, item.thumbnail);
    addLookup(item.link, item.thumbnail);
    addLookup(item.videoSrc, item.thumbnail);
    addLookup(item.imageSrc, item.thumbnail);
    addLookup(item.fileSrc, item.thumbnail);
    addLookup(item.downloadSrc, item.thumbnail);
    addLookup(item.thumbnail, item.thumbnail);
  });

  return lookup;
};

const getThumbnailFromLookup = (value: string | null | undefined, thumbnailLookup: Map<string, string>) => {
  for (const key of getThumbnailLookupKeys(value)) {
    const thumbnail = thumbnailLookup.get(key);
    if (thumbnail) return thumbnail;
  }

  return "";
};

const resolveTagRowArtifactThumbnail = (
  row: SgTagRow,
  thumbnailLookup: Map<string, string>,
  cpServerBaseUrl: string
) => {
  if (row.thumbnailUrl) {
    const thumbnailMatch = getThumbnailFromLookup(row.thumbnailUrl, thumbnailLookup);
    if (thumbnailMatch) return thumbnailMatch;

    const thumbnailArtifactId = getArtifactIdFromPath(row.thumbnailUrl);
    if (thumbnailArtifactId) {
      const thumbnailArtifactMatch = getThumbnailFromLookup(thumbnailArtifactId, thumbnailLookup);
      if (thumbnailArtifactMatch) return thumbnailArtifactMatch;
    }

    const coachTagThumbnailUrl = resolveCoachTagThumbnailUrl(row.thumbnailUrl, cpServerBaseUrl);
    if (coachTagThumbnailUrl) return coachTagThumbnailUrl;

    return row.thumbnailUrl;
  }

  const sourceMatch = getThumbnailFromLookup(row.sourceUrl, thumbnailLookup);
  if (sourceMatch) return sourceMatch;

  const artifactId = getArtifactIdFromPath(row.sourceUrl);
  if (artifactId) {
    const artifactMatch = getThumbnailFromLookup(artifactId, thumbnailLookup);
    if (artifactMatch) return artifactMatch;
  }

  return "";
};

export const SgEventDetailPage = ({
  issue,
  mediaItem = null,
  projectId,
  workspaceSlug,
  fallbackBackHref,
  onBack,
}: SgEventDetailPageProps) => {
  const sgIssue = issue as SgIssue | undefined;
  const router = useAppRouter();
  const { getProjectById } = useProject();
  const mediaLibraryService = useMemo(() => new MediaLibraryService(), []);
  const rosterService = useMemo(() => new RosterService(), []);
  const [selectedGroupValue, setSelectedGroupValue] = useState<string>("All tags");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [favoriteTagIds, setFavoriteTagIds] = useState<string[]>([]);
  const [removedTagIds, setRemovedTagIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [rowFilterMode, setRowFilterMode] = useState<RowFilterMode>("all");
  const [activeVideoId, setActiveVideoId] = useState<string>("");
  const [activePlaybackOverride, setActivePlaybackOverride] = useState<TMediaItem | null>(null);
  const [activeTimelineTagId, setActiveTimelineTagId] = useState<string | null>(null);
  const [pendingSeekSeconds, setPendingSeekSeconds] = useState<number | null>(null);
  const [playerLocalSeconds, setPlayerLocalSeconds] = useState(0);
  const [playerDurationSeconds, setPlayerDurationSeconds] = useState<number | null>(null);
  const [playheadBaseSeconds, setPlayheadBaseSeconds] = useState(0);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedViewId, setSelectedViewId] = useState<string>("");
  const [tagViewMode, setTagViewMode] = useState<SgEventTagViewMode>("timeline");

  const mediaMeta = asRecord(mediaItem?.meta);
  const cpServerBaseUrl = useMemo(() => getCpServerBaseUrl(), []);
  const project = getProjectById(projectId);
  const resolvedWorkItemId = issue?.id || mediaItem?.workItemId || "";
  const { data: sgMediaPayload, isLoading: isMediaLoading } = useSWR(
    workspaceSlug && projectId && (resolvedWorkItemId || mediaItem?.id)
      ? `SG_EVENT_MEDIA_${workspaceSlug}_${projectId}_${resolvedWorkItemId || mediaItem?.id}`
      : null,
    () => loadSgMediaPayload(workspaceSlug, projectId, resolvedWorkItemId, mediaItem, mediaLibraryService),
    { revalidateOnFocus: false }
  );
  const { data: rosterPlayers } = useSWR(
    workspaceSlug && projectId ? `PROJECT_ROSTER_${workspaceSlug}_${projectId}` : null,
    () => rosterService.getRoster(workspaceSlug, projectId),
    { revalidateOnFocus: false }
  );
  const timelinePlayerLabelByNumber = useMemo(() => buildTimelinePlayerLabelMap(rosterPlayers), [rosterPlayers]);

  const eventDetails = getEventMediaDetails(mediaItem) ?? sgMediaPayload?.eventDetails ?? null;
  const sportTableConfig = getSportTableConfig(eventDetails?.sport ?? toText(mediaMeta.sport));
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
  const resolvedSgEventId =
    (sgIssue?.sg_event_id != null ? String(sgIssue.sg_event_id).trim() : "") ||
    pickText(
      [...payloadSources, mediaMeta, asRecord(mediaItem)],
      ["sg_event_id", "eventId", "event_id", "preview_event_id", "plane_event_id", "planeEventId"]
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
  const tagSourcePayload = firstNonEmptyRecord(eventPayload, sgEventMeta, mediaMeta);
  const tagRows = useMemo(
    () => normalizeTagRows(tagSourcePayload, eventDetails, sportTableConfig.sport, baseEventDateTime),
    [baseEventDateTime, eventDetails, sportTableConfig.sport, tagSourcePayload]
  );
  const mediaThumbnailLookup = useMemo(
    () =>
      buildMediaThumbnailLookup(sgMediaPayload?.mediaItems, sgMediaPayload?.manifestArtifacts, {
        packageId: sgMediaPayload?.packageId,
        projectId,
        workspaceSlug,
      }),
    [projectId, sgMediaPayload?.manifestArtifacts, sgMediaPayload?.mediaItems, sgMediaPayload?.packageId, workspaceSlug]
  );
  const tagRowsWithThumbnails = useMemo(
    () =>
      tagRows.map((row) => {
        const thumbnailUrl = resolveTagRowArtifactThumbnail(row, mediaThumbnailLookup, cpServerBaseUrl);
        return thumbnailUrl && thumbnailUrl !== row.thumbnailUrl ? { ...row, thumbnailUrl } : row;
      }),
    [cpServerBaseUrl, mediaThumbnailLookup, tagRows]
  );
  const payloadViewDevices = useMemo(() => buildEventPayloadDevices(eventPayload), [eventPayload]);
  const viewDevices = sgEventDevices && sgEventDevices.length > 0 ? sgEventDevices : payloadViewDevices;
  const primaryStreamName =
    pickText(payloadSources, ["primaryStreamName", "primary_stream_name"]) || eventDetails?.primaryStreamName || "";
  const availableGroups = Array.from(new Set(tagRows.map((row) => row.groupValue)));
  const effectiveGroupValue =
    selectedGroupValue === "All tags" || availableGroups.includes(selectedGroupValue)
      ? selectedGroupValue
      : availableGroups[0] || "All tags";

  useEffect(() => {
    if (selectedGroupValue === "All tags") return;
    if (availableGroups.length === 0) return;
    if (!availableGroups.includes(selectedGroupValue)) {
      setSelectedGroupValue(availableGroups[0]);
    }
  }, [availableGroups, selectedGroupValue]);

  useEffect(() => {
    const primaryVideo = sgMediaPayload?.videoItems?.[0];
    if (!primaryVideo) return;
    if (!activeVideoId || !sgMediaPayload?.videoItems.some((item) => item.id === activeVideoId)) {
      setActiveVideoId(primaryVideo.id);
    }
  }, [activeVideoId, sgMediaPayload?.videoItems]);

  useEffect(() => {
    if (viewDevices.length === 0) {
      if (selectedViewId) {
        setSelectedViewId("");
      }
      return;
    }

    const hasCurrentSelection = viewDevices.some((device) => String(device.id) === selectedViewId);
    if (hasCurrentSelection) {
      return;
    }

    const preferredDevice =
      viewDevices.find((device) => device.streamName === primaryStreamName.trim()) ?? viewDevices[0];
    setSelectedViewId(String(preferredDevice.id));
  }, [primaryStreamName, selectedViewId, viewDevices]);

  const activeVideo =
    sgMediaPayload?.videoItems.find((item) => item.id === activeVideoId) ?? sgMediaPayload?.videoItems?.[0] ?? null;
  const selectedViewDevice =
    viewDevices.find((device) => String(device.id) === selectedViewId) ?? viewDevices[0] ?? null;
  const selectedViewLabel = selectedViewDevice
    ? `View ${Math.max(viewDevices.findIndex((device) => device.id === selectedViewDevice.id) + 1, 1)}`
    : "View 1";
  const fullStreamPlaybackItem = useMemo<TMediaItem | null>(() => {
    if (!selectedViewDevice?.hlsUrl) {
      return null;
    }

    const baseItem = {
      action: "play_streaming",
      author: "",
      createdAt: "",
      description: "",
      docs: [],
      duration: "",
      format: "m3u8",
      id: `sg-view-${selectedViewDevice.id}`,
      itemsCount: 0,
      mediaType: "video" as const,
      meta: {},
      primaryTag: "",
      secondaryTag: "",
      thumbnail: "",
      title: selectedViewDevice.name || `View ${selectedViewDevice.id}`,
      views: 0,
      workItemId: resolvedWorkItemId || null,
    };

    return {
      ...baseItem,
      action: "play_streaming",
      downloadSrc: selectedViewDevice.hlsUrl,
      fileSrc: selectedViewDevice.hlsUrl,
      format: "m3u8",
      id: `sg-view-${selectedViewDevice.id}`,
      link: selectedViewDevice.hlsUrl,
      linkedFormat: "m3u8",
      linkedMediaType: "video",
      mediaType: "video",
      meta: {
        ...(baseItem.meta ?? {}),
        hls: true,
        hls_direct: true,
        streamName: selectedViewDevice.streamName,
        stream_name: selectedViewDevice.streamName,
      },
      title: selectedViewDevice.name || baseItem.title,
      videoSrc: selectedViewDevice.hlsUrl,
    } satisfies TMediaItem;
  }, [resolvedWorkItemId, selectedViewDevice]);
  const playbackItem = useMemo<TMediaItem | null>(() => {
    if (activePlaybackOverride) {
      return activePlaybackOverride;
    }

    if (fullStreamPlaybackItem) {
      return fullStreamPlaybackItem;
    }

    if (activeVideo) {
      return activeVideo;
    }

    return null;
  }, [activePlaybackOverride, activeVideo, fullStreamPlaybackItem]);
  const hasPlayableVideo = Boolean(playbackItem);
  const isTagClipActive = Boolean(activePlaybackOverride?.id?.startsWith("sg-tag-"));
  const filteredRows = tagRowsWithThumbnails.filter((row) => {
    if (removedTagIds.includes(row.id)) return false;
    if (effectiveGroupValue !== "All tags" && row.groupValue !== effectiveGroupValue) return false;
    if (rowFilterMode === "favorites" && !favoriteTagIds.includes(row.id)) return false;
    if (rowFilterMode === "selected" && !selectedTagIds.includes(row.id)) return false;
    if (!searchQuery.trim()) return true;

    const haystack = [
      row.player,
      row.action,
      row.groupValue,
      row.result,
      row.team,
      row.timecode,
      row.primaryDetail,
      row.secondaryDetail,
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(searchQuery.trim().toLowerCase());
  });

  const allVisibleSelected = filteredRows.length > 0 && filteredRows.every((row) => selectedTagIds.includes(row.id));
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
  const venueName =
    pickText(payloadSources, ["venue", "venue_name", "location", "location_label", "locationLabel"]) ||
    eventDetails?.locationLabel ||
    "";
  const venueAddress = pickText(payloadSources, ["address", "venue_address", "location_address", "locationAddress"]);
  const eventStatus =
    pickText(payloadSources, ["status", "event_status"]) ||
    eventDetails?.status ||
    toText(mediaMeta.status) ||
    (issue?.completed_at ? "Completed" : "Scheduled");
  const levelLabel =
    pickText(payloadSources, ["team_level", "level"]) ||
    eventDetails?.level ||
    toText(mediaMeta.level) ||
    issue?.level ||
    "Freshmen";
  const eventDateTimeLabel = formatLongDateTime(dateValue, timeValue);

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

  const handleSelectAll = () => {
    if (allVisibleSelected) {
      setSelectedTagIds((currentValue) => currentValue.filter((id) => !filteredRows.some((row) => row.id === id)));
      return;
    }

    setSelectedTagIds((currentValue) => Array.from(new Set([...currentValue, ...filteredRows.map((row) => row.id)])));
  };

  const handleToggleTagSelection = (tagId: string) => {
    setSelectedTagIds((currentValue) =>
      currentValue.includes(tagId) ? currentValue.filter((id) => id !== tagId) : [...currentValue, tagId]
    );
  };

  const handleToggleFavorite = (tagId: string) => {
    setFavoriteTagIds((currentValue) =>
      currentValue.includes(tagId) ? currentValue.filter((value) => value !== tagId) : [...currentValue, tagId]
    );
  };

  const handleToggleSearch = () => {
    if (isSearchOpen && !searchQuery) {
      setIsSearchOpen(false);
      return;
    }

    setIsSearchOpen(true);
  };

  const handleRemoveTag = (tagId: string) => {
    setRemovedTagIds((currentValue) => (currentValue.includes(tagId) ? currentValue : [...currentValue, tagId]));
    setActiveTimelineTagId((currentValue) => (currentValue === tagId ? null : currentValue));
    setSelectedTagIds((currentValue) => currentValue.filter((id) => id !== tagId));
    setFavoriteTagIds((currentValue) => currentValue.filter((id) => id !== tagId));
  };

  const handleSwitchToFullStream = useCallback(() => {
    setActivePlaybackOverride(null);
    setActiveTimelineTagId(null);
    setPlayheadBaseSeconds(0);
    setPendingSeekSeconds(null);
  }, []);

  const handleResetTimelinePlayback = useCallback(() => {
    setActivePlaybackOverride(null);
    setActiveTimelineTagId(null);
    setPlayheadBaseSeconds(0);
    setPlayerLocalSeconds(0);
    setPendingSeekSeconds(null);
    window.setTimeout(() => setPendingSeekSeconds(0), 0);
  }, []);

  const handlePlaybackTimeChange = useCallback((seconds: number, durationSeconds: number | null) => {
    setPlayerLocalSeconds(seconds);
    setPlayerDurationSeconds(durationSeconds);
  }, []);

  const handlePlayTagRow = useCallback(
    async (row: SgTagRow) => {
      setActiveTimelineTagId(row.id);
      const originalStreamName = (selectedViewDevice?.streamName ?? primaryStreamName ?? "").trim();
      const playlistTimestamp = row.playlistTimestamp?.trim() || "";
      const playlistFallbackTimestamp = row.playlistFallbackTimestamp?.trim() || "";
      const displayTimecode = (row.timecode.split("-")[0] ?? row.timecode).trim();
      const fallbackSeekSeconds = row.clipStartSeconds ?? parseTimecodeToSeconds(displayTimecode) ?? 0;

      if (!originalStreamName || !playlistTimestamp) {
        setActivePlaybackOverride(null);
        setPlayheadBaseSeconds(0);
        setPendingSeekSeconds(fallbackSeekSeconds);
        return;
      }

      try {
        const timestampCandidates = Array.from(new Set([playlistTimestamp, playlistFallbackTimestamp].filter(Boolean)));

        for (const candidateTimestamp of timestampCandidates) {
          const playlistFileName = await mediaLibraryService.createPlaylist([
            {
              original_stream_name: originalStreamName,
              timestamp: candidateTimestamp,
            },
          ]);

          const playlistUrl = playlistFileName ? buildArchivedPlaylistUrl(playlistFileName) : null;
          if (!playlistUrl) {
            continue;
          }

          const hasMediaSegments = await playlistHasMediaSegments(playlistUrl);
          if (!hasMediaSegments) {
            continue;
          }

          setPendingSeekSeconds(null);
          setPlayerLocalSeconds(0);
          setPlayheadBaseSeconds(fallbackSeekSeconds);
          setActivePlaybackOverride({
            action: "play_streaming",
            author: "",
            createdAt: "",
            description: "",
            docs: [],
            duration: "",
            downloadSrc: playlistUrl,
            fileSrc: playlistUrl,
            format: "m3u8",
            id: `sg-tag-${row.id}`,
            itemsCount: 0,
            link: playlistUrl,
            linkedFormat: "m3u8",
            linkedMediaType: "video",
            mediaType: "video",
            meta: {
              hls: true,
              hls_direct: true,
              original_stream_name: originalStreamName,
              playlistFileName,
              tagAction: row.action,
              tagPlayer: row.player,
              playlistTimestamp: candidateTimestamp,
              tagTimecode: row.timecode,
              timestamp: candidateTimestamp,
            },
            primaryTag: "",
            secondaryTag: "",
            thumbnail: row.thumbnailUrl || activeVideo?.thumbnail || mediaItem?.thumbnail || "",
            title: `${row.action} - ${row.player}`.trim(),
            videoSrc: playlistUrl,
            views: 0,
            workItemId: resolvedWorkItemId || null,
          });
          return;
        }
      } catch (error) {
        console.error("Failed to create playlist for tag row.", error);
      }

      setActivePlaybackOverride(null);
      setPlayheadBaseSeconds(0);
      setPendingSeekSeconds(fallbackSeekSeconds);
    },
    [
      activeVideo?.thumbnail,
      mediaItem?.thumbnail,
      mediaLibraryService,
      primaryStreamName,
      resolvedWorkItemId,
      selectedViewDevice?.streamName,
    ]
  );

  return (
    <div className="h-full bg-custom-background-100 text-custom-text-100">
      <div className="h-full overflow-y-auto px-3 py-4 md:px-4 xl:px-5">
        <div className="flex w-full flex-col gap-4">
          <SgEventHeader
            eventStatus={eventStatus}
            eventTitle={eventTitle}
            fullStreamPlaybackItem={fullStreamPlaybackItem}
            handleBack={handleBack}
            handleSwitchToFullStream={handleSwitchToFullStream}
            isLoadingViews={isLoadingViews}
            isTagClipActive={isTagClipActive}
            selectedViewId={selectedViewId}
            selectedViewLabel={selectedViewLabel}
            setSelectedViewId={setSelectedViewId}
            setTagViewMode={setTagViewMode}
            tagViewMode={tagViewMode}
            viewDevices={viewDevices}
          />

          <div className="min-w-0">
            <SgEventVideoPlayer
              item={playbackItem}
              compactEmpty={!hasPlayableVideo}
              onPlaybackTimeChange={handlePlaybackTimeChange}
              seekToSeconds={pendingSeekSeconds}
            />
          </div>

          <div className="min-w-0">
            <div className="flex flex-col gap-3">
              <SgEventTitleBar
                eventStatus={eventStatus}
                eventTitle={eventTitle}
                handleSwitchToFullStream={handleSwitchToFullStream}
                isTagClipActive={isTagClipActive}
              />

              <SgEventDetailsCard
                eventDateTimeLabel={eventDateTimeLabel}
                levelLabel={levelLabel}
                venueAddress={venueAddress}
                venueName={venueName}
              />

              {tagViewMode === "timeline" ? (
                <SgEventTimelinePanel
                  activePlaybackOverrideId={activePlaybackOverride?.id ?? null}
                  activeTagRowId={activeTimelineTagId}
                  isMediaLoading={isMediaLoading}
                  onPlayTagRow={handlePlayTagRow}
                  onResetPlayback={handleResetTimelinePlayback}
                  playerDurationSeconds={playerDurationSeconds}
                  playheadSeconds={playheadBaseSeconds + playerLocalSeconds}
                  rows={filteredRows}
                  selectedTagIds={selectedTagIds}
                  sport={sportTableConfig.sport}
                  playerLabelByNumber={timelinePlayerLabelByNumber}
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
                  activePlaybackOverrideId={activePlaybackOverride?.id ?? null}
                  allVisibleSelected={allVisibleSelected}
                  availableGroups={availableGroups}
                  clipThumbnailUrl={activeVideo?.thumbnail || mediaItem?.thumbnail || playbackItem?.thumbnail || ""}
                  effectiveGroupValue={effectiveGroupValue}
                  favoriteTagIds={favoriteTagIds}
                  isMediaLoading={isMediaLoading}
                  isSearchOpen={isSearchOpen}
                  onPlayTagRow={handlePlayTagRow}
                  onRemoveTag={handleRemoveTag}
                  onRowFilterModeChange={setRowFilterMode}
                  onSearchQueryChange={setSearchQuery}
                  onSelectAll={handleSelectAll}
                  onSelectedGroupValueChange={setSelectedGroupValue}
                  onToggleFavorite={handleToggleFavorite}
                  onToggleSearch={handleToggleSearch}
                  onToggleTagSelection={handleToggleTagSelection}
                  rowFilterMode={rowFilterMode}
                  rows={filteredRows}
                  searchQuery={searchQuery}
                  selectedTagIds={selectedTagIds}
                  sportTableConfig={sportTableConfig}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
