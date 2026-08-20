import assert from "node:assert/strict";
import test from "node:test";

import {
  buildMediaLibraryUploadJobs,
  FALLBACK_MEDIA_LIBRARY_MAX_FILE_SIZE,
  formatFileSize,
  getUploadStatusLabel,
  getVisibleUploadProgress,
  isActiveUploadStatus,
  readMediaLibraryFileSizeLimit,
  resolveArtifactFormat,
} from "../media-library-upload-jobs.ts";

const createFile = (name, size, type = "video/mp4") =>
  new File([new Uint8Array(size)], name, {
    type,
    lastModified: 1_785_922_733_582,
  });

test("buildMediaLibraryUploadJobs creates queued background upload jobs", () => {
  const file = createFile("clip-01.mp4", 4);
  const jobs = buildMediaLibraryUploadJobs({
    workspaceSlug: "workspace-a",
    projectId: "project-a",
    files: [file],
    meta: { category: "Uploads", sport: "Football" },
    workItemId: null,
  });

  assert.equal(jobs.length, 1);
  assert.equal(jobs[0].workspaceSlug, "workspace-a");
  assert.equal(jobs[0].projectId, "project-a");
  assert.equal(jobs[0].file, file);
  assert.equal(jobs[0].status, "queued");
  assert.equal(jobs[0].progress, 0);
  assert.equal(jobs[0].meta.category, "Uploads");
  assert.match(jobs[0].uploadId, /^upload-\d{8}T\d{6}Z-clip-01-mp4-4-1785922733582$/);
});

test("upload helpers normalize size limit and display labels", () => {
  assert.equal(FALLBACK_MEDIA_LIBRARY_MAX_FILE_SIZE, 5 * 1024 * 1024 * 1024);
  assert.equal(readMediaLibraryFileSizeLimit("5368709120"), 5 * 1024 * 1024 * 1024);
  assert.equal(readMediaLibraryFileSizeLimit("bad"), null);
  assert.equal(formatFileSize(5 * 1024 * 1024 * 1024), "5GB");
  assert.equal(formatFileSize(194 * 1024 * 1024), "194MB");
});

test("resolveArtifactFormat accepts supported media and rejects unknown formats", () => {
  assert.equal(resolveArtifactFormat("game.mp4"), "mp4");
  assert.equal(resolveArtifactFormat("clip.m3u8"), "m3u8");
  assert.equal(resolveArtifactFormat("thumbnail.PNG"), "png");
  assert.equal(resolveArtifactFormat("notes.pdf"), "pdf");
  assert.equal(resolveArtifactFormat("archive.zip"), "");
});

test("upload status helpers distinguish active, completed and failed jobs", () => {
  assert.equal(isActiveUploadStatus("queued"), true);
  assert.equal(isActiveUploadStatus("uploading"), true);
  assert.equal(isActiveUploadStatus("processing"), true);
  assert.equal(isActiveUploadStatus("completed"), false);
  assert.equal(getUploadStatusLabel("processing"), "Processing");
  assert.equal(getUploadStatusLabel("failed"), "Failed");
  assert.equal(getVisibleUploadProgress({ progress: 125 }), 100);
  assert.equal(getVisibleUploadProgress({ progress: -10 }), 0);
});
