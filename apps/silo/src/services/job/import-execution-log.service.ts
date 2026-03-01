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

import { logger } from "@plane/logger";
import { APIService } from "@/services/api.service";
// types
import type { ClientOptions } from "@/types";
import type { TExecutionLogRecord } from "@/lib/execution-log/types";

export class ImportExecutionLogAPIService extends APIService {
  constructor(options: ClientOptions) {
    super(options);
  }

  /**
   * Bulk create execution logs for a specific report
   * @param jobId
   * @param reportId
   * @param data Array of execution log records
   * @returns Promise<void>
   */
  async createExecutionLogs(jobId: string, reportId: string, data: TExecutionLogRecord[]): Promise<void> {
    return this.post(`/api/v1/execution-logs/jobs/${jobId}/reports/${reportId}/execution-logs/`, data)
      .then((response) => response.data)
      .catch((error) => {
        logger.error(error?.response?.data);
        throw error?.response?.data;
      });
  }

  /**
   * Generate summary for a specific report
   * @param jobId
   * @param reportId
   * @returns Promise<void>
   */
  async triggerExecutionSummaryGeneration(jobId: string, reportId: string): Promise<void> {
    return this.post(`/api/v1/jobs/${jobId}/reports/${reportId}/trigger-summary-generation/`)
      .then((response) => response.data)
      .catch((error) => {
        logger.error(error?.response?.data);
        throw error?.response?.data;
      });
  }
}
