"use client";

import type { ReactNode } from "react";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { TMediaItem } from "./media-items";
import { loadUploadedMediaItems, persistUploadedMediaItem } from "./media-uploads";

type TMediaLibraryContext = {
  isUploadOpen: boolean;
  openUpload: () => void;
  closeUpload: () => void;
  libraryVersion: number;
  refreshLibrary: () => void;
  uploadedItems: TMediaItem[];
  addUploadedItem: (item: TMediaItem, file: File) => Promise<void>;
};

const MediaLibraryContext = createContext<TMediaLibraryContext | null>(null);

export const MediaLibraryProvider = ({ children }: { children: ReactNode }) => {
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [libraryVersion, setLibraryVersion] = useState(0);
  const [uploadedItems, setUploadedItems] = useState<TMediaItem[]>([]);

  const openUpload = useCallback(() => setIsUploadOpen(true), []);
  const closeUpload = useCallback(() => setIsUploadOpen(false), []);
  const refreshLibrary = useCallback(() => setLibraryVersion((prev) => prev + 1), []);
  const addUploadedItem = useCallback(async (item: TMediaItem, file: File) => {
    await persistUploadedMediaItem(item, file);
    setUploadedItems((prev) => [item, ...prev]);
  }, []);

  useEffect(() => {
    let isMounted = true;
    loadUploadedMediaItems()
      .then((items) => {
        if (isMounted) setUploadedItems(items);
      })
      .catch(() => {
        if (isMounted) setUploadedItems([]);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const value = useMemo(
    () => ({
      isUploadOpen,
      openUpload,
      closeUpload,
      libraryVersion,
      refreshLibrary,
      uploadedItems,
      addUploadedItem,
    }),
    [isUploadOpen, openUpload, closeUpload, libraryVersion, refreshLibrary, uploadedItems, addUploadedItem]
  );

  return <MediaLibraryContext.Provider value={value}>{children}</MediaLibraryContext.Provider>;
};

export const useMediaLibrary = () => {
  const context = useContext(MediaLibraryContext);
  if (!context) throw new Error("useMediaLibrary must be used within MediaLibraryProvider");
  return context;
};
