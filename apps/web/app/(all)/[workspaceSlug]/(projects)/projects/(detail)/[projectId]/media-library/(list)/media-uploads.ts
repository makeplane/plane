"use client";

import type { TMediaItem } from "./media-items";

type TStoredUpload = {
  id: string;
  title: string;
  format: string;
  action: string;
  link?: string | null;
  author: string;
  createdAt: string;
  views: number;
  duration: string;
  primaryTag: string;
  secondaryTag: string;
  itemsCount: number;
  meta?: Record<string, unknown>;
  mediaType: "video" | "image" | "document";
  docs: string[];
  uploadedAt: number;
  blob: Blob;
};

const DB_NAME = "media-library";
const DB_VERSION = 1;
const STORE_NAME = "uploads";

const formatUploadDate = (value: number) => {
  if (!Number.isFinite(value)) return "";
  const date = new Date(value);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const openDatabase = () =>
  new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

const getAllStoredUploads = async (): Promise<TStoredUpload[]> => {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => resolve((request.result as TStoredUpload[]) ?? []);
    request.onerror = () => reject(request.error);
  });
};

export const loadUploadedMediaItems = async (): Promise<TMediaItem[]> => {
  const stored = await getAllStoredUploads();
  return stored
    .sort((a, b) => b.uploadedAt - a.uploadedAt)
    .map((item) => {
      const objectUrl = URL.createObjectURL(item.blob);
      const createdAt = formatUploadDate(item.uploadedAt) || item.createdAt;
      const action =
        item.action ||
        (item.mediaType === "video" ? "play" : item.mediaType === "image" ? "view" : "download");
      return {
        id: item.id,
        title: item.title,
        format: item.format ?? "",
        action,
        link: item.link ?? null,
        author: item.author,
        createdAt,
        views: item.views,
        duration: item.duration,
        primaryTag: item.primaryTag,
        secondaryTag: item.secondaryTag,
        itemsCount: item.itemsCount,
        meta: item.meta ?? {},
        mediaType: item.mediaType,
        thumbnail: item.mediaType === "image" ? objectUrl : "",
        videoSrc: item.mediaType === "video" ? objectUrl : undefined,
        fileSrc: item.mediaType === "document" ? objectUrl : undefined,
        docs: item.docs,
      };
    });
};

export const persistUploadedMediaItem = async (item: TMediaItem, file: File) => {
  const format = item.format || file.name.split(".").pop()?.toLowerCase() || "";
  const db = await openDatabase();
  const stored: TStoredUpload = {
    id: item.id,
    title: item.title,
    format,
    action: item.action,
    link: item.link ?? null,
    author: item.author,
    createdAt: item.createdAt,
    views: item.views,
    duration: item.duration,
    primaryTag: item.primaryTag,
    secondaryTag: item.secondaryTag,
    itemsCount: item.itemsCount,
    meta: item.meta ?? {},
    mediaType: item.mediaType,
    docs: item.docs,
    uploadedAt: Date.now(),
    blob: file,
  };

  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(stored);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};
