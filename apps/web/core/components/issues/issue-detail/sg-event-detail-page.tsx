"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import videojs from "video.js";
// import "video.js/dist/video-js.css";
import {
  Aperture,
  ArrowLeft,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronRight,
  Filter,
  LayoutGrid,
  List,
  MapPin,
  Mic,
  Plus,
  Search,
  Settings2,
  SlidersHorizontal,
  Star,
  Trash2,
  Trophy,
} from "lucide-react";
import { EPillSize, EPillVariant, Pill } from "@plane/propel/pill";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { Tooltip } from "@plane/propel/tooltip";
import type { TIssue } from "@plane/types";
import { Collapsible, CustomSelect } from "@plane/ui";
import { cn } from "@plane/utils";
import { parseOppositionTeam } from "@/helpers/opposition-team";
import { useProject } from "@/hooks/store/use-project";
import { useAppRouter } from "@/hooks/use-app-router";
import { MediaLibraryService } from "@/services/media-library.service";
import { buildSourceCandidates } from "@/components/issues/peek-overview/webhook-utils/webhook-artifacts-utils";
import { useResolvedMediaSources } from "ce/features/media-library/hooks/media-detail-hooks";
import type { TMediaItem } from "ce/features/media-library/types/media-library.types";
import { formatDateValue, formatTimeValue } from "ce/features/media-library/utils/media-detail-utils";
import { getEventMediaDetails } from "ce/features/media-library/utils/media-event";
import type { TEventMediaDetails } from "ce/features/media-library/utils/media-event";
import { mapArtifactsToMediaItems } from "ce/features/media-library/utils/media-items";

const SG_PLAYER_STYLE = `
  .sg-event-player .video-js {
    width: 100%;
    height: 100%;
    background: #0f1014;
    border-radius: 10px;
    overflow: hidden;
  }
  .sg-event-player .video-js .vjs-tech {
    object-fit: contain;
    background: #05060a;
  }
  .sg-event-player .video-js .vjs-big-play-button {
    display: none;
  }
  .sg-event-player .video-js .vjs-control-bar {
    display: flex;
    align-items: center;
    gap: 6px;
    height: 48px;
    padding: 0 12px;
    background: linear-gradient(180deg, rgba(12, 13, 17, 0) 0%, rgba(12, 13, 17, 0.78) 55%, rgba(12, 13, 17, 0.94) 100%);
    inset-inline: 0;
    bottom: 0;
  }
  .sg-event-player .video-js .vjs-control,
  .sg-event-player .video-js .vjs-time-control {
    color: #ffffff;
    font-size: 11px;
  }
  .sg-event-player .video-js .vjs-current-time,
  .sg-event-player .video-js .vjs-duration {
    min-width: 52px;
  }
  .sg-event-player .video-js .vjs-progress-control {
    flex: 1;
  }
  .sg-event-player .video-js .vjs-progress-holder,
  .sg-event-player .video-js .vjs-volume-bar {
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.18);
  }
  .sg-event-player .video-js .vjs-slider-horizontal {
    height: 4px;
  }
  .sg-event-player .video-js .vjs-play-progress,
  .sg-event-player .video-js .vjs-volume-level {
    border-radius: 999px;
    background: #ffffff;
  }
  .sg-event-player .video-js .vjs-play-progress:before,
  .sg-event-player .video-js .vjs-volume-level:before {
    display: none;
  }
  .sg-event-player .video-js .vjs-skip-backward-button .vjs-icon-placeholder:before,
  .sg-event-player .video-js .vjs-skip-forward-button .vjs-icon-placeholder:before,
  .sg-event-player .video-js .vjs-settings-button .vjs-icon-placeholder:before {
    content: "";
  }
  .sg-event-player .video-js .vjs-skip-backward-button .vjs-icon-placeholder,
  .sg-event-player .video-js .vjs-skip-forward-button .vjs-icon-placeholder,
  .sg-event-player .video-js .vjs-settings-button .vjs-icon-placeholder {
    display: block;
    width: 16px;
    height: 16px;
    background-position: center;
    background-repeat: no-repeat;
    background-size: contain;
  }
  .sg-event-player .video-js .vjs-skip-backward-button .vjs-icon-placeholder {
    background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'><path d='m11 17-5-5 5-5'/><path d='m18 17-5-5 5-5'/></svg>");
  }
  .sg-event-player .video-js .vjs-skip-forward-button .vjs-icon-placeholder {
    background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'><path d='m13 17 5-5-5-5'/><path d='m6 17 5-5-5-5'/></svg>");
  }
  .sg-event-player .video-js .vjs-settings-button .vjs-icon-placeholder {
    background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='1.7' stroke-linecap='round' stroke-linejoin='round'><circle cx='12' cy='12' r='3'/><path d='M19.4 15a1.7 1.7 0 0 0 .34 1.87l.09.09a2.1 2.1 0 1 1-2.97 2.97l-.09-.09A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 1.55V21a2.1 2.1 0 1 1-4.2 0v-.05a1.7 1.7 0 0 0-1-1.55 1.7 1.7 0 0 0-1.83.44l-.09.09a2.1 2.1 0 1 1-2.97-2.97l.09-.09A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.55-1H3a2.1 2.1 0 1 1 0-4.2h.05A1.7 1.7 0 0 0 4.6 8a1.7 1.7 0 0 0-.44-1.83l-.09-.09A2.1 2.1 0 1 1 6.99 3.1l.09.09A1.7 1.7 0 0 0 8.9 3.6a1.7 1.7 0 0 0 1-1.55V2a2.1 2.1 0 1 1 4.2 0v.05a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.83-.44l.09-.09A2.1 2.1 0 1 1 20.9 6.08l-.09.09A1.7 1.7 0 0 0 19.4 8c0 .7.42 1.34 1.05 1.55H21a2.1 2.1 0 1 1 0 4.2h-.05A1.7 1.7 0 0 0 19.4 15Z'/></svg>");
  }
`;

const QUARTER_OPTIONS = ["Quarter 1", "Quarter 2", "Quarter 3", "Quarter 4"] as const;
const SURFACE_CLASS = "rounded-xl border border-custom-border-200 ";
const ICON_BUTTON_CLASS =
  "inline-flex h-9 w-9 items-center justify-center rounded-lg border border-custom-border-200 bg-custom-background-100 text-custom-text-300 transition-colors hover:bg-custom-background-90 hover:text-custom-text-100";
const ACTION_BUTTON_CLASS =
  "inline-flex h-9 items-center gap-2 rounded-lg border border-custom-border-200 bg-custom-background-100 px-3 text-sm text-custom-text-100 transition-colors hover:bg-custom-background-90";
const PLAYER_FRAME_CLASS =
  "h-[clamp(220px,38vh,420px)] sm:h-[clamp(260px,42vh,500px)] xl:h-[min(44vh,32rem)]";
const PLAYER_STAGE_CLASS = "mx-auto h-full w-full max-w-full overflow-hidden rounded-xl xl:w-auto xl:aspect-video";
const TAG_TABLE_GRID_CLASS =
  "grid-cols-[64px_minmax(150px,1.2fr)_minmax(120px,0.95fr)_minmax(90px,0.8fr)_minmax(160px,1.25fr)_minmax(110px,0.9fr)_minmax(90px,0.75fr)_104px]";
type SgIssue = TIssue & { sg_event_id?: string | number | null };

type SgEventDetailPageProps = {
  projectId: string;
  workspaceSlug: string;
  issue?: TIssue;
  mediaItem?: TMediaItem | null;
  fallbackBackHref?: string;
  onBack?: () => void;
};

type SgTagRow = {
  id: string;
  player: string;
  primaryAction: string;
  quarter: string;
  result: string;
  team: string;
  timecode: string;
  yard: string;
};

type SgPlaylistItem = {
  id: string;
  subtitle: string;
  title: string;
};

type SgEventDevice = {
  hlsUrl: string | null;
  id: number;
  name: string;
  streamName: string;
};

type SgMediaPayload = {
  eventDetails: TEventMediaDetails | null;
  eventItem: TMediaItem | null;
  mediaItems: TMediaItem[];
  videoItems: TMediaItem[];
};

const asArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};

const getCpServerBaseUrl = () => process.env.NEXT_PUBLIC_CP_SERVER_URL?.replace(/\/$/, "") ?? "";

const getArchivedHlsBaseUrl = () => {
  const explicitBaseUrl = process.env.NEXT_PUBLIC_HLS_SERVER_URL?.trim() || "";
  if (explicitBaseUrl) {
    return explicitBaseUrl.replace(/\/$/, "");
  }

  return "http://drake.in:59919";
};

const toText = (value: unknown): string => {
  if (typeof value === "string") {
    const normalizedValue = value.trim();
    return normalizedValue || "";
  }
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) {
    return value
      .map((entry): string => toText(entry))
      .filter(Boolean)
      .join(", ");
  }
  if (value && typeof value === "object" && "name" in (value as Record<string, unknown>)) {
    return toText((value as Record<string, unknown>).name);
  }
  return "";
};

const toNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsedValue = Number(value);
    return Number.isFinite(parsedValue) ? parsedValue : null;
  }
  return null;
};

type GatewayField = {
  field?: unknown;
  type?: unknown;
  value?: unknown;
};

const isGatewayField = (value: unknown): value is GatewayField =>
  Boolean(value) && typeof value === "object" && ("field" in (value as GatewayField) || "value" in (value as GatewayField));

const demodulateGatewayValue = (value: unknown, type: unknown): unknown => {
  if (Number(type) === 6 && Array.isArray(value)) {
    return value.map((entry) => demodulateGatewayEntry(entry));
  }

  return value;
};

const demodulateGatewayEntry = (entry: unknown): Record<string, unknown> => {
  if (Array.isArray(entry) && entry.every(isGatewayField)) {
    return entry.reduce<Record<string, unknown>>((accumulator, field) => {
      const fieldName = typeof field.field === "string" ? field.field : "";
      if (!fieldName) return accumulator;

      accumulator[fieldName] = demodulateGatewayValue(field.value, field.type);
      return accumulator;
    }, {});
  }

  return asRecord(entry);
};

const parseGatewayRows = (payload: unknown): Record<string, unknown>[] => {
  if (Array.isArray(payload)) {
    return payload
      .map((entry) => demodulateGatewayEntry(entry))
      .filter((entry) => Object.keys(entry).length > 0);
  }

  const gatewayResponse = asRecord(payload)["Gateway Response"];
  const result = asRecord(gatewayResponse).result;
  const rows = Array.isArray(result) ? result : [];

  return rows
    .map((entry) => demodulateGatewayEntry(entry))
    .filter((entry) => Object.keys(entry).length > 0);
};

const buildArchivedStreamUrl = (streamName: string) => {
  const normalizedStreamName = streamName.trim().replace(/^\/+|\/+$/g, "");
  if (!normalizedStreamName) return null;

  return `${getArchivedHlsBaseUrl()}/${normalizedStreamName}/llhls.m3u8`;
};

const formatLooseLabel = (value: string) =>
  value
    .replace(/[_-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");

const pickText = (sources: Array<Record<string, unknown> | null | undefined>, keys: string[]) => {
  for (const source of sources) {
    if (!source) continue;
    for (const key of keys) {
      const value = toText(source[key]);
      if (value) return value;
    }
  }
  return "";
};

const pickArray = (sources: Array<Record<string, unknown> | null | undefined>, keys: string[]) => {
  for (const source of sources) {
    if (!source) continue;
    for (const key of keys) {
      const value = source[key];
      if (Array.isArray(value)) return value;
    }
  }
  return [];
};

const normalizeQuarter = (value: string) => {
  const normalizedValue = value.trim().toLowerCase();
  const match = normalizedValue.match(/(\d+)/);
  if (match?.[1]) return `Quarter ${match[1]}`;
  if (normalizedValue.startsWith("q")) return `Quarter ${normalizedValue.slice(1)}`;
  return formatLooseLabel(value) || "Quarter 1";
};

const buildTimecode = (tag: Record<string, unknown>) => {
  const directTimecode = toText(
    tag.timecode ??
      tag.time_code ??
      tag.timeRange ??
      tag.time_range ??
      tag.video_timecode ??
      tag.videoTimecode
  );
  if (directTimecode) return directTimecode;

  const start = toText(tag.start ?? tag.clip_start ?? tag.video_timecode_clip_start ?? tag.start_timecode);
  const end = toText(tag.end ?? tag.clip_end ?? tag.video_timecode_clip_end ?? tag.end_timecode);
  if (start && end) return `${start}-${end}`;
  return start || end || "--";
};

const findTagDataValue = (tag: Record<string, unknown>, names: string[]) => {
  for (const name of names) {
    const directValue = toText(tag[name]);
    if (directValue) return directValue;
  }

  const dataEntries = asArray(tag.data);
  for (const entry of dataEntries) {
    const entryRecord = asRecord(entry);
    const tagName = toText(entryRecord.tag).toLowerCase().replace(/\s+/g, "_");
    const match = names.some((name) => tagName === name || tagName.includes(name));
    if (!match) continue;
    const tagValue = toText(entryRecord.value);
    if (tagValue) return tagValue;
  }

  return "";
};

const formatYardValue = (value: string) => {
  if (!value) return "--";
  const numericValue = Number(value);
  if (Number.isFinite(numericValue)) {
    const sign = numericValue > 0 ? "+" : "";
    return `${sign}${numericValue.toString().padStart(numericValue >= 0 ? 2 : 0, "0")} Yard`;
  }
  return formatLooseLabel(value);
};

const normalizeTagRows = (payload: Record<string, unknown> | null, eventDetails: TEventMediaDetails | null) => {
  const root = payload ? asRecord(payload) : null;
  const nestedEvent = root ? asRecord(root.event) : null;
  const rawTags = pickArray([root, nestedEvent], ["tags", "event_tags", "eventTags"]);

  if (rawTags.length > 0) {
    return rawTags
      .map((entry, index) => {
        const tag = asRecord(entry);
        const player = findTagDataValue(tag, ["player", "players", "athlete", "athletes", "jersey"]);
        const primaryAction =
          findTagDataValue(tag, ["primary_action", "action", "event_code", "event"]) ||
          formatLooseLabel(toText(tag.action || tag.event_code));
        const result =
          findTagDataValue(tag, ["result", "outcome", "gain", "play_result"]) ||
          formatLooseLabel(toText(tag.result || tag.outcome));
        const team =
          findTagDataValue(tag, ["team", "unit", "side"]) || formatLooseLabel(toText(tag.team || tag.unit));
        const yard = formatYardValue(
          findTagDataValue(tag, ["yard", "yards", "yards_gained", "gain_yards"]) || toText(tag.yard || tag.yards)
        );
        const quarter = normalizeQuarter(
          toText(tag.quarter || tag.period || tag.phase || tag.segment || tag.group || "Quarter 1")
        );

        return {
          id: `${quarter}-${primaryAction || "tag"}-${index}`,
          player: player || "--",
          primaryAction: primaryAction || "--",
          quarter,
          result: result || "--",
          team: team || "--",
          timecode: buildTimecode(tag),
          yard,
        } satisfies SgTagRow;
      })
      .filter((row) => row.primaryAction !== "--" || row.player !== "--" || row.timecode !== "--");
  }

  return (eventDetails?.structuredTags ?? []).map((tag, index) => ({
    id: `${tag.quarter || "Quarter 1"}-${tag.action || "tag"}-${index}`,
    player: "--",
    primaryAction: tag.action ? formatLooseLabel(tag.action) : tag.label,
    quarter: normalizeQuarter(tag.quarter || "Quarter 1"),
    result: tag.result ? formatLooseLabel(tag.result) : "--",
    team: tag.team ? formatLooseLabel(tag.team) : "--",
    timecode: tag.timeRange || tag.timestamp || "--",
    yard: "--",
  }));
};

const formatLongDateTime = (dateValue: string, timeValue: string) => {
  const combinedValue = [dateValue, timeValue].filter(Boolean).join(" ").trim();
  const parsedValue = combinedValue || dateValue || timeValue;
  if (!parsedValue) return "--";

  const parsed = Date.parse(parsedValue);
  if (Number.isNaN(parsed)) {
    if (dateValue && timeValue) return `${formatDateValue(dateValue)}, ${formatTimeValue(timeValue)}`;
    return formatDateValue(parsedValue);
  }

  return new Date(parsed).toLocaleString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const fetchSgEventDevices = async (cpServerBaseUrl: string, sgEventId: string): Promise<SgEventDevice[]> => {
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

const loadSgMediaPayload = async (
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
    filteredItems.find((candidate) => Boolean(getEventMediaDetails(candidate))) ??
    mediaItem ??
    null;
  const videoItems = filteredItems.filter((candidate) => candidate.mediaType === "video");

  return {
    eventDetails: eventItem ? getEventMediaDetails(eventItem) : null,
    eventItem,
    mediaItems: filteredItems,
    videoItems,
  };
};

const buildEventTitle = ({
  eventDetails,
  issue,
  payload,
  projectName,
}: {
  eventDetails: TEventMediaDetails | null;
  issue: TIssue;
  payload: Record<string, unknown> | null;
  projectName: string;
}) => {
  const titleSources = [asRecord(payload), asRecord(asRecord(payload).event)];
  const directTitle = pickText(titleSources, ["title", "name", "event_name"]);
  if (directTitle) return directTitle;
  if (eventDetails?.title) return eventDetails.title;

  const oppositionName = parseOppositionTeam(issue.opposition_team)?.name || "";
  if (projectName && oppositionName) return `${projectName} vs ${oppositionName}`;

  return issue.name || "SG Event";
};

const SgEventVideoPlayer = ({
  item,
  compactEmpty = false,
}: {
  item: TMediaItem | null;
  compactEmpty?: boolean;
}) => {
  const normalizedAction = (item?.action ?? "").toLowerCase();
  const documentFormat = (item?.format ?? "").toLowerCase();
  const meta = (item?.meta ?? {}) as Record<string, unknown>;
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const playerRef = useRef<ReturnType<typeof videojs> | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const {
    effectiveVideoSrc,
    isVideo,
    resolvedVideoFormat,
    useCredentials,
    crossOrigin,
    videoDownloadSrc,
  } = useResolvedMediaSources({
    documentFormat,
    item,
    meta,
    normalizedAction,
  });

  useEffect(() => {
    if (!isVideo || !videoRef.current) {
      if (playerRef.current) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
      return;
    }

    if (!playerRef.current) {
      const skipBackButtonName = "SgSkipBackButton";
      const skipForwardButtonName = "SgSkipForwardButton";
      const settingsButtonName = "SgSettingsButton";

      if (!videojs.getComponent(skipBackButtonName)) {
        const Button = videojs.getComponent("Button");
        // video.js exposes component classes through an untyped registry API.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const SkipBackButton = class extends (Button as any) {
          constructor(playerInstance: unknown, options: unknown) {
            super(playerInstance, options);
            this.controlText("Skip backward 10 seconds");
            this.addClass("vjs-skip-backward-button");
          }

          handleClick() {
            const player = this.player();
            const currentTime = Number(player?.currentTime?.() ?? 0);
            player?.currentTime?.(Math.max(0, currentTime - 10));
          }
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        videojs.registerComponent(skipBackButtonName, SkipBackButton as any);
      }

      if (!videojs.getComponent(skipForwardButtonName)) {
        const Button = videojs.getComponent("Button");
        // video.js exposes component classes through an untyped registry API.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const SkipForwardButton = class extends (Button as any) {
          constructor(playerInstance: unknown, options: unknown) {
            super(playerInstance, options);
            this.controlText("Skip forward 10 seconds");
            this.addClass("vjs-skip-forward-button");
          }

          handleClick() {
            const player = this.player();
            const currentTime = Number(player?.currentTime?.() ?? 0);
            const duration = Number(player?.duration?.() ?? 0);
            const nextTime = duration > 0 ? Math.min(duration, currentTime + 10) : currentTime + 10;
            player?.currentTime?.(nextTime);
          }
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        videojs.registerComponent(skipForwardButtonName, SkipForwardButton as any);
      }

      if (!videojs.getComponent(settingsButtonName)) {
        const Button = videojs.getComponent("Button");
        // video.js exposes component classes through an untyped registry API.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const SettingsButton = class extends (Button as any) {
          constructor(playerInstance: unknown, options: unknown) {
            super(playerInstance, options);
            this.controlText("Player settings");
            this.addClass("vjs-settings-button");
          }

          handleClick() {
            const player = this.player();
            player?.trigger?.("sgsettingstoggle");
          }
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        videojs.registerComponent(settingsButtonName, SettingsButton as any);
      }

      playerRef.current = videojs(videoRef.current, {
        autoplay: false,
        controls: true,
        crossOrigin,
        fluid: false,
        html5: {
          nativeAudioTracks: false,
          nativeVideoTracks: false,
          nativeTextTracks: false,
          vhs: {
            overrideNative: true,
            withCredentials: useCredentials,
          },
        },
        muted: false,
        playbackRates: [0.5, 0.75, 1, 1.25, 1.5, 2],
        playsinline: true,
        preload: "auto",
        responsive: true,
        controlBar: {
          children: [
            "currentTimeDisplay",
            "progressControl",
            "durationDisplay",
            skipBackButtonName,
            "playToggle",
            skipForwardButtonName,
            "volumePanel",
            "fullscreenToggle",
            settingsButtonName,
          ],
        },
      });

      playerRef.current.on("ratechange", () => {
        setPlaybackRate(Number(playerRef.current?.playbackRate?.() ?? 1));
      });
      playerRef.current.on("sgsettingstoggle", () => {
        setIsSettingsOpen((currentValue) => !currentValue);
      });
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, [crossOrigin, isVideo, useCredentials]);

  useEffect(() => {
    if (!playerRef.current || !effectiveVideoSrc) return;
    const player = playerRef.current;
    const type =
      resolvedVideoFormat === "m3u8"
        ? "application/x-mpegURL"
        : resolvedVideoFormat === "mp4"
          ? "video/mp4"
          : undefined;
    const rawSource =
      (typeof item?.videoSrc === "string" && item.videoSrc.trim()) ||
      (typeof item?.fileSrc === "string" && item.fileSrc.trim()) ||
      effectiveVideoSrc;
    const sourceCandidates =
      resolvedVideoFormat === "m3u8"
        ? buildSourceCandidates(rawSource, true, resolvedVideoFormat)
        : [
            {
              crossOrigin,
              src: effectiveVideoSrc,
              type,
              withCredentials: useCredentials,
            },
          ];
    let candidateIndex = 0;
    let startupTimer: ReturnType<typeof setTimeout> | null = null;

    const clearStartupTimer = () => {
      if (startupTimer) {
        clearTimeout(startupTimer);
        startupTimer = null;
      }
    };

    const handleLoadedData = () => {
      clearStartupTimer();
    };

    const applyCandidate = (nextIndex: number) => {
      const candidate = sourceCandidates[nextIndex];

      if (!candidate) {
        return;
      }

      const techElement = player.el()?.querySelector("video");
      if (techElement instanceof HTMLVideoElement) {
        if (candidate.crossOrigin) {
          techElement.crossOrigin = candidate.crossOrigin;
        } else {
          techElement.removeAttribute("crossorigin");
        }
      }

      player.src(candidate.type ? { src: candidate.src, type: candidate.type } : { src: candidate.src });
      player.poster(item?.thumbnail ?? "");
      player.load();

      const playAttempt = player.play();
      if (playAttempt && typeof playAttempt.catch === "function") {
        void playAttempt.catch(() => {
          // Ignore autoplay failures and let the user start playback manually.
        });
      }

      clearStartupTimer();
      startupTimer = setTimeout(() => {
        const readyState = Number(player.readyState?.() ?? 0);
        const seekable = Number(player.seekable?.().length ?? 0);
        const buffered = Number(player.buffered?.().length ?? 0);
        const duration = Number(player.duration?.() ?? 0);
        const hasStarted =
          readyState >= 1 ||
          seekable > 0 ||
          buffered > 0 ||
          (Number.isFinite(duration) && duration > 0);

        if (!hasStarted) {
          handlePlayerError();
        }
      }, 8000);
    };

    const handlePlayerError = () => {
      clearStartupTimer();
      const nextIndex = candidateIndex + 1;

      if (nextIndex >= sourceCandidates.length) {
        return;
      }

      candidateIndex = nextIndex;
      applyCandidate(candidateIndex);
    };

    player.on("error", handlePlayerError);
    player.on("loadeddata", handleLoadedData);
    applyCandidate(candidateIndex);

    return () => {
      clearStartupTimer();
      player.off("error", handlePlayerError);
      player.off("loadeddata", handleLoadedData);
    };
  }, [crossOrigin, effectiveVideoSrc, item?.fileSrc, item?.thumbnail, item?.videoSrc, resolvedVideoFormat, useCredentials]);

  if (!item || !isVideo) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-xl border border-custom-border-200 bg-custom-background-90 text-sm text-custom-text-300",
          compactEmpty ? "min-h-[180px] px-6 py-8 lg:min-h-[220px]" : `${PLAYER_FRAME_CLASS} px-6 py-8`
        )}
      >
        <div className="flex max-w-md flex-col items-center text-center">
          <div className="text-sm font-medium text-custom-text-200">No SG video available</div>
          <div className="mt-1 text-xs text-custom-text-400">
            This event has metadata and tags, but no playable video source is linked yet.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-xl border border-custom-border-200 bg-custom-background-90 p-2 shadow-sm sm:p-3",
        PLAYER_FRAME_CLASS
      )}
    >
      <div className={cn("sg-event-player relative", PLAYER_STAGE_CLASS)}>
        <style jsx global>{SG_PLAYER_STYLE}</style>
        <video ref={videoRef} className="video-js vjs-big-play-centered" playsInline />
        {isSettingsOpen && (
          <div className="absolute bottom-14 right-3 z-10 w-44 rounded-xl border border-custom-border-200 bg-custom-sidebar-background-100 p-3 shadow-2xl">
            <div className="mb-2 text-[11px] uppercase tracking-[0.18em] text-custom-text-400">Playback</div>
            <div className="grid grid-cols-3 gap-2">
              {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                <button
                  key={rate}
                  type="button"
                  onClick={() => {
                    playerRef.current?.playbackRate?.(rate);
                    setPlaybackRate(rate);
                  }}
                  className={cn(
                    "rounded-md border px-2 py-1 text-xs transition-colors",
                    playbackRate === rate
                      ? "border-custom-primary-100/30 bg-custom-primary-100/15 text-custom-primary-100"
                      : "border-custom-border-200 bg-custom-background-80 text-custom-text-300 hover:text-custom-text-100"
                  )}
                >
                  {rate}x
                </button>
              ))}
            </div>
            {videoDownloadSrc && (
              <Link
                href={videoDownloadSrc}
                target="_blank"
                rel="noreferrer"
                className="mt-3 block rounded-md border border-custom-border-200 bg-custom-background-80 px-3 py-2 text-center text-xs text-custom-text-100 transition-colors hover:bg-custom-background-90"
              >
                Open source
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
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
  const [selectedQuarter, setSelectedQuarter] = useState<string>("Quarter 1");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [favoriteTagIds, setFavoriteTagIds] = useState<string[]>([]);
  const [removedTagIds, setRemovedTagIds] = useState<string[]>([]);
  const [playlistItems, setPlaylistItems] = useState<SgPlaylistItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [closedQuarters, setClosedQuarters] = useState<string[]>([]);
  const [activeVideoId, setActiveVideoId] = useState<string>("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedViewId, setSelectedViewId] = useState<string>("");

  const mediaMeta = asRecord(mediaItem?.meta);
  const sgEventId =
    (sgIssue?.sg_event_id != null ? String(sgIssue.sg_event_id).trim() : "") ||
    pickText([mediaMeta, asRecord(mediaItem)], ["sg_event_id", "event_id", "plane_event_id", "eventId", "planeEventId"]);
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
  const { data: sgEventDevices, isLoading: isLoadingViews } = useSWR(
    cpServerBaseUrl && sgEventId ? `SG_EVENT_DEVICES_${cpServerBaseUrl}_${sgEventId}` : null,
    () => fetchSgEventDevices(cpServerBaseUrl, sgEventId),
    { revalidateOnFocus: false }
  );

  const eventDetails = getEventMediaDetails(mediaItem) ?? sgMediaPayload?.eventDetails ?? null;
  const tagRows = normalizeTagRows(null, eventDetails);
  const eventPayload =
    asRecord(asRecord(sgMediaPayload?.eventItem?.meta).event) || asRecord(mediaMeta.event) || null;
  const availableQuarters = Array.from(new Set(tagRows.map((row) => row.quarter)));
  const effectiveQuarter =
    availableQuarters.includes(selectedQuarter) ? selectedQuarter : availableQuarters[0] || "Quarter 1";

  useEffect(() => {
    if (availableQuarters.length === 0) return;
    if (!availableQuarters.includes(selectedQuarter)) {
      setSelectedQuarter(availableQuarters[0]);
    }
  }, [availableQuarters, selectedQuarter]);

  useEffect(() => {
    const primaryVideo = sgMediaPayload?.videoItems?.[0];
    if (!primaryVideo) return;
    if (!activeVideoId || !sgMediaPayload?.videoItems.some((item) => item.id === activeVideoId)) {
      setActiveVideoId(primaryVideo.id);
    }
  }, [activeVideoId, sgMediaPayload?.videoItems]);

  useEffect(() => {
    const devices = sgEventDevices ?? [];
    if (devices.length === 0) {
      if (selectedViewId) {
        setSelectedViewId("");
      }
      return;
    }

    const hasCurrentSelection = devices.some((device) => String(device.id) === selectedViewId);
    if (hasCurrentSelection) {
      return;
    }

    const preferredDevice =
      devices.find((device) => device.streamName === (eventDetails?.primaryStreamName ?? "").trim()) ?? devices[0];
    setSelectedViewId(String(preferredDevice.id));
  }, [eventDetails?.primaryStreamName, selectedViewId, sgEventDevices]);

  const activeVideo =
    sgMediaPayload?.videoItems.find((item) => item.id === activeVideoId) ?? sgMediaPayload?.videoItems?.[0] ?? null;
  const viewDevices = sgEventDevices ?? [];
  const selectedViewDevice = viewDevices.find((device) => String(device.id) === selectedViewId) ?? viewDevices[0] ?? null;
  const selectedViewLabel = selectedViewDevice
    ? `View ${Math.max(
        viewDevices.findIndex((device) => device.id === selectedViewDevice.id) + 1,
        1
      )}`
    : "View 1";
  const playbackItem = useMemo<TMediaItem | null>(() => {
    if (activeVideo) {
      return activeVideo;
    }

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
  }, [activeVideo, resolvedWorkItemId, selectedViewDevice]);
  const hasPlayableVideo = Boolean(playbackItem);
  const filteredRows = tagRows.filter((row) => {
    if (removedTagIds.includes(row.id)) return false;
    if (row.quarter !== effectiveQuarter) return false;
    if (favoritesOnly && !favoriteTagIds.includes(row.id)) return false;
    if (!searchQuery.trim()) return true;

    const haystack = [
      row.player,
      row.primaryAction,
      row.quarter,
      row.result,
      row.team,
      row.timecode,
      row.yard,
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(searchQuery.trim().toLowerCase());
  });

  const groupedRows = filteredRows.reduce<Record<string, SgTagRow[]>>((accumulator, row) => {
    accumulator[row.quarter] ??= [];
    accumulator[row.quarter].push(row);
    return accumulator;
  }, {});

  const allVisibleSelected = filteredRows.length > 0 && filteredRows.every((row) => selectedTagIds.includes(row.id));
  const payloadSources = [asRecord(eventPayload), asRecord(asRecord(eventPayload).event)];
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
  const dateValue =
    pickText(payloadSources, ["date", "event_date", "start_date", "eventDate"]) ||
    eventDetails?.eventDateTime ||
    eventDetails?.eventDate ||
    toText(mediaMeta.start_date) ||
    issue?.start_date ||
    "";
  const timeValue =
    pickText(payloadSources, ["time", "event_time", "start_time", "eventTime"]) ||
    eventDetails?.eventTime ||
    toText(mediaMeta.start_time) ||
    issue?.start_time ||
    "";
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

  const handleCreateCard = () => {
    const selectedRows = filteredRows.filter((row) => selectedTagIds.includes(row.id));
    if (selectedRows.length === 0) {
      setToast({
        message: "Select one or more tagged rows first.",
        title: "No tags selected",
        type: TOAST_TYPE.INFO,
      });
      return;
    }

    setFavoriteTagIds((currentValue) =>
      Array.from(new Set([...currentValue, ...selectedRows.map((row) => row.id)]))
    );
    setToast({
      message: `${selectedRows.length} tag${selectedRows.length === 1 ? "" : "s"} marked for card creation.`,
      title: "Card set prepared",
      type: TOAST_TYPE.SUCCESS,
    });
  };

  const handleCreatePlaylist = () => {
    const selectedRows = filteredRows.filter((row) => selectedTagIds.includes(row.id));
    if (selectedRows.length === 0) {
      setToast({
        message: "Select one or more tagged rows first.",
        title: "No tags selected",
        type: TOAST_TYPE.INFO,
      });
      return;
    }

    setPlaylistItems((currentValue) => {
      const nextItems = [...currentValue];
      selectedRows.forEach((row) => {
        if (nextItems.some((item) => item.id === row.id)) return;
        nextItems.push({
          id: row.id,
          subtitle: `${row.team} · ${row.timecode}`,
          title: `${row.primaryAction}${row.player !== "--" ? ` · ${row.player}` : ""}`,
        });
      });
      return nextItems;
    });
    setToast({
      message: `${selectedRows.length} tag${selectedRows.length === 1 ? "" : "s"} added to the playlist panel.`,
      title: "Playlist updated",
      type: TOAST_TYPE.SUCCESS,
    });
  };

  return (
    <div className="h-full bg-custom-background-100 text-custom-text-100">
      <div className="h-full overflow-y-auto px-3 py-4 md:px-4 xl:px-5">
        <div className="flex w-full flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex h-8 items-center gap-2 rounded-md px-2.5 text-sm text-custom-text-300 transition-colors hover:bg-custom-background-80 hover:text-custom-text-100"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </button>

            <div className="hidden items-center gap-2 md:flex">
              {viewDevices.length > 0 ? (
                <CustomSelect
                  value={selectedViewId}
                  onChange={(value: string) => setSelectedViewId(value)}
                  label={<span className="truncate">{selectedViewLabel}</span>}
                  placement="bottom-end"
                  className="h-9"
                  buttonClassName="inline-flex h-9 min-w-[110px] items-center gap-2 rounded-lg border border-custom-border-200 bg-custom-background-100 px-3 text-sm text-custom-text-100 hover:bg-custom-background-90"
                  optionsClassName="min-w-[140px]"
                >
                  {viewDevices.map((device, index) => (
                    <CustomSelect.Option key={device.id} value={String(device.id)}>
                      <div className="flex min-w-0 flex-col">
                        <span className="text-sm">{`View ${index + 1}`}</span>
                        <span className="truncate text-xs text-custom-text-400">{device.streamName}</span>
                      </div>
                    </CustomSelect.Option>
                  ))}
                </CustomSelect>
              ) : (
                <button className="inline-flex h-9 items-center gap-2 rounded-lg border border-custom-border-200 bg-custom-background-100 px-3 text-sm text-custom-text-100">
                  <span>{isLoadingViews ? "Loading views" : "View 1"}</span>
                  <ChevronDown className="h-4 w-4 text-custom-text-400" />
                </button>
              )}
              <button className={ICON_BUTTON_CLASS}>
                <List className="h-4 w-4" />
              </button>
              <button className={ICON_BUTTON_CLASS}>
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button className={ICON_BUTTON_CLASS}>
                <SlidersHorizontal className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div
            className={cn(
              "grid gap-4 xl:grid-cols-[44px_minmax(0,1fr)]",
              !hasPlayableVideo && "xl:grid-cols-[minmax(0,1fr)]"
            )}
          >
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
              <SgEventVideoPlayer item={playbackItem} compactEmpty={!hasPlayableVideo} />
            </div>
            <div className={cn("min-w-0", hasPlayableVideo && "xl:col-span-2")}>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-3 px-0.5 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex min-w-0 flex-wrap items-center gap-3">
                    <h1 className="truncate text-[20px] font-semibold tracking-[-0.02em] text-custom-text-100">
                      {eventTitle}
                    </h1>
                    <Pill variant={EPillVariant.PRIMARY} size={EPillSize.SM} className="border-none">
                      Scheduled event tagged
                    </Pill>
                  </div>
                  <Pill
                    variant={eventStatus.toLowerCase().includes("complete") ? EPillVariant.SUCCESS : EPillVariant.PRIMARY}
                    size={EPillSize.SM}
                    className={cn("w-fit border-none", {
                      "bg-red-50 text-red-700": eventStatus.toLowerCase().includes("cancel"),
                    })}
                  >
                    Status: {formatLooseLabel(eventStatus)}
                  </Pill>
                </div>

                <section className={cn(SURFACE_CLASS, "overflow-hidden")}>
                  <div className="border-b border-custom-border-200 px-4 py-3.5 text-base font-semibold text-custom-text-100">
                    Event details
                  </div>
                  <div className="grid gap-4 px-4 py-4 lg:grid-cols-[minmax(180px,0.9fr)_minmax(260px,1.3fr)_minmax(120px,0.55fr)]">
                    <div className="flex items-start gap-3 text-sm">
                      <CalendarDays className="mt-0.5 h-4 w-4 text-custom-text-400" />
                      <div className="min-w-0">
                        <div className="text-custom-text-300">{eventDateTimeLabel}</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 text-sm">
                      <MapPin className="mt-0.5 h-4 w-4 text-custom-text-400" />
                      <div className="min-w-0 text-custom-text-300">
                        <div className="truncate text-custom-text-300" title={[venueName, venueAddress].filter(Boolean).join(", ")}>
                          {[venueName, venueAddress].filter(Boolean).join(", ") || "Venue unavailable"}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 text-sm">
                      <Trophy className="mt-0.5 h-4 w-4 text-custom-text-400" />
                      <div className="text-custom-text-300">{levelLabel}</div>
                    </div>
                  </div>
                </section>

                <section className={cn(SURFACE_CLASS, "overflow-hidden")}>
                  <div className="flex flex-col gap-3 border-b border-custom-border-200 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-custom-text-100">Group by :</span>
                      <CustomSelect
                        value={effectiveQuarter}
                        onChange={(value: string) => setSelectedQuarter(value)}
                        label={<span className="truncate">{effectiveQuarter}</span>}
                        placement="bottom-start"
                        className="h-9"
                        buttonClassName="h-9 min-w-[120px] rounded-lg border border-custom-border-200 bg-custom-background-100 px-3 py-2 text-sm text-custom-text-100 hover:bg-custom-background-90"
                        optionsClassName="min-w-[140px]"
                      >
                        {(availableQuarters.length > 0 ? availableQuarters : [...QUARTER_OPTIONS]).map((quarter) => (
                          <CustomSelect.Option key={quarter} value={quarter}>
                            <span className="text-sm">{quarter}</span>
                          </CustomSelect.Option>
                        ))}
                      </CustomSelect>
                    </div>

                    <div className="flex flex-wrap items-center justify-end gap-2">
                      {isSearchOpen && (
                        <label className="flex h-9 items-center gap-2 rounded-lg border border-custom-border-200 bg-custom-background-100 px-3 text-sm text-custom-text-300">
                          <Search className="h-4 w-4" />
                          <input
                            value={searchQuery}
                            onChange={(event) => setSearchQuery(event.target.value)}
                            placeholder="Search"
                            className="w-32 bg-transparent text-sm text-custom-text-100 outline-none placeholder:text-custom-text-400"
                          />
                        </label>
                      )}
                      {/* <button
                        type="button"
                        onClick={handleCreateCard}
                        className={ACTION_BUTTON_CLASS}
                      >
                        <Plus className="h-4 w-4" />
                        <span>Create Card</span>
                      </button> */}
                      <Tooltip tooltipContent={isSearchOpen ? "Hide search" : "Search"} isMobile={false}>
                        <button
                          type="button"
                          onClick={() => {
                            if (isSearchOpen && !searchQuery) {
                              setIsSearchOpen(false);
                              return;
                            }
                            setIsSearchOpen(true);
                          }}
                          className={ICON_BUTTON_CLASS}
                        >
                          <Search className="h-4 w-4" />
                        </button>
                      </Tooltip>
                      <Tooltip tooltipContent={favoritesOnly ? "Show all rows" : "Show favorites only"} isMobile={false}>
                        <button
                          type="button"
                          onClick={() => setFavoritesOnly((currentValue) => !currentValue)}
                          className={cn(
                            "inline-flex h-9 w-9 items-center justify-center rounded-lg border transition-colors",
                            favoritesOnly
                              ? "border-custom-primary-100/30 bg-custom-primary-100/15 text-custom-primary-100"
                              : "border-custom-border-200 bg-custom-background-100 text-custom-text-300 hover:bg-custom-background-90 hover:text-custom-text-100"
                          )}
                        >
                          <Filter className="h-4 w-4" />
                        </button>
                      </Tooltip>
                      {/* <button
                        type="button"
                        onClick={handleCreatePlaylist}
                        className={ACTION_BUTTON_CLASS}
                      >
                        <Plus className="h-4 w-4" />
                        <span>Create Playlist</span>
                      </button> */}
                      <button className={ICON_BUTTON_CLASS}>
                        <Settings2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="max-h-[520px] overflow-auto">
                    <div className="min-w-full">
                      <div className={cn("sticky top-0 z-[2] grid w-full gap-3 border-b border-custom-border-200 bg-custom-sidebar-background-100 px-5 py-3 text-xs text-custom-text-300", TAG_TABLE_GRID_CLASS)}>
                        <button
                          type="button"
                          onClick={handleSelectAll}
                          className="flex items-center gap-2 text-left"
                        >
                          <span
                            className={cn(
                              "flex h-4 w-4 items-center justify-center rounded border",
                              allVisibleSelected
                                ? "border-custom-primary-100 bg-custom-primary-100 text-white"
                                : "border-custom-border-200 text-transparent"
                            )}
                          >
                            <Check className="h-3 w-3" />
                          </span>
                          <span>No.</span>
                        </button>
                        <div>Time code</div>
                        <div>Players</div>
                        <div>Team</div>
                        <div>Primary Action</div>
                        <div>Result</div>
                        <div>Yard</div>
                        <div>Action</div>
                      </div>

                      {Object.entries(groupedRows).length === 0 ? (
                        <div className="px-5 py-12 text-center text-sm text-custom-text-400">
                          No SG tags matched the current filter set.
                        </div>
                      ) : (
                        Object.entries(groupedRows).map(([quarter, rows]) => {
                          const isOpen = !closedQuarters.includes(quarter);

                          return (
                            <div key={quarter} className="border-t border-custom-border-200 first:border-t-0">
                              <Collapsible
                                isOpen={isOpen}
                                onToggle={() =>
                                  setClosedQuarters((currentValue) =>
                                    currentValue.includes(quarter)
                                      ? currentValue.filter((value) => value !== quarter)
                                      : [...currentValue, quarter]
                                  )
                                }
                                title={
                                  <div className={cn("grid w-full items-center gap-3 bg-custom-background-90 px-5 py-3", TAG_TABLE_GRID_CLASS)}>
                                    <div className="text-xs text-custom-text-300">
                                      {rows.length} row{rows.length === 1 ? "" : "s"}
                                    </div>
                                    <div className="col-span-7 flex items-center gap-3">
                                      {isOpen ? (
                                        <ChevronDown className="h-4 w-4 text-custom-text-400" />
                                      ) : (
                                        <ChevronRight className="h-4 w-4 text-custom-text-400" />
                                      )}
                                      <span className="text-lg font-medium text-custom-text-100">{quarter}</span>
                                    </div>
                                  </div>
                                }
                                buttonClassName="w-full text-left transition-colors hover:bg-custom-background-80"
                              >
                                <div>
                                  {rows.map((row, index) => {
                                    const isSelected = selectedTagIds.includes(row.id);
                                    const isFavorited = favoriteTagIds.includes(row.id);

                                    return (
                                      <div
                                        key={row.id}
                                        className={cn(
                                          "grid w-full gap-3 border-t border-custom-border-200 px-5 py-3 text-sm text-custom-text-200 transition-colors hover:bg-custom-background-90",
                                          TAG_TABLE_GRID_CLASS
                                        )}
                                      >
                                        <button
                                          type="button"
                                          onClick={() => handleToggleTagSelection(row.id)}
                                          className="flex items-center gap-2 text-left"
                                        >
                                          <span
                                            className={cn(
                                              "flex h-4 w-4 items-center justify-center rounded border",
                                              isSelected
                                                ? "border-custom-primary-100 bg-custom-primary-100 text-white"
                                                : "border-custom-border-200 text-transparent"
                                            )}
                                          >
                                            <Check className="h-3 w-3" />
                                          </span>
                                          <span className="text-custom-text-400">{index + 1}</span>
                                        </button>
                                        <div>{row.timecode}</div>
                                        <div className="truncate" title={row.player}>
                                          {row.player}
                                        </div>
                                        <div>{row.team}</div>
                                        <div className="truncate" title={row.primaryAction}>
                                          {row.primaryAction}
                                        </div>
                                        <div>{row.result}</div>
                                        <div>{row.yard}</div>
                                        <div className="flex items-center gap-2">
                                          <Tooltip tooltipContent={isFavorited ? "Remove favorite" : "Favorite"} isMobile={false}>
                                            <button
                                              type="button"
                                              onClick={() =>
                                                setFavoriteTagIds((currentValue) =>
                                                  currentValue.includes(row.id)
                                                    ? currentValue.filter((value) => value !== row.id)
                                                    : [...currentValue, row.id]
                                                )
                                              }
                                              className="rounded-md p-1.5 text-custom-text-300 transition-colors hover:bg-custom-background-100 hover:text-[#d0a64a]"
                                            >
                                              <Star
                                                className={cn("h-4 w-4", {
                                                  "fill-[#d0a64a] text-[#d0a64a]": isFavorited,
                                                })}
                                              />
                                            </button>
                                          </Tooltip>
                                          <Tooltip tooltipContent="Delete row" isMobile={false}>
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setRemovedTagIds((currentValue) => [...currentValue, row.id]);
                                                setSelectedTagIds((currentValue) =>
                                                  currentValue.filter((value) => value !== row.id)
                                                );
                                              }}
                                              className="rounded-md p-1.5 text-custom-text-300 transition-colors hover:bg-custom-background-100 hover:text-[#dc6b7c]"
                                            >
                                              <Trash2 className="h-4 w-4" />
                                            </button>
                                          </Tooltip>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </Collapsible>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {isMediaLoading && (
                    <div className="border-t border-custom-border-200 px-4 py-2.5 text-xs text-custom-text-400">
                      Syncing SG media package and playlist references for this event.
                    </div>
                  )}
                </section>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
