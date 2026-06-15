/**
 * Copyright (c) 2023-present Gizmo Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TMailAddress } from "@plane/types";

export const formatMailAddress = (addresses: TMailAddress[] = []) => {
  if (!addresses.length) return "";
  return addresses.map((address) => address.name || address.email).join(", ");
};

export const formatMailDate = (date?: string) => {
  if (!date) return "";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date;
  return new Intl.DateTimeFormat("ru", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
};

export const splitRecipients = (value: string) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
