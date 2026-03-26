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

import { convertMinutesToHoursMinutesString, renderFormattedDate } from "@plane/utils";

/**
 * Format field values (dates, time estimates) for display.
 */
export function formatFieldValue(field: string | null, value: string | undefined): string | undefined {
  if (!value) return value;
  if (field === "start_date" || field === "target_date") return renderFormattedDate(value);
  if (field === "estimate_time") {
    const n = Number(value);
    return Number.isNaN(n) ? value : convertMinutesToHoursMinutesString(n);
  }
  return value;
}
