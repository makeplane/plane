"use client";

import type { ReactNode } from "react";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { FilterInstance } from "@plane/shared-state";
import type { TFilterConfig, TFilterValue } from "@plane/types";

import type { TMediaLibraryExternalFilter, TMediaLibraryFilterProperty } from "../utils/media-library-filters";
import { mediaLibraryFiltersAdapter } from "../utils/media-library-filters";

type TMediaLibraryContext = {
  isUploadOpen: boolean;
  pendingUploadFiles: File[];
  openUpload: () => void;
  closeUpload: () => void;
  setPendingUploadFiles: (files: File[]) => void;
  libraryVersion: number;
  refreshLibrary: () => void;
  mediaFilters: FilterInstance<TMediaLibraryFilterProperty, TMediaLibraryExternalFilter>;
  setMediaFilterConfigs: (configs: TFilterConfig<TMediaLibraryFilterProperty, TFilterValue>[]) => void;
};

const MediaLibraryContext = createContext<TMediaLibraryContext | null>(null);
const SECTION_PATH_SEGMENT = "/media-library/section/";

export const MediaLibraryProvider = ({ children }: { children: ReactNode }) => {
  const pathname = usePathname();
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [pendingUploadFiles, setPendingUploadFiles] = useState<File[]>([]);
  const [libraryVersion, setLibraryVersion] = useState(0);
  const filterInstancesRef = useRef(
    new Map<string, FilterInstance<TMediaLibraryFilterProperty, TMediaLibraryExternalFilter>>()
  );
  const filterConfigsRef = useRef(new Map<string, TFilterConfig<TMediaLibraryFilterProperty, TFilterValue>[]>());

  const openUpload = useCallback(() => setIsUploadOpen(true), []);
  const closeUpload = useCallback(() => {
    setPendingUploadFiles([]);
    setIsUploadOpen(false);
  }, []);
  const refreshLibrary = useCallback(() => setLibraryVersion((prev) => prev + 1), []);
  const activeScopeKey = useMemo(() => {
    const markerIndex = pathname.indexOf(SECTION_PATH_SEGMENT);
    if (markerIndex === -1) return "all";
    const rawSectionName =
      pathname
        .slice(markerIndex + SECTION_PATH_SEGMENT.length)
        .split("/")[0]
        ?.trim() ?? "";
    if (!rawSectionName) return "all";
    try {
      return `section:${decodeURIComponent(rawSectionName)}`;
    } catch {
      return `section:${rawSectionName}`;
    }
  }, [pathname]);
  const mediaFilters = useMemo(() => {
    const existing = filterInstancesRef.current.get(activeScopeKey);
    if (existing) return existing;
    const nextInstance = new FilterInstance<TMediaLibraryFilterProperty, TMediaLibraryExternalFilter>({
      adapter: mediaLibraryFiltersAdapter,
    });
    filterInstancesRef.current.set(activeScopeKey, nextInstance);
    return nextInstance;
  }, [activeScopeKey]);

  useEffect(() => {
    const configs = filterConfigsRef.current.get(activeScopeKey) ?? [];
    mediaFilters.configManager.setAreConfigsReady(true);
    mediaFilters.configManager.registerAll(configs);
  }, [activeScopeKey, mediaFilters]);

  const setMediaFilterConfigs = useCallback(
    (configs: TFilterConfig<TMediaLibraryFilterProperty, TFilterValue>[]) => {
      filterConfigsRef.current.set(activeScopeKey, configs);
      mediaFilters.configManager.setAreConfigsReady(true);
      mediaFilters.configManager.registerAll(configs);
    },
    [activeScopeKey, mediaFilters]
  );

  const value = useMemo(
    () => ({
      isUploadOpen,
      pendingUploadFiles,
      openUpload,
      closeUpload,
      setPendingUploadFiles,
      libraryVersion,
      refreshLibrary,
      mediaFilters,
      setMediaFilterConfigs,
    }),
    [
      isUploadOpen,
      pendingUploadFiles,
      openUpload,
      closeUpload,
      setPendingUploadFiles,
      libraryVersion,
      refreshLibrary,
      mediaFilters,
      setMediaFilterConfigs,
    ]
  );

  return <MediaLibraryContext.Provider value={value}>{children}</MediaLibraryContext.Provider>;
};

export const useMediaLibrary = () => {
  const context = useContext(MediaLibraryContext);
  if (!context) throw new Error("useMediaLibrary must be used within MediaLibraryProvider");
  return context;
};
