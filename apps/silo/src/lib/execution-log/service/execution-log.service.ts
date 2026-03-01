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
 * NOTICE: Proprietary and confidential. Unauthorized use and distribution is prohibited.
 */

import { integrationConnectionHelper } from "@/helpers/integration-connection-helper";
import { EExecutionLogLevel } from "../types";
import type { TExecutionLogRecord } from "../types";
import { squashInfoLogs } from "../utils/pre-process";
import { logger } from "@plane/logger";

/**
 * Collects summary records for import operations, tracking successes, errors, and metadata
 */
class ExecutionLogCollector {
  private records: Map<string, TExecutionLogRecord[]> = new Map();
  private collectSuccessLogs: boolean = false; // Default: filter SUCCESS logs

  /**
   * Configure whether to collect individual SUCCESS logs
   * @param enabled - If true, collect SUCCESS logs; if false, only collect INFO metrics
   */
  setCollectSuccessLogs(enabled: boolean) {
    this.collectSuccessLogs = enabled;
  }

  /**
   * Collects a summary record for the specified report
   * @param reportId - The ID of the report to collect records for
   * @param record - The execution log record to collect
   */
  collect(jobId: string, record: TExecutionLogRecord) {
    if (!this.records.has(jobId)) {
      this.records.set(jobId, []);
    }

    const jobRecords = this.records.get(jobId)!;

    if (record.level === EExecutionLogLevel.SUCCESS) {
      if (record.already_existed) {
        // Add a new record for the information
        jobRecords.push({
          ...record,
          level: EExecutionLogLevel.INFO,
          metrics: {
            already_existed: 1,
          },
        });
      }
    }

    if (record.level === EExecutionLogLevel.ERROR) {
      if (record.entity_external_id) {
        // Add a new record for the information
        jobRecords.push({
          ...record,
          level: EExecutionLogLevel.INFO,
          metrics: {
            errored: 1,
          },
        });
      }
    }

    if (record.level === EExecutionLogLevel.SUCCESS) {
      if (record.entity_external_id && record.entity_plane_id && !record.already_existed) {
        // Add a new record for the information
        jobRecords.push({
          ...record,
          level: EExecutionLogLevel.INFO,
          metrics: {
            imported: 1,
          },
        });
      }
    }

    // Only push SUCCESS logs if explicitly enabled
    // ERROR and INFO logs are always collected
    if (record.level === EExecutionLogLevel.SUCCESS && !this.collectSuccessLogs) {
      return; // Skip SUCCESS log, keep only INFO metrics
    }

    jobRecords.push(record);
  }

  /**
   * Retrieves all collected summary records
   * @returns Array of all summary records collected so far
   */
  getRecords(jobId: string): TExecutionLogRecord[] {
    return this.records.get(jobId) ?? [];
  }

  /**
   * Pushes collected records to the import report via the new bulk API.
   * Squashes INFO level logs locally before pushing to reduce payload size.
   * @param jobId - The ID of the job to push records to
   * @param reportId - The ID of the report associated with the job
   */
  async push(jobId: string, reportId: string): Promise<void> {
    const currentExecutionLog = this.records.get(jobId) ?? [];

    if (currentExecutionLog.length === 0) {
      return;
    }

    // Squash current logs before merging
    const squashedCurrent = squashInfoLogs(currentExecutionLog);

    try {
      await integrationConnectionHelper.pushExecutionLogs({
        job_id: jobId,
        report_id: reportId,
        execution_logs: squashedCurrent,
      });
    } catch (error) {
      logger.error("Failed to push execution logs to api", error);
    }

    this.records.delete(jobId);
  }
}

/**
 * Singleton instance of ExecutionLogCollector for managing execution logs across the application
 */
export const executionLog = new ExecutionLogCollector();
