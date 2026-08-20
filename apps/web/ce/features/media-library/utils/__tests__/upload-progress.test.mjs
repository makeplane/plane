import assert from "node:assert/strict";
import test from "node:test";

import {
  buildUploadTraceId,
  calculateUploadProgressMetrics,
  formatUploadEta,
  formatUploadSpeed,
  shouldLogUploadProgress,
} from "../upload-progress.ts";

test("buildUploadTraceId creates a safe upload correlation id", () => {
  const uploadId = buildUploadTraceId({
    fileName: "Game Clip 01.Final.mp4",
    fileSize: 203_482_999,
    lastModified: 1_785_922_733_582,
    timestampMs: Date.UTC(2026, 7, 18, 13, 8, 0),
  });

  assert.equal(uploadId, "upload-20260818T130800Z-game-clip-01-final-mp4-203482999-1785922733582");
});

test("calculateUploadProgressMetrics returns percent, speed and eta", () => {
  const metrics = calculateUploadProgressMetrics({
    loadedBytes: 50 * 1024 * 1024,
    totalBytes: 200 * 1024 * 1024,
    startedAtMs: 1_000,
    nowMs: 11_000,
  });

  assert.equal(metrics.percent, 25);
  assert.equal(metrics.uploadedBytes, 50 * 1024 * 1024);
  assert.equal(metrics.totalBytes, 200 * 1024 * 1024);
  assert.equal(metrics.speedBytesPerSecond, 5 * 1024 * 1024);
  assert.equal(metrics.etaSeconds, 30);
});

test("calculateUploadProgressMetrics handles missing total without invalid eta", () => {
  const metrics = calculateUploadProgressMetrics({
    loadedBytes: 1024,
    totalBytes: 0,
    startedAtMs: 1_000,
    nowMs: 1_000,
  });

  assert.equal(metrics.percent, 0);
  assert.equal(metrics.speedBytesPerSecond, 0);
  assert.equal(metrics.etaSeconds, null);
});

test("upload speed and eta labels are readable", () => {
  assert.equal(formatUploadSpeed(226_293), "221 KB/s");
  assert.equal(formatUploadSpeed(5.2 * 1024 * 1024), "5.2 MB/s");
  assert.equal(formatUploadEta(null), "ETA calculating");
  assert.equal(formatUploadEta(45), "ETA 45s");
  assert.equal(formatUploadEta(90), "ETA 1m 30s");
  assert.equal(formatUploadEta(3_900), "ETA 1h 5m");
});

test("shouldLogUploadProgress logs at 10 percent milestones and time fallback", () => {
  assert.equal(
    shouldLogUploadProgress({
      percent: 0,
      lastLoggedPercent: null,
      lastLoggedAtMs: null,
      nowMs: 1_000,
    }),
    true
  );
  assert.equal(
    shouldLogUploadProgress({
      percent: 9,
      lastLoggedPercent: 0,
      lastLoggedAtMs: 1_000,
      nowMs: 5_000,
    }),
    false
  );
  assert.equal(
    shouldLogUploadProgress({
      percent: 10,
      lastLoggedPercent: 0,
      lastLoggedAtMs: 1_000,
      nowMs: 5_000,
    }),
    true
  );
  assert.equal(
    shouldLogUploadProgress({
      percent: 12,
      lastLoggedPercent: 10,
      lastLoggedAtMs: 1_000,
      nowMs: 17_000,
    }),
    true
  );
});
