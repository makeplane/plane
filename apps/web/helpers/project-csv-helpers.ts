/**
 * Copyright (c) 2026-present Okręgowa Spółdzielnia Mleczarska w Piątnicy
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// Matches MAX_UPLOAD_BYTES on the import endpoint so the browser and the server agree
export const MAX_PROJECT_CSV_SIZE_BYTES = 15 * 1024 * 1024;

export function downloadBlob(blob: Blob, filename: string): void {
  const typedBlob =
    filename.toLowerCase().endsWith(".csv") && blob.type !== "text/csv"
      ? new Blob([blob], { type: "text/csv;charset=utf-8" })
      : blob;
  const url = window.URL.createObjectURL(typedBlob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.URL.revokeObjectURL(url);
}

export function getProjectImportLink(workspaceSlug: string, projectId: string): string {
  return `/${workspaceSlug}/projects/${projectId}/issues`;
}
