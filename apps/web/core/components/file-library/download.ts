/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * Shared download helper for Files and Contracts. A single file downloads
 * directly through the attachment endpoint; multiple files are fetched via
 * their presigned URLs (same CORS path the in-app viewers already use) and
 * bundled into one ZIP client-side (fflate).
 */

import { zip, type Zippable } from "fflate";
// services
import { fileLibraryService } from "@/services/file-library.service";

export type TDownloadTarget = {
  assetId: string;
  name: string;
};

/** Parallel presigned fetches, capped so large batches don't stampede */
const FETCH_CONCURRENCY = 4;

const triggerBlobDownload = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  // Give the browser a beat to start the download before revoking
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
};

const uniqueName = (name: string, used: Set<string>) => {
  let candidate = name || "archivo";
  let counter = 2;
  while (used.has(candidate)) {
    const dot = name.lastIndexOf(".");
    candidate = dot > 0 ? `${name.slice(0, dot)} (${counter})${name.slice(dot)}` : `${name} (${counter})`;
    counter += 1;
  }
  used.add(candidate);
  return candidate;
};

/**
 * Downloads the given assets. One file goes straight to the browser; more
 * than one is zipped into `<zipBaseName>-<date>.zip`.
 */
export async function downloadAssets(workspaceSlug: string, targets: TDownloadTarget[], zipBaseName = "archivos") {
  if (targets.length === 0) return;

  if (targets.length === 1) {
    const anchor = document.createElement("a");
    anchor.href = fileLibraryService.getFileDownloadUrl(workspaceSlug, targets[0].assetId);
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    return;
  }

  // Fetch every file (bounded concurrency), then zip
  const usedNames = new Set<string>();
  const entries: Zippable = {};
  let cursor = 0;
  const workers = Array.from({ length: Math.min(FETCH_CONCURRENCY, targets.length) }, async () => {
    while (cursor < targets.length) {
      const target = targets[cursor];
      cursor += 1;
      const url = await fileLibraryService.getPresignedViewUrl(workspaceSlug, target.assetId);
      const response = await fetch(url);
      if (!response.ok) throw new Error(`download failed for ${target.name}: ${response.status}`);
      const buffer = new Uint8Array(await response.arrayBuffer());
      // Files are mostly already-compressed formats (PDF/images) — store, don't deflate
      entries[uniqueName(target.name, usedNames)] = [buffer, { level: 0 }];
    }
  });
  await Promise.all(workers);

  const zipped = await new Promise<Uint8Array>((resolve, reject) => {
    zip(entries, (error, data) => (error ? reject(error) : resolve(data)));
  });

  const date = new Date().toISOString().slice(0, 10);
  triggerBlobDownload(new Blob([zipped.buffer as ArrayBuffer], { type: "application/zip" }), `${zipBaseName}-${date}.zip`);
}
