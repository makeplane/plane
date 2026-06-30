"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { Aperture, Mic } from "lucide-react";
import type { TIssue } from "@plane/types";
import { cn } from "@plane/utils";
import { useProject } from "@/hooks/store/use-project";
import { useAppRouter } from "@/hooks/use-app-router";
import { MediaLibraryService } from "@/services/media-library.service";
import type { TMediaItem } from "ce/features/media-library/types/media-library.types";
import { getEventMediaDetails } from "ce/features/media-library/utils/media-event";
import { buildEventPayloadDevices, fetchSgEventDevices, loadSgMediaPayload } from "./data";
import { SgEventDetailsCard } from "./details-card";
import { SgEventHeader } from "./header";
import { SgEventVideoPlayer } from "./sg-event-video-player";
import { SgEventTagsPanel } from "./tags-panel";
import type { RowFilterMode, SgEventDetailPageProps, SgIssue, SgTagRow } from "./types";
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
  const [selectedGroupValue, setSelectedGroupValue] = useState<string>("All tags");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [favoriteTagIds, setFavoriteTagIds] = useState<string[]>([]);
  const [removedTagIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [rowFilterMode, setRowFilterMode] = useState<RowFilterMode>("all");
  const [closedGroups, setClosedGroups] = useState<string[]>([]);
  const [activeVideoId, setActiveVideoId] = useState<string>("");
  const [activePlaybackOverride, setActivePlaybackOverride] = useState<TMediaItem | null>(null);
  const [pendingSeekSeconds, setPendingSeekSeconds] = useState<number | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedViewId, setSelectedViewId] = useState<string>("");

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
  const tagRows = normalizeTagRows(tagSourcePayload, eventDetails, sportTableConfig.sport, baseEventDateTime);
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

    const preferredDevice = viewDevices.find((device) => device.streamName === primaryStreamName.trim()) ?? viewDevices[0];
    setSelectedViewId(String(preferredDevice.id));
  }, [primaryStreamName, selectedViewId, viewDevices]);

  const activeVideo =
    sgMediaPayload?.videoItems.find((item) => item.id === activeVideoId) ?? sgMediaPayload?.videoItems?.[0] ?? null;
  const selectedViewDevice = viewDevices.find((device) => String(device.id) === selectedViewId) ?? viewDevices[0] ?? null;
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
  const filteredRows = tagRows.filter((row) => {
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

  const groupedRows = filteredRows.reduce<Record<string, SgTagRow[]>>((accumulator, row) => {
    accumulator[row.groupValue] ??= [];
    accumulator[row.groupValue].push(row);
    return accumulator;
  }, {});

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

  const handleToggleClosedGroup = (groupValue: string) => {
    setClosedGroups((currentValue) =>
      currentValue.includes(groupValue)
        ? currentValue.filter((value) => value !== groupValue)
        : [...currentValue, groupValue]
    );
  };

  const handleToggleSearch = () => {
    if (isSearchOpen && !searchQuery) {
      setIsSearchOpen(false);
      return;
    }

    setIsSearchOpen(true);
  };

  const handleSwitchToFullStream = useCallback(() => {
    setActivePlaybackOverride(null);
    setPendingSeekSeconds(null);
  }, []);

  const handlePlayTagRow = useCallback(
    async (row: SgTagRow) => {
      const originalStreamName = (selectedViewDevice?.streamName ?? primaryStreamName ?? "").trim();
      const playlistTimestamp = row.playlistTimestamp?.trim() || "";
      const playlistFallbackTimestamp = row.playlistFallbackTimestamp?.trim() || "";
      const displayTimecode = (row.timecode.split("-")[0] ?? row.timecode).trim();
      const fallbackSeekSeconds = row.clipStartSeconds ?? parseTimecodeToSeconds(displayTimecode);

      if (!originalStreamName || !playlistTimestamp) {
        setActivePlaybackOverride(null);
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
            thumbnail: "",
            title: `${row.action} · ${row.player}`.trim(),
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
      setPendingSeekSeconds(fallbackSeekSeconds);
    },
    [mediaLibraryService, primaryStreamName, resolvedWorkItemId, selectedViewDevice?.streamName]
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
            viewDevices={viewDevices}
          />

          <div className={cn("grid gap-4 xl:grid-cols-[44px_minmax(0,1fr)]", !hasPlayableVideo && "xl:grid-cols-[minmax(0,1fr)]")}>
            <div className={cn("hidden flex-col gap-2 xl:flex", !hasPlayableVideo && "xl:hidden")}>
              {[Aperture, Mic].map((Icon, index) => (
                <button
                  key={index}
                  type="button"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-custom-border-200 bg-custom-sidebar-background-100 text-custom-text-300 transition-colors hover:bg-custom-background-90 hover:text-custom-text-100"
                >
                  <Icon className="h-4 w-4" />
                </button>
              ))}
            </div>

            <div className="min-w-0">
              <SgEventVideoPlayer item={playbackItem} compactEmpty={!hasPlayableVideo} seekToSeconds={pendingSeekSeconds} />
            </div>
            <div className={cn("min-w-0", hasPlayableVideo && "xl:col-span-2")}>
              <div className="flex flex-col gap-4">
                <SgEventDetailsCard
                  eventDateTimeLabel={eventDateTimeLabel}
                  levelLabel={levelLabel}
                  venueAddress={venueAddress}
                  venueName={venueName}
                />

                <SgEventTagsPanel
                  activeFilterLabel={rowFilterMode === "all" ? "All rows" : rowFilterMode === "favorites" ? "Favorites only" : "Selected rows"}
                  activePlaybackOverrideId={activePlaybackOverride?.id ?? null}
                  allVisibleSelected={allVisibleSelected}
                  availableGroups={availableGroups}
                  closedGroups={closedGroups}
                  effectiveGroupValue={effectiveGroupValue}
                  favoriteTagIds={favoriteTagIds}
                  groupedRows={groupedRows}
                  isMediaLoading={isMediaLoading}
                  isSearchOpen={isSearchOpen}
                  onPlayTagRow={handlePlayTagRow}
                  onRowFilterModeChange={setRowFilterMode}
                  onSearchQueryChange={setSearchQuery}
                  onSelectAll={handleSelectAll}
                  onSelectedGroupValueChange={setSelectedGroupValue}
                  onToggleClosedGroup={handleToggleClosedGroup}
                  onToggleFavorite={handleToggleFavorite}
                  onToggleSearch={handleToggleSearch}
                  onToggleTagSelection={handleToggleTagSelection}
                  rowFilterMode={rowFilterMode}
                  searchQuery={searchQuery}
                  selectedTagIds={selectedTagIds}
                  sportTableConfig={sportTableConfig}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
