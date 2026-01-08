"use client";

import { useEffect, useMemo, useState } from "react";

import { MediaLibraryService } from "@/services/media-library.service";
import type { TMediaItem } from "./media-items";
import { mapArtifactsToMediaItems } from "./media-items";

export const useMediaLibraryItems = (workspaceSlug?: string, projectId?: string) => {
  const [items, setItems] = useState<TMediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const mediaLibraryService = useMemo(() => new MediaLibraryService(), []);

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
        const artifacts = await mediaLibraryService.getArtifacts(workspaceSlug, projectId, packageId);
        if (isMounted) {
          setItems(mapArtifactsToMediaItems(artifacts, { workspaceSlug, projectId, packageId }));
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
  }, [mediaLibraryService, projectId, workspaceSlug]);

  return { items, isLoading };
};
