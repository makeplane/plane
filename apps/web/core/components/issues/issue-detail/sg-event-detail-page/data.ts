import type { MediaLibraryService } from "@/services/media-library.service";
import type { TMediaItem } from "ce/features/media-library/types/media-library.types";
import { getEventMediaDetails } from "ce/features/media-library/utils/media-event";
import { mapArtifactsToMediaItems } from "ce/features/media-library/utils/media-items";
import type { SgEventDevice, SgMediaPayload } from "./types";
import {
  asArray,
  asRecord,
  buildArchivedStreamUrl,
  isCoachCompletedEventJsonItem,
  parseGatewayRows,
  toNumber,
  toText,
} from "./utils";

const fetchEventJsonPayload = async (item: TMediaItem | null): Promise<Record<string, unknown> | null> => {
  if (!isCoachCompletedEventJsonItem(item)) {
    return null;
  }

  const sourceUrl = item?.fileSrc || item?.downloadSrc || "";
  if (!sourceUrl) {
    return null;
  }

  for (const credentials of ["include", "omit"] as const) {
    try {
      const response = await fetch(sourceUrl, { credentials });
      if (!response.ok) {
        continue;
      }

      const payload = (await response.json().catch(() => null)) as unknown;
      const record = asRecord(payload);
      if (Object.keys(record).length > 0) {
        return record;
      }
    } catch {
      continue;
    }
  }

  return null;
};

export const fetchSgEventDevices = async (cpServerBaseUrl: string, sgEventId: string): Promise<SgEventDevice[]> => {
  const response = await fetch(`${cpServerBaseUrl}/event-device?event_id=${encodeURIComponent(sgEventId)}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    return [];
  }

  const payload = (await response.json().catch(() => null)) as Record<string, unknown> | null;

  return parseGatewayRows(payload)
    .map((row) => {
      const id = toNumber(row.id);
      const streamName = toText(row.stream_name ?? row.streamName);

      if (id === null || !streamName) {
        return null;
      }

      const name = toText(row.name);

      return {
        hlsUrl: buildArchivedStreamUrl(streamName),
        id,
        name: name || `View ${id}`,
        streamName,
      } satisfies SgEventDevice;
    })
    .filter((device): device is SgEventDevice => Boolean(device))
    .sort((left, right) => left.id - right.id);
};

export const buildEventPayloadDevices = (payload: Record<string, unknown> | null): SgEventDevice[] => {
  const root = asRecord(payload);
  const deviceEntries = [...asArray(root.devices), ...asArray(root.mediaReferences)];
  const seenKeys = new Set<string>();

  return deviceEntries
    .map((entry, index) => {
      const record = asRecord(entry);
      const streamName = toText(record.streamName ?? record.stream_name);
      const previewUrl = toText(record.previewUrl ?? record.preview_url);

      if (!streamName && !previewUrl) {
        return null;
      }

      const id = toNumber(record.activeDeviceId ?? record.deviceId ?? record.device_id) ?? index + 1;
      const name = toText(record.name ?? record.appName ?? record.app_name) || `View ${Math.max(index + 1, 1)}`;
      const hlsUrl = buildArchivedStreamUrl(streamName) || previewUrl || null;
      const dedupeKey = streamName || previewUrl;

      if (!dedupeKey || seenKeys.has(dedupeKey)) {
        return null;
      }
      seenKeys.add(dedupeKey);

      return {
        hlsUrl,
        id,
        name,
        streamName,
      } satisfies SgEventDevice;
    })
    .filter((device): device is SgEventDevice => Boolean(device))
    .sort((left, right) => left.id - right.id);
};

export const loadSgMediaPayload = async (
  workspaceSlug: string,
  projectId: string,
  issueId: string,
  mediaItem: TMediaItem | null,
  mediaLibraryService: MediaLibraryService
): Promise<SgMediaPayload> => {
  const manifest = await mediaLibraryService.ensureProjectLibrary(workspaceSlug, projectId);
  const packageId = typeof manifest?.id === "string" ? manifest.id : "";
  const manifestArtifacts = Array.isArray(manifest?.artifacts) ? manifest.artifacts : [];
  const metadata =
    manifest && typeof manifest === "object" && manifest.metadata && typeof manifest.metadata === "object"
      ? (manifest.metadata as Record<string, Record<string, unknown>>)
      : undefined;

  if (!packageId || manifestArtifacts.length === 0) {
    return {
      eventDetails: null,
      eventPayload: null,
      eventItem: null,
      mediaItems: [],
      videoItems: [],
    };
  }

  const mediaItems = mapArtifactsToMediaItems(manifestArtifacts, {
    metadata,
    packageId,
    projectId,
    workspaceSlug,
  }).filter((item) => item.format !== "thumbnail");

  const relatedEventIdentifiers = new Set(
    [mediaItem?.meta, mediaItem]
      .flatMap((source) => {
        const record = asRecord(source);
        return [
          toText(record.sg_event_id),
          toText(record.event_id),
          toText(record.plane_event_id),
          toText(record.eventId),
          toText(record.planeEventId),
        ];
      })
      .map((value) => value.trim())
      .filter(Boolean)
  );

  const scopedItems = mediaItems.filter((candidate) => {
    if (issueId && candidate.workItemId === issueId) return true;
    if (relatedEventIdentifiers.size === 0) return false;
    const candidateMeta = asRecord(candidate.meta);
    const candidateIdentifiers = [
      toText(candidateMeta.sg_event_id),
      toText(candidateMeta.event_id),
      toText(candidateMeta.plane_event_id),
      toText(candidateMeta.eventId),
      toText(candidateMeta.planeEventId),
    ]
      .map((value) => value.trim())
      .filter(Boolean);

    return candidateIdentifiers.some((identifier) => relatedEventIdentifiers.has(identifier));
  });

  const filteredItems =
    scopedItems.length > 0 ? scopedItems : issueId ? mediaItems.filter((candidate) => candidate.workItemId === issueId) : mediaItems;
  const eventItem =
    filteredItems.find((candidate) => candidate.id === mediaItem?.id) ??
    filteredItems.find((candidate) => isCoachCompletedEventJsonItem(candidate)) ??
    filteredItems.find((candidate) => Boolean(getEventMediaDetails(candidate))) ??
    mediaItem ??
    null;
  const videoItems = filteredItems.filter((candidate) => candidate.mediaType === "video");
  const eventPayload = await fetchEventJsonPayload(eventItem);

  return {
    eventDetails: eventItem ? getEventMediaDetails(eventItem) : null,
    eventPayload,
    eventItem,
    mediaItems: filteredItems,
    videoItems,
  };
};
