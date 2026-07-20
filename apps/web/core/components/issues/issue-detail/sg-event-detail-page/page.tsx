"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { TIssue } from "@plane/types";
import { useProject } from "@/hooks/store/use-project";
import { useAppRouter } from "@/hooks/use-app-router";
import { MediaLibraryService } from "@/services/media-library.service";
import { RosterService } from "@/services/roster.service";
import { getEventMediaDetails } from "ce/features/media-library/utils/media-event";
import { buildEventPayloadDevices, fetchSgEventDevices, loadSgMediaPayload } from "./data";
import { SgEventDetailsCard } from "./details-card";
import { SgEventHeader, SgEventTitleBar } from "./header";
import { useSgEventPlaybackState } from "./hooks/use-sg-event-playback-state";
import { useSgEventTagState } from "./hooks/use-sg-event-tag-state";
import { fetchKanavioTagRowsPayload, isNumericEventId, normalizeFetchedTagPayload } from "./kanavio-tag-payload";
import { MatrixView } from "./matrix-view";
import { SgMatrixPlaylistPanel } from "./matrix-view/components/matrix-playlist-panel";
import { buildMatrixPlaylistItem, createMatrixPlaylist } from "./matrix-view/utils/create-matrix-playlist";
import { buildTimelinePlayerLabelMap } from "./media-thumbnail-lookup";
import { SgEventVideoPlayer } from "./sg-event-video-player";
import { SgEventTagsPanel } from "./tags-view";
import { SgEventTimelinePanel, isTimelineTagPlaybackOverrideId } from "./timeline-view";
import type { SgEventDetailPageProps, SgEventTagViewMode, SgIssue, SgTagRow } from "./types";
import {
  asRecord,
  buildBaseEventDateTime,
  buildEventTitle,
  firstNonEmptyRecord,
  formatLongDateTime,
  getCpServerBaseUrl,
  getLastPathSegment,
  getSportTableConfig,
  normalizeTagRows,
  pickText,
  toText,
} from "./utils";

export const SgEventDetailPage = ({
  enableMatrixView = false,
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
  const { getProjectById } = useProject();
  const mediaLibraryService = useMemo(() => new MediaLibraryService(), []);
  const rosterService = useMemo(() => new RosterService(), []);
  const [tagViewMode, setTagViewMode] = useState<SgEventTagViewMode>(enableMatrixView ? "matrix" : "timeline");
  const [isListExpanded, setIsListExpanded] = useState(false);
  const [isCreatingMatrixPlaylist, setIsCreatingMatrixPlaylist] = useState(false);

  const mediaMeta = asRecord(mediaItem?.meta);
  const cpServerBaseUrl = useMemo(() => getCpServerBaseUrl(), []);
  const project = getProjectById(projectId);
  const resolvedWorkItemId = issue?.id || mediaItem?.workItemId || "";
  const {
    data: sgMediaPayload,
    error: sgMediaError,
    isLoading: isMediaLoading,
  } = useSWR(
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
    (sgIssue?.sg_event_id != null ? String(sgIssue.sg_event_id).trim() : "") ||
    pickText(
      [...payloadSources, sgEventMeta, sgEventItemRecord, mediaMeta, asRecord(mediaItem)],
      [
        "sg_event_id",
        "sgEventId",
        "sgEventID",
        "eventId",
        "event_id",
        "preview_event_id",
        "plane_event_id",
        "planeEventId",
      ]
    );
  const shouldUseKanavioTagApi = Boolean(resolvedSgEventId && isNumericEventId(resolvedSgEventId));
  const resolvedCustomPlaylistEventId = shouldUseKanavioTagApi ? Number(resolvedSgEventId) : null;
  const { data: customPlaylists = [], mutate: mutateCustomPlaylists } = useSWR(
    resolvedCustomPlaylistEventId ? `CUSTOM_PLAYLISTS_${resolvedCustomPlaylistEventId}` : null,
    () => mediaLibraryService.getCustomPlaylists(String(resolvedCustomPlaylistEventId)),
    { revalidateOnFocus: false }
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
    handleSwitchToFullStream,
    hasPlayableVideo,
    isPlayerPlaying,
    isPlaybackOverrideActive,
    pendingSeekSeconds,
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
    effectiveGroupValue,
    favoriteTagIds,
    filteredRows,
    handleCreateMatrixCard,
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
  } = useSgEventTagState({
    cpServerBaseUrl,
    manifestArtifacts: sgMediaPayload?.manifestArtifacts,
    mediaItems: sgMediaPayload?.mediaItems,
    onActiveTagRemoved: clearActiveTimelineTag,
    packageId: sgMediaPayload?.packageId,
    projectId,
    sport: sportTableConfig.sport,
    tagRows,
    workspaceSlug,
  });

  useEffect(() => {
    if (tagViewMode !== "list" && isListExpanded) {
      setIsListExpanded(false);
    }
  }, [isListExpanded, tagViewMode]);
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

  const handleCreateMatrixPlaylist = useCallback(
    async (rows: SgTagRow[]) => {
      if (isCreatingMatrixPlaylist) return;
      if (rows.length === 0) {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "No clips selected",
          message: "Select at least one tag before creating a playlist.",
        });
        return;
      }
      if (!resolvedCustomPlaylistEventId) {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Missing event",
          message: "A service gateway event id is required before creating a playlist.",
        });
        return;
      }
      const streamName = (selectedViewDevice?.streamName ?? primaryStreamName).trim();
      setIsCreatingMatrixPlaylist(true);

      try {
        const result = await createMatrixPlaylist({ mediaLibraryService, rows, streamName });
        const includedRowIds = new Set(result.rowIds);
        const includedRows = rows.filter((row) => includedRowIds.has(row.id));
        const thumbnail =
          includedRows.find((row) => row.thumbnailUrl)?.thumbnailUrl ||
          activeVideo?.thumbnail ||
          mediaItem?.thumbnail ||
          null;
        const customPlaylist = await mediaLibraryService.createCustomPlaylist({
          event_id: resolvedCustomPlaylistEventId,
          name: `${eventTitle} (${includedRows.length} clip${includedRows.length === 1 ? "" : "s"})`,
          url: result.fileName || getLastPathSegment(result.url),
          thumbnail: getLastPathSegment(thumbnail),
          clip: includedRows.length,
        });
        playPlaybackOverride(
          buildMatrixPlaylistItem({
            result,
            rows: includedRows,
            workItemId: resolvedWorkItemId || null,
          })
        );
        void mutateCustomPlaylists((currentPlaylists = []) => [customPlaylist, ...currentPlaylists], {
          revalidate: false,
        });
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Playlist created",
          message: `${includedRows.length} selected tag${includedRows.length === 1 ? "" : "s"} are ready to play.`,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to create a playlist from the selected tags.";
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Playlist creation failed",
          message,
        });
      } finally {
        setIsCreatingMatrixPlaylist(false);
      }
    },
    [
      activeVideo?.thumbnail,
      eventTitle,
      isCreatingMatrixPlaylist,
      mediaLibraryService,
      mediaItem?.thumbnail,
      mutateCustomPlaylists,
      playPlaybackOverride,
      primaryStreamName,
      resolvedCustomPlaylistEventId,
      resolvedWorkItemId,
      selectedViewDevice?.streamName,
    ]
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
  const isMatrixWorkspaceMode = enableMatrixView && tagViewMode === "matrix";
  const activePlaylistRows = isMatrixWorkspaceMode ? playlistPanelRows : selectedRows;
  const isTagRowsLoading = isMediaLoading || (shouldUseKanavioTagApi && isKanavioTagsLoading);
  const matrixPreferenceKey = `plane:media-library:matrix-columns:${workspaceSlug}:${projectId}:${
    resolvedSgEventId || mediaItem?.id || resolvedWorkItemId || "event"
  }:${sportTableConfig.sport}`;
  const isExpandedListView = tagViewMode === "list" && isListExpanded;

  return (
    <div className="sg-matrix-workspace h-full bg-[var(--sg-matrix-page)] text-[var(--sg-matrix-text)]">
      <div className="h-full overflow-y-auto px-3 py-3">
        <div className="flex w-full flex-col gap-3">
          <SgEventHeader
            eventStatus={eventStatus}
            eventTitle={eventTitle}
            fullStreamPlaybackItem={fullStreamPlaybackItem}
            handleBack={handleBack}
            handleSwitchToFullStream={handleSwitchToFullStream}
            isMatrixViewEnabled={enableMatrixView}
            isLoadingViews={isLoadingViews}
            isTagClipActive={isPlaybackOverrideActive}
            selectedViewId={selectedViewId}
            selectedViewLabel={selectedViewLabel}
            setSelectedViewId={setSelectedViewId}
            setTagViewMode={setTagViewMode}
            tagViewMode={tagViewMode}
            viewDevices={viewDevices}
          />

          {isMatrixWorkspaceMode ? (
            <>
              <div className="grid min-w-0 gap-[10px] xl:grid-cols-[minmax(0,76fr)_minmax(260px,24fr)]">
                <div className="min-w-0 rounded-[5px] bg-[var(--sg-matrix-video-bg)]">
                  <SgEventVideoPlayer
                    item={playbackItem}
                    compactEmpty={!hasPlayableVideo}
                    onPlaybackTimeChange={handlePlaybackTimeChange}
                    seekToSeconds={pendingSeekSeconds}
                  />
                </div>
                <SgMatrixPlaylistPanel
                  customPlaylists={customPlaylists}
                  isCreatingPlaylist={isCreatingMatrixPlaylist}
                  onCreateCard={() => handleCreateMatrixCard(activePlaylistRows)}
                  onCreatePlaylist={() => void handleCreateMatrixPlaylist(activePlaylistRows)}
                  rows={activePlaylistRows}
                />
              </div>

              <div className="flex flex-col gap-2">
                <MatrixView
                  activeRowId={activeMatrixRowId}
                  className="min-h-0"
                  canCreatePlaylist={Boolean(matrixStreamName)}
                  error={matrixError}
                  hasEvent={Boolean(mediaItem || issue || eventDetails || eventPayload)}
                  isCreatingPlaylist={isCreatingMatrixPlaylist}
                  isLoading={isTagRowsLoading}
                  layout="workspace"
                  onCreateCard={handleCreateMatrixCard}
                  onCreatePlaylist={handleCreateMatrixPlaylist}
                  onFocusedRowsChange={setFocusedMatrixRows}
                  onPlayTagRow={handlePlayTagRow}
                  preferenceKey={matrixPreferenceKey}
                  sport={resolvedSport || ""}
                  tagRows={matrixRows}
                />
              </div>
            </>
          ) : (
            <>
              {!isExpandedListView && (
                <div className="grid min-w-0 gap-[10px] xl:grid-cols-[minmax(0,76fr)_minmax(260px,24fr)]">
                  <div className="min-w-0 rounded-[5px] bg-[var(--sg-matrix-video-bg)]">
                    <SgEventVideoPlayer
                      item={playbackItem}
                      compactEmpty={!hasPlayableVideo}
                      onPlaybackTimeChange={handlePlaybackTimeChange}
                      seekToSeconds={pendingSeekSeconds}
                    />
                  </div>
                  <SgMatrixPlaylistPanel
                    customPlaylists={customPlaylists}
                    isCreatingPlaylist={isCreatingMatrixPlaylist}
                    onCreateCard={() => handleCreateMatrixCard(activePlaylistRows)}
                    onCreatePlaylist={() => void handleCreateMatrixPlaylist(activePlaylistRows)}
                    rows={activePlaylistRows}
                  />
                </div>
              )}

              <div className="min-w-0">
                <div className="flex flex-col gap-3">
                  {!isExpandedListView && (
                    <>
                      <SgEventTitleBar
                        eventStatus={eventStatus}
                        eventTitle={eventTitle}
                        handleSwitchToFullStream={handleSwitchToFullStream}
                        isTagClipActive={isPlaybackOverrideActive}
                      />

                      <SgEventDetailsCard
                        eventDateTimeLabel={eventDateTimeLabel}
                        levelLabel={levelLabel}
                        venueAddress={venueAddress}
                        venueName={venueName}
                      />
                    </>
                  )}

                  {tagViewMode === "timeline" ? (
                    <SgEventTimelinePanel
                      activePlaybackOverrideId={activePlaybackOverrideId}
                      activeTagRowId={activeTimelineTagId}
                      isCreatingPlaylist={isCreatingMatrixPlaylist}
                      isMediaLoading={isTagRowsLoading}
                      onCreatePlaylist={() => void handleCreateMatrixPlaylist(activePlaylistRows)}
                      isPlayerPlaying={isPlayerPlaying}
                      onPlayTagRow={handlePlayTagRow}
                      onResetPlayback={handleResetTimelinePlayback}
                      onToggleTagSelection={handleToggleTagSelection}
                      playerDurationSeconds={playerDurationSeconds}
                      playerPlaybackRate={playerPlaybackRate}
                      playheadSeconds={timelinePanelPlayheadSeconds}
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
                      activePlaybackOverrideId={activePlaybackOverrideId}
                      allVisibleSelected={allVisibleSelected}
                      availableGroups={availableGroups}
                      clipThumbnailUrl={activeVideo?.thumbnail || mediaItem?.thumbnail || playbackItem?.thumbnail || ""}
                      effectiveGroupValue={effectiveGroupValue}
                      favoriteTagIds={favoriteTagIds}
                      isMediaLoading={isTagRowsLoading}
                      isExpanded={isExpandedListView}
                      isSearchOpen={isSearchOpen}
                      onToggleExpanded={() => setIsListExpanded((currentValue) => !currentValue)}
                      onCreatePlaylist={() => void handleCreateMatrixPlaylist(activePlaylistRows)}
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
                    />
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
