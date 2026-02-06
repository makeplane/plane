"use client";

import { useEffect, useMemo, useState } from "react";

import { MediaLibraryService } from "@/services/media-library.service";
import type { TMediaItem } from "../types";
import { mapArtifactsToMediaItems } from "../utils/media-items";

export const useMediaLibraryItem = (
  workspaceSlug?: string,
  projectId?: string,
  mediaId?: string,
  refreshKey?: number
) => {
  const [item, setItem] = useState<TMediaItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const mediaLibraryService = useMemo(() => new MediaLibraryService(), []);
  const normalizedId = useMemo(() => {
    if (!mediaId) return "";
    try {
      return decodeURIComponent(mediaId);
    } catch {
      return mediaId;
    }
  }, [mediaId]);

  useEffect(() => {
    if (!workspaceSlug || !projectId || !normalizedId) return;
    let isMounted = true;
    setIsLoading(true);
    setItem(null);

    const load = async () => {
      try {
        const manifest = await mediaLibraryService.ensureProjectLibrary(workspaceSlug, projectId);
        const packageId = typeof manifest?.id === "string" ? manifest.id : null;
        const metadataMap =
          manifest && typeof manifest === "object" && manifest.metadata && typeof manifest.metadata === "object"
            ? (manifest.metadata as Record<string, Record<string, unknown>>)
            : undefined;
        if (!packageId) {
          if (isMounted) setItem(null);
          return;
        }
        const artifacts = await mediaLibraryService.getArtifactDetail(
          workspaceSlug,
          projectId,
          packageId,
          normalizedId
        );
        const mappedItems = mapArtifactsToMediaItems(Array.isArray(artifacts) ? artifacts : [], {
          workspaceSlug,
          projectId,
          packageId,
          metadata: metadataMap,
        });
        const resolved = mappedItems.find((entry) => entry.id === normalizedId) ?? null;
        if (isMounted) setItem(resolved);
      } catch {
        if (isMounted) setItem(null);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    void load();

    return () => {
      isMounted = false;
    };
  }, [mediaLibraryService, normalizedId, projectId, refreshKey, workspaceSlug]);

  return { item, isLoading };
};
