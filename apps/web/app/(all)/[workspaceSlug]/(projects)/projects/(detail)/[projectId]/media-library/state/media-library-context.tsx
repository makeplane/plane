"use client";

import type { ReactNode } from "react";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { FilterInstance } from "@plane/shared-state";
import type { TFilterConfig, TFilterValue } from "@plane/types";

import type { TMediaLibraryExternalFilter, TMediaLibraryFilterProperty } from "../utils/media-library-filters";
import { mediaLibraryFiltersAdapter } from "../utils/media-library-filters";

type TMediaLibraryContext = {
  isUploadOpen: boolean;
  openUpload: () => void;
  closeUpload: () => void;
  libraryVersion: number;
  refreshLibrary: () => void;
  mediaFilters: FilterInstance<TMediaLibraryFilterProperty, TMediaLibraryExternalFilter>;
  setMediaFilterConfigs: (configs: TFilterConfig<TMediaLibraryFilterProperty, TFilterValue>[]) => void;
};

const MediaLibraryContext = createContext<TMediaLibraryContext | null>(null);

export const MediaLibraryProvider = ({ children }: { children: ReactNode }) => {
  const { sectionName } = useParams() as { sectionName?: string | string[] };
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [libraryVersion, setLibraryVersion] = useState(0);
  const filterInstancesRef = useRef(
    new Map<string, FilterInstance<TMediaLibraryFilterProperty, TMediaLibraryExternalFilter>>()
  );
  const filterConfigsRef = useRef(new Map<string, TFilterConfig<TMediaLibraryFilterProperty, TFilterValue>[]>());

  const openUpload = useCallback(() => setIsUploadOpen(true), []);
  const closeUpload = useCallback(() => setIsUploadOpen(false), []);
  const refreshLibrary = useCallback(() => setLibraryVersion((prev) => prev + 1), []);
  const activeScopeKey = useMemo(() => {
    if (typeof sectionName === "string" && sectionName.trim()) {
      return `section:${decodeURIComponent(sectionName)}`;
    }
    return "all";
  }, [sectionName]);
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
      openUpload,
      closeUpload,
      libraryVersion,
      refreshLibrary,
      mediaFilters,
      setMediaFilterConfigs,
    }),
    [isUploadOpen, openUpload, closeUpload, libraryVersion, refreshLibrary, mediaFilters, setMediaFilterConfigs]
  );

  return <MediaLibraryContext.Provider value={value}>{children}</MediaLibraryContext.Provider>;
};

export const useMediaLibrary = () => {
  const context = useContext(MediaLibraryContext);
  if (!context) throw new Error("useMediaLibrary must be used within MediaLibraryProvider");
  return context;
};
