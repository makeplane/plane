/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * Copyright (c) 2026-present Okręgowa Spółdzielnia Mleczarska w Piątnicy
 * SPDX-License-Identifier: AGPL-3.0-only
 * Modified by Okręgowa Spółdzielnia Mleczarska w Piątnicy in 2026.
 * See the LICENSE file for details.
 */

import type { TIssueOrderByDirection, TIssueOrderByField, TIssueOrderByOptions } from "@plane/types";

/**
 * Work item order by keys encode the direction as a "-" prefix ("-created_at" is descending).
 * These helpers split a key into what is sorted on and how, and join them back.
 */

export const getIssueOrderByField = (orderBy: TIssueOrderByOptions): TIssueOrderByField =>
  (orderBy.startsWith("-") ? orderBy.slice(1) : orderBy) as TIssueOrderByField;

export const getIssueOrderByDirection = (orderBy: TIssueOrderByOptions): TIssueOrderByDirection =>
  orderBy.startsWith("-") ? "desc" : "asc";

export const buildIssueOrderBy = (field: TIssueOrderByField, direction: TIssueOrderByDirection): TIssueOrderByOptions =>
  (direction === "desc" ? `-${field}` : field) as TIssueOrderByOptions;
