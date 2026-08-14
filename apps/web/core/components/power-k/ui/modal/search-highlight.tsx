/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Fragment, type ReactNode } from "react";

const REGEX_SPECIAL_CHARACTERS = /[.*+?^${}()|[\]\\]/g;

const escapeRegExp = (value: string) => value.replace(REGEX_SPECIAL_CHARACTERS, "\\$&");

export function highlightSearchMatches(text: string, query: string): ReactNode {
  const normalizedQuery = query.trim().replace(/\s+/g, " ");
  if (!normalizedQuery) return text;

  const queryPattern = new RegExp(`(${escapeRegExp(normalizedQuery)})`, "gi");
  const normalizedQueryLowerCase = normalizedQuery.toLowerCase();
  const partOccurrences = new Map<string, number>();

  return text.split(queryPattern).map((part) => {
    const isMatch = part.toLowerCase() === normalizedQueryLowerCase;
    const occurrence = partOccurrences.get(part) ?? 0;
    partOccurrences.set(part, occurrence + 1);
    const key = `${part}-${occurrence}`;

    return isMatch ? (
      <mark key={key} className="bg-transparent font-medium text-accent-primary">
        {part}
      </mark>
    ) : (
      <Fragment key={key}>{part}</Fragment>
    );
  });
}
