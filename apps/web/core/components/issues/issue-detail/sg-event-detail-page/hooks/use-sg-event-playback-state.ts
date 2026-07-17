import { useCallback, useEffect, useMemo, useState } from "react";
import type { MediaLibraryService } from "@/services/media-library.service";
import type { TMediaItem } from "ce/features/media-library/types/media-library.types";
import { getTimelinePanelInputPlayheadSeconds } from "../timeline-view";
import type { SgEventDevice, SgTagRow } from "../types";
import {
  buildArchivedPlaylistUrl,
  parseTimecodeToSeconds,
  playlistHasMediaSegments,
} from "../utils";

type UseSgEventPlaybackStateArgs = {
  mediaItem: TMediaItem | null;
  mediaLibraryService: MediaLibraryService;
  primaryStreamName: string;
  resolvedWorkItemId: string;
  videoItems: TMediaItem[] | undefined;
  viewDevices: SgEventDevice[];
};

export const useSgEventPlaybackState = ({
  mediaItem,
  mediaLibraryService,
  primaryStreamName,
  resolvedWorkItemId,
  videoItems,
  viewDevices,
}: UseSgEventPlaybackStateArgs) => {
  const [activeVideoId, setActiveVideoId] = useState<string>("");
  const [activePlaybackOverride, setActivePlaybackOverride] = useState<TMediaItem | null>(null);
  const [activeTimelineTagId, setActiveTimelineTagId] = useState<string | null>(null);
  const [pendingSeekSeconds, setPendingSeekSeconds] = useState<number | null>(null);
  const [playerLocalSeconds, setPlayerLocalSeconds] = useState(0);
  const [playerDurationSeconds, setPlayerDurationSeconds] = useState<number | null>(null);
  const [playheadBaseSeconds, setPlayheadBaseSeconds] = useState(0);
  const [selectedViewId, setSelectedViewId] = useState<string>("");

  useEffect(() => {
    const primaryVideo = videoItems?.[0];
    if (!primaryVideo) return;
    if (!activeVideoId || !videoItems?.some((item) => item.id === activeVideoId)) {
      setActiveVideoId(primaryVideo.id);
    }
  }, [activeVideoId, videoItems]);

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

  const activeVideo = videoItems?.find((item) => item.id === activeVideoId) ?? videoItems?.[0] ?? null;
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
  const activePlaybackOverrideId = activePlaybackOverride?.id ?? null;
  const isPlaybackOverrideActive = Boolean(activePlaybackOverride);
  const hasPlayableVideo = Boolean(playbackItem);
  const timelinePanelPlayheadSeconds = getTimelinePanelInputPlayheadSeconds({
    playbackOverrideId: activePlaybackOverrideId,
    playheadBaseSeconds,
    playerLocalSeconds,
  });

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
          setPlayerDurationSeconds(null);
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

  const clearActiveTimelineTag = useCallback((tagId: string) => {
    setActiveTimelineTagId((currentValue) => (currentValue === tagId ? null : currentValue));
  }, []);

  const playPlaybackOverride = useCallback((item: TMediaItem) => {
    setPendingSeekSeconds(null);
    setActivePlaybackOverride(item);
  }, []);

  return {
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
    isPlaybackOverrideActive,
    pendingSeekSeconds,
    playbackItem,
    playPlaybackOverride,
    playerDurationSeconds,
    selectedViewDevice,
    selectedViewId,
    selectedViewLabel,
    setSelectedViewId,
    timelinePanelPlayheadSeconds,
  };
};
