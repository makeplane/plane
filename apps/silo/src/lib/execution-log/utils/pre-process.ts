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

import { EExecutionLogLevel } from "../types";
import type { TExecutionLogRecord } from "../types";

/**
 * Squashes INFO level logs by recordType and phase, aggregating metrics
 * @param logs - Array of execution log records to squash
 * @returns Array with squashed INFO logs and unchanged ERROR/SUCCESS logs
 */
export function squashInfoLogs(logs: TExecutionLogRecord[]): TExecutionLogRecord[] {
  const infoLogs = logs.filter((log) => log.level === EExecutionLogLevel.INFO && !log.ignore_summarization);
  const otherLogs = logs.filter((log) => log.level !== EExecutionLogLevel.INFO || log.ignore_summarization);

  // Group by entity_type + phase
  const grouped = new Map<string, TExecutionLogRecord[]>();

  for (const log of infoLogs) {
    const key = `${log.entity_type}::${log.phase || "default"}`;
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(log);
  }

  // Squash each group
  const squashed: TExecutionLogRecord[] = [];

  for (const [key, group] of grouped.entries()) {
    const first = group[0];
    const aggregated: TExecutionLogRecord = {
      entity_type: first.entity_type,
      phase: first.phase,
      level: EExecutionLogLevel.INFO,
      metrics: {
        total: 0,
        pulled: 0,
        imported: 0,
        errored: 0,
        already_existed: 0,
      },
      additional_data: {},
    };

    // Sum metrics and merge data
    for (const log of group) {
      // Type guard: we know these are INFO logs, but TypeScript needs explicit check
      if (log.level === EExecutionLogLevel.INFO && log.metrics) {
        aggregated.metrics!.total = Math.max(aggregated.metrics!.total! || 0, log.metrics.total || 0);
        aggregated.metrics!.pulled! += log.metrics.pulled || 0;
        aggregated.metrics!.imported! += log.metrics.imported || 0;
        aggregated.metrics!.errored! += log.metrics.errored || 0;
        aggregated.metrics!.already_existed! += log.metrics.already_existed || 0;
      }
      if (log.additional_data) {
        aggregated.additional_data = { ...aggregated.additional_data, ...log.additional_data };
      }
      if (log.related_entity && !aggregated.related_entity) {
        aggregated.related_entity = log.related_entity;
      }
    }

    squashed.push(aggregated);
  }

  return [...otherLogs, ...squashed];
}
