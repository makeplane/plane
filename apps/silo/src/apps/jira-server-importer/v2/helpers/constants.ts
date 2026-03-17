/**
 * SPDX-FileCopyrightText: 2026-present Plane Software, Inc.
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

export const KNOWN_CUSTOM_FIELDS = {
  EPIC_LINK: "Epic Link",
  START_DATE: "Start Date",
  COMPLETION_DATE: "Completion Date",
};

export const KNOWN_CUSTOM_FIELDS_REVERSE_MAP = Object.entries(KNOWN_CUSTOM_FIELDS).reduce(
  (acc, [key, value]) => {
    acc[value] = key as keyof typeof KNOWN_CUSTOM_FIELDS;
    return acc;
  },
  {} as Record<string, keyof typeof KNOWN_CUSTOM_FIELDS>
);
