"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { ChevronLeft, ChevronRight, ListPlus, Play, Plus, Video } from "lucide-react";
import { API_BASE_URL } from "@plane/constants";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
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
import { MatrixView } from "./matrix-view";
import { AMERICAN_FOOTBALL_SAMPLE_TAGS } from "./matrix-view/config/matrix-mock-data";
import { buildMatrixPlaylistItem, createMatrixPlaylist } from "./matrix-view/utils/create-matrix-playlist";
import { SgEventVideoPlayer } from "./sg-event-video-player";
import { SgEventTagsPanel } from "./tags-panel";
import { SgEventTimelinePanel } from "./timeline-panel";
import { getTimelinePanelInputPlayheadSeconds, isTimelineTagPlaybackOverrideId } from "./timeline-scale";
import type {
  RowFilterMode,
  SgEventDetailPageProps,
  SgEventTagViewMode,
  SgIssue,
  SgTagRow,
  SgTagRowEditPayload,
} from "./types";
import {
  asArray,
  asRecord,
  buildArchivedPlaylistUrl,
  buildBaseEventDateTime,
  buildEventTitle,
  firstNonEmptyRecord,
  formatLongDateTime,
  getCpServerBaseUrl,
  getSportTableConfig,
  normalizeTagRows,
  parseGatewayRows,
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

  if (!normalizedValue.includes("/") && !normalizedValue.includes("?") && !normalizedValue.includes("#")) {
    const thumbnailName = normalizedValue.replace(/\.jpg$/i, "");
    return `${normalizedCpServerBaseUrl}/blobs/thumbnails/${encodeURIComponent(thumbnailName)}.jpg`;
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

const readApiErrorMessage = async (response: Response, fallbackMessage: string) => {
  const responseText = await response.text();

  try {
    const data = JSON.parse(responseText) as {
      detail?: string;
      error?: string;
      errorMessage?: string;
      error_message?: string;
      message?: string;
    };

    return data.error || data.detail || data.message || data.errorMessage || data.error_message || fallbackMessage;
  } catch {
    return responseText || fallbackMessage;
  }
};

const fetchKanavioTagRowsPayload = async (cpServerBaseUrl: string, sgEventId: string) => {
  const normalizedCpServerBaseUrl = cpServerBaseUrl.trim();
  const eventId = Number(sgEventId.trim());

  if (!normalizedCpServerBaseUrl) {
    throw new Error("NEXT_PUBLIC_CP_SERVER_URL is required to fetch tags.");
  }

  if (!Number.isFinite(eventId)) {
    throw new Error("A numeric SG event id is required to fetch tags.");
  }

  const response = await fetch(joinApiPath(normalizedCpServerBaseUrl, "/tagging-session/fetch-tags"), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ event_id: eventId }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(await readApiErrorMessage(response, "Unable to fetch event tags."));
  }

  return response.json() as Promise<unknown>;
};

const isFetchedTagRecord = (record: Record<string, unknown>) =>
  Boolean(
    toText(
      record.tag ??
        record.action ??
        record.event_code ??
        record.play ??
        record.timestamp ??
        record.video_time ??
        record.original_stream_name ??
        record.stream_name ??
        record.thumbnail
    )
  );

const extractFetchedTagRows = (value: unknown): unknown[] => {
  if (!Array.isArray(value)) return [];

  return value.flatMap((entry): unknown[] => {
    if (Array.isArray(entry)) return extractFetchedTagRows(entry);

    const record = asRecord(entry);
    if (Object.keys(record).length === 0) return [];
    if (isFetchedTagRecord(record)) return [record];

    const dataRows = asArray(record.data);
    if (dataRows.length > 0) return extractFetchedTagRows(dataRows);

    return [record];
  });
};

const normalizeFetchedTagPayload = (payload: unknown): Record<string, unknown> | null => {
  if (Array.isArray(payload)) {
    const rows = extractFetchedTagRows(payload);
    return rows.length > 0 ? { tags: rows } : null;
  }

  const record = asRecord(payload);
  if (Object.keys(record).length === 0) return null;

  const resultRows = [
    ...extractFetchedTagRows(asRecord(record["Gateway Response"]).result),
    ...extractFetchedTagRows(record.result),
  ];
  if (resultRows.length > 0) return { ...record, tags: resultRows };

  const gatewayRows = parseGatewayRows(payload);
  if (gatewayRows.length > 0) return { tags: gatewayRows };

  const tags = record.tags ?? record.tagRows ?? record.tag_rows ?? record.records ?? record.data ?? record.result;
  if (Array.isArray(tags)) {
    const rows = extractFetchedTagRows(tags);
    return rows.length > 0 ? { ...record, tags: rows } : tags.length > 0 ? { ...record, tags } : record;
  }

  const nestedRecord = firstNonEmptyRecord(record.data, record.result, record.response);
  if (!nestedRecord) return record;

  const nestedResultRows = extractFetchedTagRows(nestedRecord.result);
  if (nestedResultRows.length > 0) return { ...record, tags: nestedResultRows };

  const nestedRows = parseGatewayRows(nestedRecord);
  if (nestedRows.length > 0) return { ...record, tags: nestedRows };

  const nestedTags =
    nestedRecord.tags ??
    nestedRecord.tagRows ??
    nestedRecord.tag_rows ??
    nestedRecord.records ??
    nestedRecord.data ??
    nestedRecord.result;

  if (Array.isArray(nestedTags)) {
    const rows = extractFetchedTagRows(nestedTags);
    return rows.length > 0 ? { ...record, tags: rows } : { ...record, tags: nestedTags };
  }

  return record;
};

const isNumericEventId = (value: string) => Number.isFinite(Number(value.trim()));

const buildMockFootballRows = (): SgTagRow[] =>
  AMERICAN_FOOTBALL_SAMPLE_TAGS.map((tag, index) => {
    const startSeconds = (index + 1) * 126;
    const endSeconds = startSeconds + 8;
    const formatTimestamp = (seconds: number) => {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
    };

    return {
      action: tag.action,
      clipId: tag.clipId ?? `mock-clip-${index + 1}`,
      clipDurationSeconds: endSeconds - startSeconds,
      clipEndSeconds: endSeconds,
      clipRangeSource: "explicit",
      clipStartSeconds: startSeconds,
      context: tag.context ?? {},
      groupValue: tag.groupValue ?? "Quarter 1",
      id: tag.id,
      matrixParticipant: tag.player ?? null,
      matrixPeriod: tag.groupValue ?? null,
      player: tag.player ?? "--",
      playlistFallbackTimestamp: tag.playlistFallbackTimestamp ?? formatTimestamp(startSeconds),
      playlistTimestamp: tag.playlistTimestamp ?? formatTimestamp(startSeconds),
      primaryDetail: tag.team ?? "--",
      result: tag.result ?? "--",
      secondaryDetail: tag.groupValue ?? "--",
      sourceTagId: tag.sourceTagId ?? tag.id,
      sourceUrl: tag.sourceUrl ?? "",
      team: tag.team ?? "--",
      thumbnailUrl: tag.thumbnailUrl ?? "",
      timecode: `${formatTimestamp(startSeconds)} - ${formatTimestamp(endSeconds)}`,
    };
  });

const SgMatrixPlaylistPanel = ({
  activeRowId,
  isCreatingPlaylist,
  onCreateCard,
  onCreatePlaylist,
  onPlayTagRow,
  rows,
}: {
  activeRowId?: string | null;
  isCreatingPlaylist: boolean;
  onCreateCard: () => void;
  onCreatePlaylist: () => void;
  onPlayTagRow: (row: SgTagRow) => void | Promise<void>;
  rows: SgTagRow[];
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (isCollapsed) {
    return (
      <aside className="flex min-h-[240px] w-full flex-col items-center gap-3 rounded-[5px] border border-[var(--sg-matrix-border)] bg-[var(--sg-matrix-panel-secondary)] p-2 xl:w-12">
        <button
          type="button"
          onClick={() => setIsCollapsed(false)}
          className="inline-flex h-8 w-8 items-center justify-center rounded text-[var(--sg-matrix-text-secondary)] transition-colors hover:bg-[var(--sg-matrix-hover)] hover:text-[var(--sg-matrix-text)]"
          aria-label="Expand playlist workspace"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <Video aria-hidden="true" className="h-4 w-4 text-[var(--sg-matrix-text-muted)]" />
        {rows.length > 0 ? (
          <span className="text-xs tabular-nums text-[var(--sg-matrix-text-muted)]">{rows.length}</span>
        ) : null}
      </aside>
    );
  }

  return (
    <aside className="flex min-h-[240px] flex-col overflow-hidden rounded-[5px] border border-[var(--sg-matrix-border)] bg-[var(--sg-matrix-panel-secondary)]">
      <div className="flex h-[34px] items-center justify-between gap-3 border-b border-[var(--sg-matrix-border)] px-2.5">
        <div className="min-w-0">
          <div className="truncate text-[13px] font-normal text-[var(--sg-matrix-text-secondary)]">
            Playlist Workspace
          </div>
          <div className="hidden text-[10px] text-[var(--sg-matrix-text-muted)]">
            {rows.length > 0 ? `${rows.length} selected tag${rows.length === 1 ? "" : "s"}` : "No clips selected"}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsCollapsed(true)}
          className="inline-flex h-7 w-7 items-center justify-center rounded text-[var(--sg-matrix-text-secondary)] transition-colors hover:bg-[var(--sg-matrix-hover)] hover:text-[var(--sg-matrix-text)]"
          aria-label="Collapse playlist workspace"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="flex gap-2 border-b border-[var(--sg-matrix-border)] px-2 py-2">
        <button
          type="button"
          disabled={rows.length === 0}
          onClick={onCreateCard}
          className="inline-flex h-7 flex-1 items-center justify-center gap-1.5 rounded-[5px] border border-[var(--sg-matrix-border)] bg-[var(--sg-matrix-selected-nav)] px-2 text-[11px] font-normal text-[var(--sg-matrix-text-secondary)] transition-colors hover:bg-[var(--sg-matrix-hover)] hover:text-[var(--sg-matrix-text)] disabled:cursor-not-allowed disabled:text-[var(--sg-matrix-text-disabled)] disabled:opacity-45"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Create Card</span>
        </button>
        <button
          type="button"
          disabled={rows.length === 0 || isCreatingPlaylist}
          onClick={onCreatePlaylist}
          className="inline-flex h-7 flex-1 items-center justify-center gap-1.5 rounded-[5px] border border-[var(--sg-matrix-border)] bg-[var(--sg-matrix-selected-nav)] px-2 text-[11px] font-normal text-[var(--sg-matrix-text-secondary)] transition-colors hover:bg-[var(--sg-matrix-hover)] hover:text-[var(--sg-matrix-text)] disabled:cursor-not-allowed disabled:text-[var(--sg-matrix-text-disabled)] disabled:opacity-45"
        >
          <ListPlus className="h-3.5 w-3.5" />
          <span>{isCreatingPlaylist ? "Creating" : "Create Playlist"}</span>
        </button>
      </div>

      {rows.length === 0 ? (
        <div className="flex min-h-0 flex-1 items-start px-3 py-3 text-left text-xs leading-5 text-[var(--sg-matrix-text-muted)]">
          Select populated cells in the matrix to build a playlist.
        </div>
      ) : (
        <ul className="vertical-scrollbar scrollbar-md min-h-0 flex-1 space-y-1.5 overflow-y-auto p-1.5">
          {rows.map((row) => {
            const isActive = activeRowId === row.id;

            return (
              <li key={row.id}>
                <button
                  type="button"
                  onClick={() => void onPlayTagRow(row)}
                  className={`group flex w-full items-center gap-2 rounded border px-2 py-2 text-left transition-colors ${
                    isActive
                      ? "border-[var(--sg-matrix-selected-card-border)] bg-[var(--sg-matrix-selected-nav)]"
                      : "border-[var(--sg-matrix-grid-border)] bg-[var(--sg-matrix-selected-nav)] hover:bg-[var(--sg-matrix-hover)]"
                  }`}
                >
                  <span className="flex h-9 w-16 shrink-0 items-center justify-center overflow-hidden rounded bg-[var(--sg-matrix-cell-empty)] text-[var(--sg-matrix-text-muted)]">
                    {row.thumbnailUrl ? (
                      <img src={row.thumbnailUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <Play className="h-3.5 w-3.5" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[11px] font-normal text-[var(--sg-matrix-text-secondary)]">
                      {row.action}
                    </span>
                    <span className="block truncate text-[10px] text-[var(--sg-matrix-text-muted)]">
                      {[row.timecode, row.player].filter(Boolean).join(" · ")}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </aside>
  );
};

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
  const [tagViewMode, setTagViewMode] = useState<SgEventTagViewMode>(enableMatrixView ? "matrix" : "timeline");
  const [isListExpanded, setIsListExpanded] = useState(false);
  const [focusedMatrixRows, setFocusedMatrixRows] = useState<SgTagRow[]>([]);
  const [isCreatingMatrixPlaylist, setIsCreatingMatrixPlaylist] = useState(false);
  const [editedTagRowsById, setEditedTagRowsById] = useState<Record<string, Partial<SgTagRow>>>({});

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
        const editedRow = editedTagRowsById[row.id];
        const mergedRow = editedRow ? { ...row, ...editedRow } : row;
        const thumbnailUrl = resolveTagRowArtifactThumbnail(mergedRow, mediaThumbnailLookup, cpServerBaseUrl);
        return thumbnailUrl && thumbnailUrl !== mergedRow.thumbnailUrl ? { ...mergedRow, thumbnailUrl } : mergedRow;
      }),
    [cpServerBaseUrl, editedTagRowsById, mediaThumbnailLookup, tagRows]
  );
  const payloadViewDevices = useMemo(() => buildEventPayloadDevices(eventPayload), [eventPayload]);
  const viewDevices = sgEventDevices && sgEventDevices.length > 0 ? sgEventDevices : payloadViewDevices;
  const primaryStreamName =
    pickText(payloadSources, ["primaryStreamName", "primary_stream_name"]) || eventDetails?.primaryStreamName || "";
  const availableGroups = useMemo(
    () => Array.from(new Set(tagRowsWithThumbnails.map((row) => row.groupValue))),
    [tagRowsWithThumbnails]
  );
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
    if (tagViewMode !== "list" && isListExpanded) {
      setIsListExpanded(false);
    }
  }, [isListExpanded, tagViewMode]);

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
  const activePlaybackOverrideId = activePlaybackOverride?.id ?? null;
  const isPlaybackOverrideActive = Boolean(activePlaybackOverride);
  const filteredRows = useMemo(
    () =>
      tagRowsWithThumbnails.filter((row) => {
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
      }),
    [
      effectiveGroupValue,
      favoriteTagIds,
      removedTagIds,
      rowFilterMode,
      searchQuery,
      selectedTagIds,
      tagRowsWithThumbnails,
    ]
  );
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

  const handleUpdateTag = (tagId: string, updates: SgTagRowEditPayload) => {
    setEditedTagRowsById((currentValue) => ({
      ...currentValue,
      [tagId]: {
        ...(currentValue[tagId] ?? {}),
        ...updates,
      },
    }));
    setToast({
      type: TOAST_TYPE.SUCCESS,
      title: "Tag updated",
      message: "The list row has been updated.",
    });
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

  const handleCreateMatrixPlaylist = useCallback(
    async (rows: SgTagRow[]) => {
      if (isCreatingMatrixPlaylist) return;
      const streamName = (selectedViewDevice?.streamName ?? primaryStreamName).trim();
      setIsCreatingMatrixPlaylist(true);

      try {
        const result = await createMatrixPlaylist({ mediaLibraryService, rows, streamName });
        const includedRowIds = new Set(result.rowIds);
        const includedRows = rows.filter((row) => includedRowIds.has(row.id));
        setPendingSeekSeconds(null);
        setActivePlaybackOverride(
          buildMatrixPlaylistItem({
            result,
            rows: includedRows,
            workItemId: resolvedWorkItemId || null,
          })
        );
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
      isCreatingMatrixPlaylist,
      mediaLibraryService,
      primaryStreamName,
      resolvedWorkItemId,
      selectedViewDevice?.streamName,
    ]
  );

  const handleCreateMatrixCard = useCallback((rows: SgTagRow[]) => {
    setSelectedTagIds(rows.map((row) => row.id));
    setToast({
      type: TOAST_TYPE.SUCCESS,
      title: "Card selection ready",
      message: `${rows.length} tag${rows.length === 1 ? "" : "s"} selected for card creation.`,
    });
  }, []);

  const matrixRows = useMemo(() => {
    const realRows = tagRowsWithThumbnails.filter((row) => !removedTagIds.includes(row.id));
    if (realRows.length > 0 || sportTableConfig.sport !== "american-football") return realRows;
    return buildMockFootballRows();
  }, [removedTagIds, sportTableConfig.sport, tagRowsWithThumbnails]);
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
    ? activePlaybackOverrideId?.slice("sg-tag-".length) ?? null
    : null;
  const matrixStreamName = (selectedViewDevice?.streamName ?? primaryStreamName).trim();
  const playlistPanelRows = focusedMatrixRows.filter((row) => !removedTagIds.includes(row.id));
  const isMatrixWorkspaceMode = enableMatrixView && tagViewMode === "matrix";
  const isTagRowsLoading = isMediaLoading || (shouldUseKanavioTagApi && isKanavioTagsLoading);
  const matrixPreferenceKey = `plane:media-library:matrix-columns:${workspaceSlug}:${projectId}:${
    resolvedSgEventId || mediaItem?.id || resolvedWorkItemId || "event"
  }:${sportTableConfig.sport}`;
  const isExpandedListView = tagViewMode === "list" && isListExpanded;
  const timelinePanelPlayheadSeconds = getTimelinePanelInputPlayheadSeconds({
    playbackOverrideId: activePlaybackOverrideId,
    playheadBaseSeconds,
    playerLocalSeconds,
  });

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
                  activeRowId={activeMatrixRowId}
                  isCreatingPlaylist={isCreatingMatrixPlaylist}
                  onCreateCard={() => handleCreateMatrixCard(playlistPanelRows)}
                  onCreatePlaylist={() => void handleCreateMatrixPlaylist(playlistPanelRows)}
                  onPlayTagRow={handlePlayTagRow}
                  rows={playlistPanelRows}
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
                <div className="min-w-0">
                  <SgEventVideoPlayer
                    item={playbackItem}
                    compactEmpty={!hasPlayableVideo}
                    onPlaybackTimeChange={handlePlaybackTimeChange}
                    seekToSeconds={pendingSeekSeconds}
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
                      isMediaLoading={isTagRowsLoading}
                      onPlayTagRow={handlePlayTagRow}
                      onResetPlayback={handleResetTimelinePlayback}
                      playerDurationSeconds={playerDurationSeconds}
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
