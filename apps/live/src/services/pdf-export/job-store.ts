/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { EventEmitter } from "events";
import type { PdfExportJob, TJobStage, TProgressCallback, TProgressEvent } from "./types";

const COMPLETED_JOB_TTL = 10 * 60 * 1000;
const FAILED_JOB_TTL = 60 * 60 * 1000;
const CLEANUP_INTERVAL = 60 * 1000;

class JobStore {
  private jobs = new Map<string, PdfExportJob>();
  private emitter = new EventEmitter();
  private cleanupTimer: ReturnType<typeof setInterval>;

  constructor() {
    this.emitter.setMaxListeners(100);
    this.cleanupTimer = setInterval(() => this.cleanup(), CLEANUP_INTERVAL);
  }

  createJob(id: string): PdfExportJob {
    const job: PdfExportJob = {
      id,
      status: "pending",
      stage: "queued",
      progress: 0,
      message: "Job queued",
      pdfBuffer: null,
      outputFileName: "",
      error: null,
      createdAt: Date.now(),
      completedAt: null,
    };
    this.jobs.set(id, job);
    return job;
  }

  getJob(id: string): PdfExportJob | undefined {
    return this.jobs.get(id);
  }

  updateProgress(id: string, stage: TJobStage, progress: number, message: string): void {
    const job = this.jobs.get(id);
    if (!job) return;

    job.stage = stage;
    job.progress = Math.min(Math.max(progress, 0), 100);
    job.message = message;
    job.status = "running";

    const event: TProgressEvent = {
      jobId: id,
      stage,
      progress: job.progress,
      message,
      timestamp: Date.now(),
    };
    this.emitter.emit(`progress:${id}`, event);
  }

  completeJob(id: string, buffer: Buffer, fileName: string): void {
    const job = this.jobs.get(id);
    if (!job) return;

    job.status = "complete";
    job.stage = "complete";
    job.progress = 100;
    job.message = "PDF export complete";
    job.pdfBuffer = buffer;
    job.outputFileName = fileName;
    job.completedAt = Date.now();

    const event: TProgressEvent = {
      jobId: id,
      stage: "complete",
      progress: 100,
      message: "PDF export complete",
      timestamp: Date.now(),
    };
    this.emitter.emit(`progress:${id}`, event);
  }

  failJob(id: string, error: string): void {
    const job = this.jobs.get(id);
    if (!job) return;

    job.status = "failed";
    job.stage = "failed";
    job.message = error;
    job.error = error;
    job.completedAt = Date.now();

    const event: TProgressEvent = {
      jobId: id,
      stage: "failed",
      progress: job.progress,
      message: error,
      timestamp: Date.now(),
    };
    this.emitter.emit(`progress:${id}`, event);
  }

  onProgress(id: string, listener: TProgressCallback): void {
    this.emitter.on(`progress:${id}`, listener);
  }

  removeProgressListener(id: string, listener: TProgressCallback): void {
    this.emitter.off(`progress:${id}`, listener);
  }

  destroy(): void {
    clearInterval(this.cleanupTimer);
    this.emitter.removeAllListeners();
    this.jobs.clear();
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [id, job] of this.jobs) {
      if (!job.completedAt) continue;
      const elapsed = now - job.completedAt;
      if (job.status === "complete" && elapsed > COMPLETED_JOB_TTL) {
        this.emitter.removeAllListeners(`progress:${id}`);
        this.jobs.delete(id);
      } else if (job.status === "failed" && elapsed > FAILED_JOB_TTL) {
        this.emitter.removeAllListeners(`progress:${id}`);
        this.jobs.delete(id);
      }
    }
  }
}

export const jobStore = new JobStore();
