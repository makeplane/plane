/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// the collapsed state of a to-do item is a per-viewer preference, so it is kept
// in local storage instead of the document. collapsing never mutates the doc,
// which keeps it out of collaborative sync, version history and exports.
const STORAGE_KEY = "editor-taskItem-collapsed";
// ids accumulate as items are collapsed and are never explicitly cleaned up when
// a to-do item is deleted, so the list is capped to keep local storage bounded.
const MAX_STORED_IDS = 500;

const readStoredIds = (): string[] => {
  if (typeof window === "undefined") return [];
  try {
    const storedData = localStorage.getItem(STORAGE_KEY);
    if (!storedData) return [];
    const parsedData: unknown = JSON.parse(storedData);
    if (!Array.isArray(parsedData)) return [];
    return parsedData.filter((id): id is string => typeof id === "string");
  } catch (error) {
    console.error("Error parsing stored collapsed to-do items", error);
    localStorage.removeItem(STORAGE_KEY);
    return [];
  }
};

const writeStoredIds = (ids: string[]): void => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids.slice(-MAX_STORED_IDS)));
  } catch (error) {
    console.error("Error storing collapsed to-do items", error);
  }
};

// function to check whether a to-do item was collapsed by this viewer
export const isTaskItemCollapsed = (id: string | null | undefined): boolean => {
  if (!id) return false;
  return readStoredIds().includes(id);
};

// function to persist the collapsed state of a to-do item for this viewer
export const updateStoredTaskItemCollapsedState = (id: string | null | undefined, isCollapsed: boolean): void => {
  if (!id) return;
  const storedIds = readStoredIds();
  const isAlreadyStored = storedIds.includes(id);

  if (isCollapsed) {
    if (isAlreadyStored) return;
    writeStoredIds([...storedIds, id]);
  } else {
    if (!isAlreadyStored) return;
    writeStoredIds(storedIds.filter((storedId) => storedId !== id));
  }
};
