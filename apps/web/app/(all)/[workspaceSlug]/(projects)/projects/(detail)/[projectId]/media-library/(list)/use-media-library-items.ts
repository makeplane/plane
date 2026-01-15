"use client";

import { useEffect, useMemo, useState } from "react";

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
};

export const useMediaLibraryItems = (
  workspaceSlug?: string,
  projectId?: string,
  refreshKey?: number,
  options?: TMediaLibraryQueryOptions
) => {
  const [items, setItems] = useState<TMediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
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
  const desiredFormats = useMemo(
    () => formatsParam.split(",").map((entry) => entry.trim().toLowerCase()).filter(Boolean),
    [formatsParam]
  );

  useEffect(() => {
    if (!workspaceSlug || !projectId) return;
    let isMounted = true;
    setIsLoading(true);

    const load = async () => {
      try {
        const manifest = await mediaLibraryService.ensureProjectLibrary(workspaceSlug, projectId);
        const packageId = typeof manifest?.id === "string" ? manifest.id : null;
        if (!packageId) {
          if (isMounted) setItems([]);
          return;
        }
        const params: Record<string, string> = {};
        if (queryParam) params.q = queryParam;
        if (filtersParam) params.filters = filtersParam;
        if (formatsParam && !desiredFormats.includes("thumbnail")) {
          params.formats = formatsParam;
        }
        if (sectionParam) params.section = sectionParam;
        const artifacts = await mediaLibraryService.getArtifacts(workspaceSlug, projectId, packageId, params);
        if (isMounted) {
          const mappedItems = mapArtifactsToMediaItems(artifacts, { workspaceSlug, projectId, packageId });
          const filteredItems = desiredFormats.length
            ? mappedItems.filter((item) => desiredFormats.includes(item.format))
            : mappedItems;
          setItems(filteredItems);
        }
      } catch {
        if (isMounted) setItems([]);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    void load();

    return () => {
      isMounted = false;
    };
  }, [filtersParam, formatsParam, mediaLibraryService, projectId, queryParam, refreshKey, sectionParam, workspaceSlug]);

  return { items, isLoading };
};
