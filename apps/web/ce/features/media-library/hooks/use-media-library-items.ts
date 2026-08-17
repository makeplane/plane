"use client";

import { useEffect, useMemo, useState } from "react";

import type { TMediaArtifactsPaginatedResponse, TMediaTranscodeJobResponse } from "@/services/media-library.service";
import { MediaLibraryService } from "@/services/media-library.service";
import type { TMediaItem } from "../types/media-library.types";
import { mapArtifactsToMediaItems } from "../utils/media-items";

type TMediaLibraryFilterCondition = {
  property: string;
  operator: string;
  value: unknown;
};

type TMediaLibraryQueryOptions = {
  query?: string;
  filters?: TMediaLibraryFilterCondition[];
  formats?: string;
  section?: string;
  page?: number;
  perPage?: number;
  cursor?: string;
};

type TMediaLibraryPagination = {
  totalResults: number;
  totalPages: number;
  nextCursor?: string;
  prevCursor?: string;
  nextPageResults?: boolean;
  prevPageResults?: boolean;
};

const isRequestCanceled = (error: unknown) => {
  if (!error || typeof error !== "object") return false;
  const maybeCanceledError = error as { code?: string; name?: string };
  return (
    maybeCanceledError.code === "ERR_CANCELED" ||
    maybeCanceledError.name === "CanceledError" ||
    maybeCanceledError.name === "AbortError"
  );
};

const ACTIVE_TRANSCODE_STATUSES = new Set([
  "QUEUED",
  "CLAIMED",
  "PROBING",
  "TRANSCODING",
  "PACKAGING",
  "VALIDATING",
  "RETRY_PENDING",
  "CANCEL_REQUESTED",
]);
const FAILED_TRANSCODE_STATUSES = new Set(["FAILED", "CANCELLED"]);

const getTranscodeLabel = (status: string) => {
  switch (status) {
    case "QUEUED":
      return "Queued";
    case "CLAIMED":
    case "PROBING":
      return "Preparing";
    case "TRANSCODING":
    case "PACKAGING":
      return "Processing";
    case "VALIDATING":
      return "Finalizing";
    case "RETRY_PENDING":
      return "Retrying";
    case "CANCEL_REQUESTED":
      return "Cancelling";
    case "COMPLETED":
      return "Ready";
    case "FAILED":
      return "Failed";
    case "CANCELLED":
      return "Cancelled";
    default:
      return status.replace(/_/g, " ").toLowerCase();
  }
};

const mergeTranscodeJob = (item: TMediaItem, job: TMediaTranscodeJobResponse): TMediaItem => {
  const status = job.status;
  const progress = Math.min(100, Math.max(0, Math.round(job.progress ?? item.transcodeProgress ?? 0)));
  const isComplete = status === "COMPLETED";
  const isFailed = FAILED_TRANSCODE_STATUSES.has(status);
  const isActive = ACTIVE_TRANSCODE_STATUSES.has(status);
  return {
    ...item,
    transcodeStatus: status,
    transcodeProgress: isComplete ? 100 : progress,
    transcodeLabel: getTranscodeLabel(status),
    transcodeError: job.error?.message || job.error?.code || item.transcodeError,
    isTranscodeActive: isActive,
    isTranscodeFailed: isFailed,
    isTranscodeComplete: isComplete,
  };
};

const shouldIncludeForFormats = (item: TMediaItem, desiredFormats: string[], thumbnailTargets: Set<string>) => {
  if (desiredFormats.length === 0) return true;
  if (desiredFormats.includes(item.format)) return true;
  if (
    desiredFormats.includes("thumbnail") &&
    (item.isTranscodeActive ||
      item.isTranscodeFailed ||
      (item.mediaType === "video" && item.isTranscodeComplete && !thumbnailTargets.has(item.id)))
  ) {
    return true;
  }
  return false;
};

export const useMediaLibraryItems = (
  workspaceSlug?: string,
  projectId?: string,
  refreshKey?: number,
  options?: TMediaLibraryQueryOptions
) => {
  const [items, setItems] = useState<TMediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pagination, setPagination] = useState<TMediaLibraryPagination | null>(null);
  const mediaLibraryService = useMemo(() => new MediaLibraryService(), []);
  const filtersParam = useMemo(() => {
    if (!options?.filters?.length) return "";
    try {
      return JSON.stringify(options.filters);
    } catch {
      return "";
    }
  }, [options?.filters]);
  const queryParam = options?.query?.trim() ?? "";
  const formatsParam = options?.formats?.trim() ?? "";
  const sectionParam = options?.section?.trim() ?? "";
  const perPageParam = options?.perPage;
  const pageParam = options?.page;
  const cursorParam = useMemo(() => {
    if (options?.cursor) return options.cursor;
    if (!perPageParam) return "";
    const pageIndex = Number.isFinite(pageParam) && pageParam && pageParam > 0 ? pageParam - 1 : 0;
    return `${perPageParam}:${pageIndex}:0`;
  }, [options?.cursor, pageParam, perPageParam]);
  const desiredFormats = useMemo(
    () =>
      formatsParam
        .split(",")
        .map((entry) => entry.trim().toLowerCase())
        .filter(Boolean),
    [formatsParam]
  );
  const shouldPaginate = Boolean(perPageParam || cursorParam);

  useEffect(() => {
    if (!workspaceSlug || !projectId) return;
    let isMounted = true;
    const abortController = new AbortController();
    setIsLoading(true);
    setPagination(null);

    const load = async () => {
      try {
        const requestConfig = { signal: abortController.signal };
        const manifest = await mediaLibraryService.ensureProjectLibrary(workspaceSlug, projectId, requestConfig);
        const packageId = typeof manifest?.id === "string" ? manifest.id : null;
        const metadataMap =
          manifest && typeof manifest === "object" && manifest.metadata && typeof manifest.metadata === "object"
            ? (manifest.metadata as Record<string, Record<string, unknown>>)
            : undefined;
        if (!packageId) {
          if (isMounted) setItems([]);
          return;
        }
        const params: Record<string, string> = {};
        if (queryParam) params.q = queryParam;
        if (filtersParam) params.filters = filtersParam;
        if (formatsParam && (!desiredFormats.includes("thumbnail") || shouldPaginate)) {
          params.formats = formatsParam;
        }
        if (sectionParam) params.section = sectionParam;
        if (cursorParam) params.cursor = cursorParam;
        if (perPageParam) params.per_page = String(perPageParam);
        const artifactsResponse = await mediaLibraryService.getArtifacts(
          workspaceSlug,
          projectId,
          packageId,
          params,
          requestConfig
        );
        const paginatedResponse =
          artifactsResponse && !Array.isArray(artifactsResponse) && Array.isArray(artifactsResponse.results)
            ? (artifactsResponse as TMediaArtifactsPaginatedResponse)
            : null;
        const artifacts = paginatedResponse
          ? paginatedResponse.results
          : Array.isArray(artifactsResponse)
            ? artifactsResponse
            : [];
        if (isMounted) {
          const mappedItems = mapArtifactsToMediaItems(artifacts, {
            workspaceSlug,
            projectId,
            packageId,
            metadata: metadataMap,
          });
          const activeTranscodeItems = mappedItems.filter(
            (item) => item.packageId && item.transcodeJobId && item.isTranscodeActive
          );
          const jobResults = await Promise.all(
            activeTranscodeItems.map(async (item) => {
              try {
                const job = await mediaLibraryService.getArtifactTranscodeJob(
                  workspaceSlug,
                  projectId,
                  item.packageId ?? packageId,
                  item.id,
                  item.transcodeJobId ?? ""
                );
                return [item.id, job] as const;
              } catch {
                return [item.id, null] as const;
              }
            })
          );
          const jobByItemId = new Map<string, TMediaTranscodeJobResponse>();
          for (const [itemId, job] of jobResults) {
            if (job) jobByItemId.set(itemId, job);
          }
          if (!isMounted || abortController.signal.aborted) return;
          const hydratedItems = mappedItems.map((item) => {
            const job = jobByItemId.get(item.id);
            return job ? mergeTranscodeJob(item, job) : item;
          });
          const thumbnailTargets = new Set(
            hydratedItems
              .filter((item) => item.format === "thumbnail" && typeof item.link === "string" && item.link.trim())
              .map((item) => item.link?.trim() ?? "")
          );
          const filteredItems = desiredFormats.length
            ? hydratedItems.filter((item) => shouldIncludeForFormats(item, desiredFormats, thumbnailTargets))
            : hydratedItems;
          setItems(filteredItems);
          if (paginatedResponse) {
            setPagination({
              totalResults: paginatedResponse.total_results ?? paginatedResponse.total_count ?? filteredItems.length,
              totalPages: paginatedResponse.total_pages ?? 1,
              nextCursor: paginatedResponse.next_cursor,
              prevCursor: paginatedResponse.prev_cursor,
              nextPageResults: paginatedResponse.next_page_results,
              prevPageResults: paginatedResponse.prev_page_results,
            });
          } else {
            setPagination(null);
          }
        }
      } catch (error) {
        if (abortController.signal.aborted || isRequestCanceled(error)) return;
        if (isMounted) setItems([]);
        if (isMounted) setPagination(null);
      } finally {
        if (isMounted && !abortController.signal.aborted) setIsLoading(false);
      }
    };

    void load();

    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, [
    cursorParam,
    desiredFormats,
    filtersParam,
    formatsParam,
    mediaLibraryService,
    perPageParam,
    projectId,
    queryParam,
    refreshKey,
    sectionParam,
    shouldPaginate,
    workspaceSlug,
  ]);

  return { items, isLoading, pagination };
};
