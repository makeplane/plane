"use client";

import { useEffect, useMemo, useState } from "react";

import type { TMediaArtifactsPaginatedResponse } from "@/services/media-library.service";
import { MediaLibraryService } from "@/services/media-library.service";
import type { TMediaItem } from "./media-items";
import { mapArtifactsToMediaItems } from "./media-items";

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
    () => formatsParam.split(",").map((entry) => entry.trim().toLowerCase()).filter(Boolean),
    [formatsParam]
  );
  const shouldPaginate = Boolean(perPageParam || cursorParam);

  useEffect(() => {
    if (!workspaceSlug || !projectId) return;
    let isMounted = true;
    setIsLoading(true);
    setPagination(null);

    const load = async () => {
      try {
        const manifest = await mediaLibraryService.ensureProjectLibrary(workspaceSlug, projectId);
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
        const artifactsResponse = await mediaLibraryService.getArtifacts(workspaceSlug, projectId, packageId, params);
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
          const filteredItems = desiredFormats.length
            ? mappedItems.filter((item) => desiredFormats.includes(item.format))
            : mappedItems;
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
      } catch {
        if (isMounted) setItems([]);
        if (isMounted) setPagination(null);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    void load();

    return () => {
      isMounted = false;
    };
  }, [
    cursorParam,
    filtersParam,
    formatsParam,
    mediaLibraryService,
    perPageParam,
    projectId,
    queryParam,
    refreshKey,
    sectionParam,
    workspaceSlug,
  ]);

  return { items, isLoading, pagination };
};
