/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * Shared download helper for Files and Contracts. A single file downloads
 * directly through the attachment endpoint; multiple files stream from the
 * backend's ZIP export endpoint (zipped on the fly server-side) while the
 * downloads panel shows live progress.
 */

// plane imports
import { API_BASE_URL } from "@plane/constants";
// services
import { fileLibraryService } from "@/services/file-library.service";
// local imports
import { downloadManager } from "./download-manager";

export type TDownloadTarget = {
  assetId: string;
  name: string;
};

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

/** Streaming endpoint fast-path cap; larger batches run on the bg worker */
const STREAMING_LIMIT = 300;
const EXPORT_POLL_MS = 3000;
const EXPORT_POLL_MAX_ATTEMPTS = 1200; // ~1 hour

/**
 * Large exports build on the background worker (issue-exporter pattern): the
 * ZIP is assembled and uploaded to S3, then downloaded via presigned URL.
 * The downloads panel tracks the whole lifecycle.
 */
async function downloadViaBackgroundExport(workspaceSlug: string, targets: TDownloadTarget[], filename: string) {
  const downloadId = downloadManager.start(filename, targets.length);
  try {
    const { export_id } = await fileLibraryService.createBulkExport(
      workspaceSlug,
      targets.map((target) => target.assetId)
    );
    for (let attempt = 0; attempt < EXPORT_POLL_MAX_ATTEMPTS; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, EXPORT_POLL_MS));
      const { status, url } = await fileLibraryService.getExportStatus(workspaceSlug, export_id);
      if (status === "completed" && url) {
        // Presigned S3 URL — the browser downloads straight from storage
        const anchor = document.createElement("a");
        anchor.href = url;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        downloadManager.update(downloadId, { status: "done" });
        return;
      }
      if (status === "failed") throw new Error("export failed");
    }
    throw new Error("export timed out");
  } catch (error) {
    downloadManager.update(downloadId, { status: "error" });
    throw error;
  }
}

/**
 * Downloads the given assets. One file goes straight to the browser; small
 * batches stream from the export endpoint; anything larger builds on the
 * background worker — no size limit either way.
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

  if (targets.length > STREAMING_LIMIT) {
    const date = new Date().toISOString().slice(0, 10);
    await downloadViaBackgroundExport(workspaceSlug, targets, `${zipBaseName}-${date}.zip`);
    return;
  }

  const date = new Date().toISOString().slice(0, 10);
  const filename = `${zipBaseName}-${date}.zip`;
  const downloadId = downloadManager.start(filename, targets.length);

  try {
    const query = targets.map((target) => `asset_id=${encodeURIComponent(target.assetId)}`).join("&");
    const response = await fetch(`${API_BASE_URL}/api/workspaces/${workspaceSlug}/file-library/export/?${query}`, {
      credentials: "include",
    });
    if (!response.ok || !response.body) {
      throw new Error(`export failed: ${response.status}`);
    }

    downloadManager.update(downloadId, { status: "downloading" });
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let receivedBytes = 0;
    let lastReported = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      receivedBytes += value.length;
      // Throttle store updates to every 256KB so big files don't spam renders
      if (receivedBytes - lastReported > 256 * 1024) {
        lastReported = receivedBytes;
        downloadManager.update(downloadId, { receivedBytes });
      }
    }

    triggerBlobDownload(new Blob(chunks as BlobPart[], { type: "application/zip" }), filename);
    downloadManager.update(downloadId, { status: "done", receivedBytes });
  } catch (error) {
    downloadManager.update(downloadId, { status: "error" });
    throw error;
  }
}
