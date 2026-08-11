"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Calendar, CalendarClock, Clock, Handshake, Signal, Tag, User, Volleyball } from "lucide-react";
import type { EditorRefApi } from "@plane/editor";
import type { TNameDescriptionLoader } from "@plane/types";
import { renderFormattedPayloadDate } from "@plane/utils";
import { CategoryDropdown } from "@/components/dropdowns/category-property";
import { DateDropdown } from "@/components/dropdowns/date";
import { LevelDropdown } from "@/components/dropdowns/level-property";
import { ProgramDropdown } from "@/components/dropdowns/program-property";
import SportDropdown from "@/components/dropdowns/sport-property";
import { TimeDropdown } from "@/components/dropdowns/time-picker";
import { YearRangeDropdown } from "@/components/dropdowns/year-property";
import type { TIssueOperations } from "@/components/issues/issue-detail";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useMember } from "@/hooks/store/use-member";
import OppositionTeamProperty from "@/plane-web/components/issues/issue-details/opposition-team-property";
import { MediaLibraryService } from "@/services/media-library.service";
import type { TMediaItem } from "../types/media-library.types";
import { formatFileSize, formatMetaLabel, formatMetaValue } from "../utils/media-detail-utils";
import {
  getEventMediaDateLabel,
  getEventMediaDetails,
  getEventMediaMetrics,
  isEventMediaItem,
} from "../utils/media-event";
import { DetailIssueOverview } from "./detail-peek-overview";
import { PeekOverviewIssueDetails } from "./detail-peek-overview/issue-detail";

type TMediaDetailSidebarProps = {
  workspaceSlug: string;
  projectId: string;
  item: TMediaItem;
  onMediaItemUpdated?: (updates?: Partial<TMediaItem>) => void;
};

type TOppositionTeam = {
  name: string;
  logo: string;
};

type TEditableMetaKey =
  | "category"
  | "sport"
  | "program"
  | "level"
  | "season"
  | "start_date"
  | "start_time"
  | "opposition";

const HIDDEN_ADDITIONAL_META_KEYS = new Set([
  "hlspending",
  "hlsmasterplaylist",
  "hlsrendition",
  "hlsrenditions",
  "poster",
  "posterurl",
  "transcodeassetid",
  "transcodecompletedat",
  "transcodejobid",
  "transcodeprofile",
  "transcodeprogress",
]);

const normalizeAdditionalMetaKey = (key: string) => key.replace(/[-_\s]+/g, "").toLowerCase();

export const MediaDetailSidebar = ({
  workspaceSlug,
  projectId,
  item,
  onMediaItemUpdated,
}: TMediaDetailSidebarProps) => {
  const { setPeekIssue } = useIssueDetail();
  const { getUserDetails } = useMember();
  const workItemId = item?.workItemId ?? "";
  const hasWorkItemId = Boolean(workItemId);
  const mediaLibraryService = useMemo(() => new MediaLibraryService(), []);
  const sidebarClassName =
    "w-full min-w-[300px] border-l border-custom-border-200 bg-custom-sidebar-background-100 py-5 lg:min-w-80 xl:min-w-96 lg:h-full lg:overflow-hidden lg:overscroll-y-contain";
  const artifactEditorRef = useRef<EditorRefApi>(null);
  const artifactFormIssueOperations = useMemo<TIssueOperations>(
    () => ({
      fetch: async () => {},
      update: async () => {},
      remove: async () => {},
    }),
    []
  );
  const [isSubmitting, setIsSubmitting] = useState<TNameDescriptionLoader>("saved");
  const [isSavingMeta, setIsSavingMeta] = useState(false);
  const artifactMeta = useMemo(() => (item?.meta ?? {}) as Record<string, unknown>, [item?.meta]);
  const isEventItem = useMemo(() => isEventMediaItem(item), [item]);
  const eventDetails = useMemo(() => getEventMediaDetails(item), [item]);
  const eventDateLabel = useMemo(() => getEventMediaDateLabel(item), [item]);
  const eventMetrics = useMemo(() => getEventMediaMetrics(item), [item]);
  const getMetaString = useCallback(
    (key: string) => {
      const value = artifactMeta[key];
      if (typeof value !== "string") return null;
      const trimmed = value.trim();
      return trimmed ? trimmed : null;
    },
    [artifactMeta]
  );
  const oppositionTeamValue = useMemo(() => {
    const value = artifactMeta.opposition;
    if (!value || typeof value !== "object" || Array.isArray(value)) return null;
    const name = (value as Record<string, unknown>).name;
    const logo = (value as Record<string, unknown>).logo;
    if (typeof name !== "string" || !name.trim()) return null;
    return {
      name: name.trim(),
      logo: typeof logo === "string" ? logo : "",
    } as TOppositionTeam;
  }, [artifactMeta]);
  const updateEditableMeta = useCallback(
    async (key: TEditableMetaKey, value: string | TOppositionTeam | null) => {
      const nextMeta = { ...artifactMeta, [key]: value ?? null };
      setIsSavingMeta(true);
      try {
        if (item?.packageId) {
          await mediaLibraryService.updateManifestArtifacts(workspaceSlug, projectId, item.packageId, {
            artifact_id: item.id,
            artifact: {
              meta: nextMeta,
            },
          });
        }
        onMediaItemUpdated?.({ meta: nextMeta });
      } finally {
        setIsSavingMeta(false);
      }
    },
    [artifactMeta, item?.id, item?.packageId, mediaLibraryService, onMediaItemUpdated, projectId, workspaceSlug]
  );
  const baseMetaKeys = useMemo(
    () =>
      new Set([
        "category",
        "sport",
        "program",
        "level",
        "season",
        "start_date",
        "start_time",
        "opposition",
        "created_by",
        "createdBy",
      ]),
    []
  );
  const createdByMemberId = useMemo(() => {
    const value = artifactMeta.created_by ?? artifactMeta.createdBy;
    if (typeof value !== "string") return "";
    return value.trim();
  }, [artifactMeta]);
  const createdByLabel = useMemo(() => {
    if (createdByMemberId) return getUserDetails(createdByMemberId)?.display_name ?? createdByMemberId;
    return formatMetaValue(item.author);
  }, [createdByMemberId, getUserDetails, item.author]);
  const additionalMetaEntries = useMemo(
    () =>
      Object.entries(artifactMeta).filter(([key, value]) => {
        if (baseMetaKeys.has(key)) return false;
        const normalizedKey = key.toLowerCase();
        if (
          HIDDEN_ADDITIONAL_META_KEYS.has(normalizeAdditionalMetaKey(key)) ||
          normalizedKey === "annotations" ||
          normalizedKey === "kind" ||
          normalizedKey === "thumbnail" ||
          normalizedKey === "tags"
        )
          return false;
        const normalized = formatMetaValue(value);
        return normalized && normalized !== "--";
      }),
    [artifactMeta, baseMetaKeys]
  );
  const getFormattedAdditionalMetaValue = useCallback((key: string, value: unknown) => {
    const normalizedKey = key.toLowerCase();
    if (normalizedKey === "file_size" || normalizedKey === "filesize" || normalizedKey === "size_in_bytes") {
      const sizeValue = formatFileSize(value);
      return sizeValue === "--" ? sizeValue : sizeValue.toLowerCase();
    }
    return formatMetaValue(value);
  }, []);
  const fallbackFields = useMemo(
    () => [
      { label: "Format", value: formatMetaValue(item.format) },
      { label: "Created", value: formatMetaValue(item.createdAt) },
    ],
    [item.createdAt, item.format]
  );
  const eventSummaryFields = useMemo(
    () =>
      !eventDetails
        ? []
        : [
            { label: "Status", value: formatMetaValue(eventDetails.status) },
            { label: "Event date", value: formatMetaValue(eventDateLabel) },
            { label: "Sport", value: formatMetaValue(eventDetails.sport) },
            { label: "Program", value: formatMetaValue(eventDetails.program) },
            { label: "Level", value: formatMetaValue(eventDetails.level) },
            { label: "Season", value: formatMetaValue(eventDetails.year) },
            { label: "Stream", value: formatMetaValue(eventDetails.primaryStreamName || eventDetails.primaryStreamId) },
            { label: "Location", value: formatMetaValue(eventDetails.locationLabel) },
            { label: "Metrics", value: formatMetaValue(eventMetrics.join(" · ")) },
          ].filter((field) => field.value && field.value !== "--"),
    [eventDateLabel, eventDetails, eventMetrics]
  );
  const eventSummarySection =
    isEventItem && eventSummaryFields.length > 0 ? (
      <div className="space-y-3">
        <h6 className="text-sm font-medium text-custom-text-100">Event Summary</h6>
        <div className="space-y-2">
          {eventSummaryFields.map((field) => (
            <div key={field.label} className="flex items-start justify-between gap-3 text-sm">
              <span className="text-custom-text-300">{field.label}</span>
              <span className="ml-auto block max-w-[65%] truncate text-right text-custom-text-100" title={field.value}>
                {field.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    ) : null;

  useEffect(() => {
    if (!workItemId) {
      setPeekIssue(undefined);
      return;
    }
    setPeekIssue({ workspaceSlug, projectId, issueId: workItemId });
  }, [projectId, setPeekIssue, workItemId, workspaceSlug]);

  if (workItemId && isEventItem) {
    return (
      <div className={sidebarClassName}>
        <div className="vertical-scrollbar scrollbar-md h-full overflow-y-auto px-6">
          <div className="space-y-6">
            <DetailIssueOverview embedIssue mediaItem={item} onMediaItemUpdated={onMediaItemUpdated} />
            {eventSummarySection}
          </div>
        </div>
      </div>
    );
  }

  if (!workItemId) {
    return (
      <div className={sidebarClassName}>
        <div className="vertical-scrollbar scrollbar-md h-full overflow-y-auto px-6">
          <div className="space-y-6">
            <div className="space-y-3">
              <PeekOverviewIssueDetails
                editorRef={artifactEditorRef}
                workspaceSlug={workspaceSlug}
                projectId={projectId}
                issueId={item.id}
                issueOperations={artifactFormIssueOperations}
                disabled={false}
                isArchived={false}
                isSubmitting={isSubmitting}
                setIsSubmitting={setIsSubmitting}
                mediaItem={item}
                onMediaItemUpdated={onMediaItemUpdated}
              />
            </div>

            <div className="space-y-3">
              <h6 className="text-sm font-medium text-custom-text-100">Artifact Details</h6>
              <div className="space-y-2">
                {fallbackFields
                  .filter((field) => field.value && field.value !== "--")
                  .map((field) => (
                    <div key={field.label} className="flex items-start justify-between gap-3 text-sm">
                      <span className="text-custom-text-300">{field.label}</span>
                      <span
                        className="ml-auto block max-w-[65%] truncate text-right text-custom-text-100"
                        title={field.value}
                      >
                        {field.value}
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            {eventSummarySection}

            <div>
              <h6 className="text-sm font-medium">Event Details</h6>
              <div className="mt-3 w-full space-y-2">
                <div className="flex h-8 w-full items-center gap-3">
                  <div className="flex w-1/4 flex-shrink-0 items-center gap-1 text-sm text-custom-text-300">
                    <User className="h-4 w-4 flex-shrink-0" />
                    <span>Created by</span>
                  </div>
                  <span className="w-3/4 rounded px-2 py-0.5 text-sm text-custom-text-100">{createdByLabel}</span>
                </div>

                {hasWorkItemId ? (
                  <>
                    <div className="flex h-8 w-full items-center gap-3">
                      <div className="flex w-1/4 flex-shrink-0 items-center gap-1 text-sm text-custom-text-300">
                        <CalendarClock className="h-4 w-4 flex-shrink-0" />
                        <span>Start date</span>
                      </div>
                      <DateDropdown
                        value={getMetaString("start_date")}
                        onChange={(value) =>
                          void updateEditableMeta(
                            "start_date",
                            value ? (renderFormattedPayloadDate(value) ?? null) : null
                          )
                        }
                        placeholder="Add start date"
                        buttonVariant="transparent-with-text"
                        className="w-3/4 flex-grow group"
                        buttonContainerClassName="w-full text-left"
                        buttonClassName={`text-sm ${getMetaString("start_date") ? "" : "text-custom-text-400"}`}
                        hideIcon
                        disabled={isSavingMeta}
                        clearIconClassName="h-3 w-3 hidden group-hover:inline"
                      />
                    </div>

                    <div className="flex h-8 w-full items-center gap-3">
                      <div className="flex w-1/4 flex-shrink-0 items-center gap-1 text-sm text-custom-text-300">
                        <Clock className="h-4 w-4 flex-shrink-0" />
                        <span>Start time</span>
                      </div>
                      <TimeDropdown
                        value={getMetaString("start_time")}
                        onChange={(value) => void updateEditableMeta("start_time", value)}
                        placeholder="Add start time"
                        buttonVariant="transparent-with-text"
                        className="w-3/4 flex-grow group"
                        buttonContainerClassName="w-full text-left"
                        buttonClassName={`text-sm ${getMetaString("start_time") ? "" : "text-custom-text-400"}`}
                        hideIcon
                        disabled={isSavingMeta}
                        clearIconClassName="h-3 w-3 hidden group-hover:inline"
                      />
                    </div>
                  </>
                ) : null}

                <div className="flex h-8 w-full items-center gap-3">
                  <div className="flex w-1/4 flex-shrink-0 items-center gap-1 text-sm text-custom-text-300">
                    <Signal className="h-4 w-4 flex-shrink-0" />
                    <span>Level</span>
                  </div>
                  <LevelDropdown
                    value={getMetaString("level")}
                    onChange={(value) => void updateEditableMeta("level", value)}
                    placeholder="Add level"
                    buttonVariant="transparent-with-text"
                    className="w-3/4 flex-grow group"
                    buttonContainerClassName="w-full text-left"
                    buttonClassName={`text-sm ${getMetaString("level") ? "" : "text-custom-text-400"}`}
                    hideIcon
                    disabled={isSavingMeta}
                    clearIconClassName="h-3 w-3 hidden group-hover:inline"
                  />
                </div>

                <div className="flex h-8 w-full items-center gap-3">
                  <div className="flex w-1/4 flex-shrink-0 items-center gap-1 text-sm text-custom-text-300">
                    <User className="h-4 w-4 flex-shrink-0" />
                    <span>Program</span>
                  </div>
                  <ProgramDropdown
                    value={getMetaString("program")}
                    onChange={(value) => void updateEditableMeta("program", value)}
                    placeholder="Add program"
                    buttonVariant="transparent-with-text"
                    className="w-3/4 flex-grow group"
                    buttonContainerClassName="w-full text-left"
                    buttonClassName={`text-sm ${getMetaString("program") ? "" : "text-custom-text-400"}`}
                    hideIcon
                    disabled={isSavingMeta}
                    clearIconClassName="h-3 w-3 hidden group-hover:inline"
                  />
                </div>

                <div className="flex h-8 w-full items-center gap-3">
                  <div className="flex w-1/4 flex-shrink-0 items-center gap-1 text-sm text-custom-text-300">
                    <Volleyball className="h-4 w-4 flex-shrink-0" />
                    <span>Sport</span>
                  </div>
                  <SportDropdown
                    value={getMetaString("sport")}
                    onChange={(value) => void updateEditableMeta("sport", value)}
                    placeholder="Add sport"
                    buttonVariant="transparent-with-text"
                    className="w-3/4 flex-grow group"
                    buttonContainerClassName="w-full text-left"
                    buttonClassName={`text-sm ${getMetaString("sport") ? "" : "text-custom-text-400"}`}
                    hideIcon
                    disabled={isSavingMeta}
                    clearIconClassName="h-3 w-3 hidden group-hover:inline"
                  />
                </div>

                <div className="flex h-8 w-full items-center gap-3">
                  <div className="flex w-1/4 flex-shrink-0 items-center gap-1 text-sm text-custom-text-300">
                    <Handshake className="h-4 w-4 flex-shrink-0" />
                    <span>Opposition</span>
                  </div>
                  <div className="w-3/4">
                    <OppositionTeamProperty
                      storageKey={`opp-team-media-${item.id}`}
                      value={oppositionTeamValue}
                      onChange={(team) => void updateEditableMeta("opposition", team)}
                      disabled={isSavingMeta}
                    />
                  </div>
                </div>

                <div className="flex h-8 w-full items-center gap-3">
                  <div className="flex w-1/4 flex-shrink-0 items-center gap-1 text-sm text-custom-text-300">
                    <Tag className="h-4 w-4 flex-shrink-0" />
                    <span>Category</span>
                  </div>
                  <CategoryDropdown
                    value={getMetaString("category")}
                    onChange={(value) => void updateEditableMeta("category", value)}
                    placeholder="Add category"
                    buttonVariant="transparent-with-text"
                    className="w-3/4 flex-grow group"
                    buttonContainerClassName="w-full text-left"
                    buttonClassName={`text-sm ${getMetaString("category") ? "" : "text-custom-text-400"}`}
                    hideIcon
                    disabled={isSavingMeta}
                    clearIconClassName="h-3 w-3 hidden group-hover:inline"
                  />
                </div>

                <div className="flex h-8 w-full items-center gap-3">
                  <div className="flex w-1/4 flex-shrink-0 items-center gap-1 text-sm text-custom-text-300">
                    <Calendar className="h-4 w-4 flex-shrink-0" />
                    <span>Season</span>
                  </div>
                  <YearRangeDropdown
                    value={getMetaString("season")}
                    onChange={(value) => void updateEditableMeta("season", value)}
                    placeholder="Add season"
                    buttonVariant="transparent-with-text"
                    className="w-3/4 flex-grow group"
                    buttonContainerClassName="w-full text-left"
                    buttonClassName={`text-sm ${getMetaString("season") ? "" : "text-custom-text-400"}`}
                    hideIcon
                    disabled={isSavingMeta}
                    clearIconClassName="h-3 w-3 hidden group-hover:inline"
                  />
                </div>
              </div>
            </div>

            {additionalMetaEntries.length > 0 ? (
              <div className="space-y-3">
                <h6 className="text-sm font-medium text-custom-text-100">Metadata</h6>
                <div className="space-y-2">
                  {additionalMetaEntries.map(([key, value]) => (
                    <div key={key} className="flex items-start justify-between gap-3 text-sm">
                      <span className="text-custom-text-300">{formatMetaLabel(key)}</span>
                      <span
                        className="ml-auto block max-w-[65%] truncate text-right text-custom-text-100"
                        title={getFormattedAdditionalMetaValue(key, value)}
                      >
                        {getFormattedAdditionalMetaValue(key, value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={sidebarClassName}>
      <DetailIssueOverview embedIssue mediaItem={item} onMediaItemUpdated={onMediaItemUpdated} />
    </div>
  );
};
