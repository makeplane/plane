"use client";

import { asRecord, buildArchivedStreamUrl, toText } from "@/components/issues/issue-detail/sg-event-detail-page/utils";
import type { TCustomPlaylistAnnotation } from "@/services/media-library.service";
import type { TMediaItem } from "ce/features/media-library/types/media-library.types";

type TSgEventAnnotationVideoOptions = {
  deviceId?: string | number | null;
  eventPayload?: Record<string, unknown> | null;
  streamId?: string | number | null;
  streamName?: string | null;
  title?: string | null;
  viewKey?: string | null;
  videoSrc?: string | null;
};

const EVENT_VIDEO_SOURCE_KEYS = [
  "hlsUrl",
  "hls_url",
  "playlistUrl",
  "playlist_url",
  "previewUrl",
  "preview_url",
  "videoUrl",
  "video_url",
  "sourceUrl",
  "source_url",
  "mediaUrl",
  "media_url",
  "url",
];

const EVENT_STREAM_NAME_KEYS = [
  "primaryStreamName",
  "primary_stream_name",
  "streamName",
  "stream_name",
  "originalStreamName",
  "original_stream_name",
];

const EVENT_DEVICE_COLLECTION_KEYS = ["devices", "mediaReferences", "media_references"];
const GENERIC_VIDEO_SOURCE_KEYS = new Set(["url"]);
const VIDEO_SOURCE_PATTERN = /\.(m3u8|mp4|m4v|mov|webm|avi|mkv|mpeg|mpg)(?:[?#]|$)|mpegurl|\/llhls\.m3u8(?:[?#]|$)/i;
const MEDIA_REFERENCE_COLLECTION_KEYS = ["mediaReferences", "media_references", "devices"];

const getFirstTextValue = (record: Record<string, unknown>, keys: string[]) => {
  for (const key of keys) {
    const value = toText(record[key]).trim();
    if (value) return value;
  }

  return "";
};

const getFirstVideoSourceValue = (record: Record<string, unknown>) => {
  for (const key of EVENT_VIDEO_SOURCE_KEYS) {
    const value = toText(record[key]).trim();
    if (!value) continue;
    if (!GENERIC_VIDEO_SOURCE_KEYS.has(key) || VIDEO_SOURCE_PATTERN.test(value)) return value;
  }

  return "";
};

const getNestedEventRecords = (item: TMediaItem) => {
  const meta = asRecord(item.meta);
  const event = asRecord(meta.event);
  const rawEvent = asRecord(meta.rawEvent ?? meta.raw_event);

  return [meta, event, rawEvent].filter((record) => Object.keys(record).length > 0);
};

const getEventDeviceRecords = (records: Record<string, unknown>[]) =>
  records.flatMap((record) =>
    EVENT_DEVICE_COLLECTION_KEYS.flatMap((key) => {
      const value = record[key];
      if (!Array.isArray(value)) return [];

      return value.map((entry) => asRecord(entry)).filter((entry) => Object.keys(entry).length > 0);
    })
  );

const resolveEventAnnotationVideoSrc = (item: TMediaItem, options: TSgEventAnnotationVideoOptions = {}) => {
  const optionVideoSrc = toText(options.videoSrc).trim();
  if (optionVideoSrc) return optionVideoSrc;

  const optionStreamUrl = buildArchivedStreamUrl(toText(options.streamName));
  if (optionStreamUrl) return optionStreamUrl;

  const eventRecords = getNestedEventRecords(item);
  const sourceRecords = [...eventRecords, ...getEventDeviceRecords(eventRecords)];

  for (const record of sourceRecords) {
    const directSource = getFirstVideoSourceValue(record);
    if (directSource) return directSource;
  }

  for (const record of sourceRecords) {
    const streamName = getFirstTextValue(record, EVENT_STREAM_NAME_KEYS);
    const streamUrl = buildArchivedStreamUrl(streamName);
    if (streamUrl) return streamUrl;
  }

  return "";
};

const resolveEventAnnotationVideoFormat = (videoSrc: string) => {
  const normalizedSrc = videoSrc.toLowerCase();
  if (normalizedSrc.includes(".m3u8") || normalizedSrc.includes("mpegurl") || normalizedSrc.includes("/llhls.m3u8")) {
    return "m3u8";
  }

  const pathWithoutQuery = normalizedSrc.split("?")[0].split("#")[0];
  const extension = pathWithoutQuery.split("/").pop()?.split(".").pop() ?? "";
  return extension || "m3u8";
};

const toAnnotationList = (value: unknown): TCustomPlaylistAnnotation[] | null =>
  Array.isArray(value) ? (value as TCustomPlaylistAnnotation[]) : null;

export const buildSgEventAnnotationViewKey = (options: TSgEventAnnotationVideoOptions = {}) => {
  const explicitViewKey = toText(options.viewKey).trim();
  if (explicitViewKey) return explicitViewKey;

  const streamName = toText(options.streamName).trim();
  if (streamName) return `stream:${streamName}`;

  const streamId = toText(options.streamId).trim();
  if (streamId) return `stream-id:${streamId}`;

  const deviceId = toText(options.deviceId).trim();
  if (deviceId) return `device:${deviceId}`;

  const videoSrc = toText(options.videoSrc).trim();
  if (videoSrc) return `video:${videoSrc}`;

  return "";
};

const getMediaReferenceCollections = (source: Record<string, unknown>) =>
  MEDIA_REFERENCE_COLLECTION_KEYS.flatMap((key) => {
    const value = source[key];
    return Array.isArray(value) ? value.map((entry) => asRecord(entry)) : [];
  }).filter((entry) => Object.keys(entry).length > 0);

const getMediaReferenceSources = (meta: Record<string, unknown>, options: TSgEventAnnotationVideoOptions = {}) => {
  const eventPayload = asRecord(options.eventPayload);
  const event = asRecord(meta.event);
  const rawEvent = asRecord(meta.rawEvent ?? meta.raw_event);

  return [eventPayload, meta, event, rawEvent].filter((record) => Object.keys(record).length > 0);
};

const getMediaReferenceScore = (reference: Record<string, unknown>, options: TSgEventAnnotationVideoOptions = {}) => {
  let score = 0;
  const streamId = toText(options.streamId).trim();
  const streamName = toText(options.streamName).trim();
  const deviceId = toText(options.deviceId).trim();
  const videoSrc = toText(options.videoSrc).trim().replace(/\/+$/, "");
  const viewKey = buildSgEventAnnotationViewKey(options);

  const referenceStreamId = toText(reference.streamId ?? reference.stream_id).trim();
  const referenceStreamName = toText(reference.streamName ?? reference.stream_name).trim();
  const referenceDeviceId = toText(reference.deviceId ?? reference.device_id ?? reference.activeDeviceId).trim();
  const referenceVideoSrc = toText(
    reference.hlsUrl ??
      reference.hls_url ??
      reference.previewUrl ??
      reference.preview_url ??
      reference.videoUrl ??
      reference.video_url ??
      reference.sourceUrl ??
      reference.source_url
  )
    .trim()
    .replace(/\/+$/, "");
  const referenceViewKeys = [
    buildSgEventAnnotationViewKey({
      deviceId: referenceDeviceId,
      streamId: referenceStreamId,
      streamName: referenceStreamName,
      videoSrc: referenceVideoSrc,
    }),
    toText(reference.annotationViewKey).trim(),
  ].filter(Boolean);

  if (viewKey && referenceViewKeys.includes(viewKey)) score += 16;
  if (streamId && referenceStreamId === streamId) score += 8;
  if (streamName && referenceStreamName === streamName) score += 6;
  if (deviceId && referenceDeviceId === deviceId) score += 4;
  if (videoSrc && referenceVideoSrc === videoSrc) score += 2;

  return score;
};

export const findSgEventMediaReference = (
  meta: Record<string, unknown>,
  options: TSgEventAnnotationVideoOptions = {}
): Record<string, unknown> | null => {
  const references = getMediaReferenceSources(meta, options).flatMap(getMediaReferenceCollections);
  let bestMatch: Record<string, unknown> | null = null;
  let bestScore = 0;

  references.forEach((reference) => {
    const score = getMediaReferenceScore(reference, options);
    if (score > bestScore) {
      bestMatch = reference;
      bestScore = score;
    }
  });

  return bestMatch;
};

export const getSgEventMediaReferenceAnnotations = (
  meta: Record<string, unknown>,
  options: TSgEventAnnotationVideoOptions = {}
) => {
  const reference = findSgEventMediaReference(meta, options);
  const referenceAnnotations = reference ? toAnnotationList(reference["annotations"]) : null;
  if (referenceAnnotations) return referenceAnnotations;

  return buildSgEventAnnotationViewKey(options) ? [] : (toAnnotationList(meta.annotations) ?? []);
};

export const buildSgEventAnnotationDisplayMeta = (
  meta: Record<string, unknown>,
  options: TSgEventAnnotationVideoOptions = {}
) => {
  const viewKey = buildSgEventAnnotationViewKey(options);
  if (!viewKey) return meta;

  const annotationVideoSource = toText(options.videoSrc).trim();
  const isHlsAnnotationVideo = annotationVideoSource
    ? resolveEventAnnotationVideoFormat(annotationVideoSource) === "m3u8"
    : false;

  return {
    ...meta,
    annotations: getSgEventMediaReferenceAnnotations(meta, options),
    annotationViewDeviceId: toText(options.deviceId).trim() || meta.annotationViewDeviceId,
    annotationViewKey: viewKey,
    annotationViewLabel: toText(options.title).trim() || meta.annotationViewLabel,
    annotationViewStreamId: toText(options.streamId).trim() || meta.annotationViewStreamId,
    annotationViewStreamName: toText(options.streamName).trim() || meta.annotationViewStreamName,
    annotationVideoSource: annotationVideoSource || meta.annotationVideoSource,
    hls: isHlsAnnotationVideo ? true : meta.hls,
    hls_direct: isHlsAnnotationVideo ? true : meta.hls_direct,
  };
};

export const buildSgEventAnnotationVideoItem = (
  item: TMediaItem | null | undefined,
  options: TSgEventAnnotationVideoOptions = {}
): TMediaItem | null => {
  if (!item?.packageId || !item.id) return null;
  if (item.mediaType === "video") {
    const optionVideoSrc = toText(options.videoSrc).trim() || buildArchivedStreamUrl(toText(options.streamName));
    if (optionVideoSrc) {
      const format = resolveEventAnnotationVideoFormat(optionVideoSrc);
      const isHls = format === "m3u8";
      const meta = asRecord(item.meta);
      const title = toText(options.title).trim() || item.title;

      return {
        ...item,
        action: isHls ? "play_streaming" : "play",
        downloadSrc: optionVideoSrc,
        fileSrc: optionVideoSrc,
        format,
        link: optionVideoSrc,
        linkedFormat: format,
        linkedMediaType: "video",
        mediaType: "video",
        meta: {
          ...buildSgEventAnnotationDisplayMeta(meta, {
            ...options,
            videoSrc: optionVideoSrc,
          }),
          hls: isHls ? true : meta.hls,
          hls_direct: isHls ? true : meta.hls_direct,
          annotationVideoSource: optionVideoSrc,
        },
        title,
        videoSrc: optionVideoSrc,
      };
    }

    return {
      ...item,
      meta: buildSgEventAnnotationDisplayMeta(item.meta ?? {}, options),
    };
  }

  const videoSrc = resolveEventAnnotationVideoSrc(item, options);
  if (!videoSrc) return null;

  const format = resolveEventAnnotationVideoFormat(videoSrc);
  const isHls = format === "m3u8";
  const meta = asRecord(item.meta);
  const title = toText(options.title).trim() || item.title;

  return {
    ...item,
    action: isHls ? "play_streaming" : "play",
    downloadSrc: videoSrc,
    fileSrc: videoSrc,
    format,
    link: videoSrc,
    linkedFormat: format,
    linkedMediaType: "video",
    mediaType: "video",
    meta: {
      ...buildSgEventAnnotationDisplayMeta(meta, options),
      hls: isHls ? true : meta.hls,
      hls_direct: isHls ? true : meta.hls_direct,
      annotationVideoSource: videoSrc,
    },
    title,
    videoSrc,
  };
};
