"use client";

import type { TMediaItem } from "../types/media-library.types";
import { formatDateValue, formatTimeValue, getMetaNumber, getMetaString } from "./media-detail-utils";

type TMediaEventSource = Pick<TMediaItem, "meta"> | Record<string, unknown> | null | undefined;

export type TStructuredEventTag = {
  action: string | null;
  label: string;
  quarter: string | null;
  result: string | null;
  team: string | null;
  timeRange: string | null;
  timestamp: string | null;
};

export type TEventMediaDetails = {
  deviceCount: number;
  eventDate: string | null;
  eventDateTime: string | null;
  eventTime: string | null;
  level: string | null;
  locationLabel: string | null;
  primaryStreamId: string | null;
  primaryStreamName: string | null;
  program: string | null;
  projectId: string | null;
  sport: string | null;
  status: string | null;
  structuredTags: TStructuredEventTag[];
  tagCount: number;
  title: string | null;
  workspaceSlug: string | null;
  year: string | null;
};

const toMetaRecord = (source: TMediaEventSource): Record<string, unknown> => {
  if (!source || typeof source !== "object") {
    return {};
  }

  if ("meta" in source) {
    const metaValue = source.meta;
    if (metaValue && typeof metaValue === "object" && !Array.isArray(metaValue)) {
      return metaValue as Record<string, unknown>;
    }
  }

  return source as Record<string, unknown>;
};

const toSourceRecord = (source: TMediaEventSource): Record<string, unknown> => {
  if (!source || typeof source !== "object") {
    return {};
  }

  return source as Record<string, unknown>;
};

const toOptionalText = (value: unknown) => {
  if (typeof value !== "string") {
    return null;
  }

  const normalizedValue = value.trim();
  return normalizedValue || null;
};

const isCoachCompletedEventArtifactSource = (source: TMediaEventSource) => {
  const meta = toMetaRecord(source);
  const sourceRecord = toSourceRecord(source);
  const sourceType = toOptionalText(meta.source);
  const format = toOptionalText(sourceRecord.format);
  const id = toOptionalText(sourceRecord.id);
  const title = toOptionalText(sourceRecord.title);

  return (
    sourceType === "plane-coach" &&
    format === "json" &&
    (Boolean(id?.startsWith("coach-event-")) || Boolean(title?.toLowerCase().includes("final event json")))
  );
};

const formatStatusLabel = (value: string | null) => {
  if (!value) return null;

  return value
    .trim()
    .replace(/[_-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const formatLooseTimeValue = (value: string | null) => {
  if (!value) return null;

  const formattedValue = formatTimeValue(value);
  return formattedValue !== "--" ? formattedValue : value;
};

const formatStructuredEventTagLabel = (value: unknown): string => {
  if (!Array.isArray(value)) return "";

  const tagEntries = value
    .map((entry) => {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
        return null;
      }

      const tagRecord = entry as Record<string, unknown>;
      const tagName = toOptionalText(tagRecord.tag);
      const tagValue = toOptionalText(tagRecord.value);

      if (!tagName && !tagValue) return null;
      if (tagName && tagValue) return `${tagName}: ${tagValue}`;
      return tagName || tagValue;
    })
    .filter((entry): entry is string => Boolean(entry));

  return tagEntries.join(", ");
};

export const getStructuredEventTags = (source: TMediaEventSource): TStructuredEventTag[] => {
  const meta = toMetaRecord(source);
  const rawTags = meta.tags;

  if (!Array.isArray(rawTags)) {
    return [];
  }

  return rawTags
    .map((entry) => {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
        return null;
      }

      const tagRecord = entry as Record<string, unknown>;
      const action = toOptionalText(tagRecord.action);
      const quarter = toOptionalText(tagRecord.quarter);
      const result = toOptionalText(tagRecord.result);
      const team = toOptionalText(tagRecord.team);
      const timeRange = toOptionalText(tagRecord.timeRange);
      const timestamp = toOptionalText(tagRecord.timestamp);
      const dataLabel = formatStructuredEventTagLabel(tagRecord.data);
      const label =
        [team, result, dataLabel || action, quarter, timeRange || timestamp]
          .filter((part): part is string => Boolean(part))
          .join(" · ") || action || "Event tag";

      return {
        action,
        label,
        quarter,
        result,
        team,
        timeRange,
        timestamp,
      } satisfies TStructuredEventTag;
    })
    .filter((entry): entry is TStructuredEventTag => Boolean(entry));
};

export const getEventMediaDetails = (source: TMediaEventSource): TEventMediaDetails | null => {
  const meta = toMetaRecord(source);
  const sourceRecord = toSourceRecord(source);
  const artifactType = toOptionalText(meta.artifact_type);
  const sourceType = toOptionalText(meta.source);
  const hasEventIdentifiers =
    Boolean(toOptionalText(meta.event_id)) || Boolean(toOptionalText(meta.plane_event_id));
  const isCoachCompletedEventArtifact = isCoachCompletedEventArtifactSource(source);

  if (
    artifactType !== "completed-event-json" &&
    !(sourceType === "plane-coach" && hasEventIdentifiers) &&
    !isCoachCompletedEventArtifact
  ) {
    return null;
  }

  const structuredTags = getStructuredEventTags(meta);
  const tagCount = getMetaNumber(meta, ["tag_count", "tagCount"]) ?? structuredTags.length;

  return {
    deviceCount: getMetaNumber(meta, ["device_count", "deviceCount"]) ?? 0,
    eventDate: toOptionalText(meta.event_date),
    eventDateTime: toOptionalText(meta.event_date_time),
    eventTime: toOptionalText(meta.event_time),
    level: getMetaString(meta, ["level"], "") || null,
    locationLabel: getMetaString(meta, ["location_label", "locationLabel"], "") || null,
    primaryStreamId: getMetaString(meta, ["primary_stream_id", "primaryStreamId"], "") || null,
    primaryStreamName: getMetaString(meta, ["primary_stream_name", "primaryStreamName"], "") || null,
    program: getMetaString(meta, ["program"], "") || null,
    projectId: getMetaString(meta, ["project_id", "projectId"], "") || null,
    sport: getMetaString(meta, ["sport"], "") || null,
    status: formatStatusLabel(getMetaString(meta, ["status"], "") || null),
    structuredTags,
    tagCount,
    title: getMetaString(meta, ["title"], "") || toOptionalText(sourceRecord.title),
    workspaceSlug: getMetaString(meta, ["workspace_slug", "workspaceSlug"], "") || null,
    year: getMetaString(meta, ["year", "season"], "") || null,
  };
};

export const isEventMediaItem = (source: TMediaEventSource) => Boolean(getEventMediaDetails(source));

export const getEventMediaDateLabel = (source: TMediaEventSource) => {
  const details = getEventMediaDetails(source);

  if (!details) return null;

  const dateSource = details.eventDateTime || details.eventDate;
  const timeSource = details.eventDateTime || details.eventTime;
  const dateLabel = dateSource ? formatDateValue(dateSource) : null;
  const timeLabel = timeSource ? formatLooseTimeValue(timeSource) : null;

  if (dateLabel && timeLabel) return `${dateLabel} · ${timeLabel}`;
  return dateLabel || timeLabel;
};

export const getEventMediaContextLabel = (source: TMediaEventSource) => {
  const details = getEventMediaDetails(source);

  if (!details) return null;

  const parts = [details.sport, details.program, details.level].filter(
    (entry): entry is string => Boolean(entry),
  );

  return parts.length > 0 ? parts.join(" · ") : null;
};

export const getEventMediaMetrics = (source: TMediaEventSource) => {
  const details = getEventMediaDetails(source);

  if (!details) return [];

  const metrics: string[] = [];

  if (details.tagCount > 0) {
    metrics.push(`${details.tagCount} tag${details.tagCount === 1 ? "" : "s"}`);
  }

  if (details.deviceCount > 0) {
    metrics.push(`${details.deviceCount} device${details.deviceCount === 1 ? "" : "s"}`);
  }

  if (details.primaryStreamName) {
    metrics.push(details.primaryStreamName);
  }

  return metrics;
};
