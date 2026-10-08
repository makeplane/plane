/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

export type TTimezoneObject = {
  utc_offset: string;
  gmt_offset: string;
  label: string;
  value: string;
};

export type TTimezones = { timezones: TTimezoneObject[] };
