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

export const RELEASE_STATES = {
  unreleased: {
    key: "unreleased",
    title: "Unreleased",
    color: "#EB6200",
    sortOrder: 1,
  },
  released: {
    key: "released",
    title: "Released",
    color: "#00A63E",
    sortOrder: 2,
  },
  cancelled: {
    key: "cancelled",
    title: "Cancelled",
    color: "#60646C",
    sortOrder: 3,
  },
} as const;

export const DEFAULT_RELEASE_STATUS = RELEASE_STATES.unreleased.key;

export const RELEASE_ERROR_DETAILS: Record<string, { i18n_message: string }> = {
  RELEASE_NOT_FOUND: {
    i18n_message: "workspace_settings.settings.releases.errors.release_not_found",
  },
};
