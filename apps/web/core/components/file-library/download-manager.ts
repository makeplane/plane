/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * Tiny external store tracking in-flight ZIP exports so the UI can show
 * persistent progress (toasts are ephemeral). Consumed via
 * useSyncExternalStore from the downloads panel.
 */

export type TDownloadStatus = "preparing" | "downloading" | "done" | "error";

export type TDownloadItem = {
  id: string;
  label: string;
  status: TDownloadStatus;
  receivedBytes: number;
  fileCount: number;
  startedAt: number;
};

let items: TDownloadItem[] = [];
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((listener) => listener());

export const downloadManager = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  getSnapshot(): TDownloadItem[] {
    return items;
  },
  start(label: string, fileCount: number): string {
    const id = `download-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    items = [
      ...items,
      { id, label, status: "preparing", receivedBytes: 0, fileCount, startedAt: Date.now() },
    ];
    emit();
    return id;
  },
  update(id: string, patch: Partial<Omit<TDownloadItem, "id">>) {
    items = items.map((item) => (item.id === id ? { ...item, ...patch } : item));
    emit();
  },
  dismiss(id: string) {
    items = items.filter((item) => item.id !== id);
    emit();
  },
};
