"use client";

import type { ReactNode } from "react";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { FilterInstance } from "@plane/shared-state";
import type { TFilterConfig } from "@plane/types";

import type { TMediaLibraryExternalFilter, TMediaLibraryFilterProperty } from "./media-library-filters";
import { mediaLibraryFiltersAdapter } from "./media-library-filters";

type TMediaLibraryContext = {
  isUploadOpen: boolean;
  openUpload: () => void;
  closeUpload: () => void;
  libraryVersion: number;
  refreshLibrary: () => void;
  mediaFilters: FilterInstance<TMediaLibraryFilterProperty, TMediaLibraryExternalFilter>;
  setMediaFilterConfigs: (configs: TFilterConfig<TMediaLibraryFilterProperty, string>[]) => void;
};

const MediaLibraryContext = createContext<TMediaLibraryContext | null>(null);

export const MediaLibraryProvider = ({ children }: { children: ReactNode }) => {
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [libraryVersion, setLibraryVersion] = useState(0);
  const [filterConfigs, setFilterConfigs] = useState<TFilterConfig<TMediaLibraryFilterProperty, string>[]>([]);

  const openUpload = useCallback(() => setIsUploadOpen(true), []);
  const closeUpload = useCallback(() => setIsUploadOpen(false), []);
  const refreshLibrary = useCallback(() => setLibraryVersion((prev) => prev + 1), []);
  const mediaFilters = useMemo(
    () =>
      new FilterInstance<TMediaLibraryFilterProperty, TMediaLibraryExternalFilter>({
        adapter: mediaLibraryFiltersAdapter,
      }),
    []
  );

  useEffect(() => {
    mediaFilters.configManager.setAreConfigsReady(true);
    mediaFilters.configManager.registerAll(filterConfigs);
  }, [filterConfigs, mediaFilters]);

  const value = useMemo(
    () => ({
      isUploadOpen,
      openUpload,
      closeUpload,
      libraryVersion,
      refreshLibrary,
      mediaFilters,
      setMediaFilterConfigs: setFilterConfigs,
    }),
    [isUploadOpen, openUpload, closeUpload, libraryVersion, refreshLibrary, mediaFilters]
  );

  return <MediaLibraryContext.Provider value={value}>{children}</MediaLibraryContext.Provider>;
};

export const useMediaLibrary = () => {
  const context = useContext(MediaLibraryContext);
  if (!context) throw new Error("useMediaLibrary must be used within MediaLibraryProvider");
  return context;
};
