/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Fragment, type ReactNode } from "react";

const REGEX_SPECIAL_CHARACTERS = /[.*+?^${}()|[\]\\]/g;

const escapeRegExp = (value: string) => value.replace(REGEX_SPECIAL_CHARACTERS, "\\$&");

const getPartKey = (part: string, partOccurrences: Map<string, number>) => {
  const occurrence = partOccurrences.get(part) ?? 0;
  partOccurrences.set(part, occurrence + 1);
  return `${part}-${occurrence}`;
};

export function highlightSearchMatches(text: string, query: string): ReactNode {
  const normalizedQuery = query.trim().replace(/\s+/g, " ");
  if (!normalizedQuery) return text;

  const queryPattern = new RegExp(`(${escapeRegExp(normalizedQuery)})`, "gi");
  const normalizedQueryLowerCase = normalizedQuery.toLowerCase();
  const partOccurrences = new Map<string, number>();

  return text.split(queryPattern).map((part) => {
    const isMatch = part.toLowerCase() === normalizedQueryLowerCase;
    const key = getPartKey(part, partOccurrences);

    return isMatch ? (
      <mark key={key} className="bg-transparent font-medium text-accent-primary">
        {part}
      </mark>
    ) : (
      <Fragment key={key}>{part}</Fragment>
    );
  });
}

export function highlightSearchKeywords(text: string, query: string): ReactNode {
  const searchTerms = [...new Set(query.trim().split(/\s+/).filter(Boolean))].toSorted(
    (firstTerm, secondTerm) => secondTerm.length - firstTerm.length
  );
  if (searchTerms.length === 0) return text;

  const queryPattern = new RegExp(`(${searchTerms.map(escapeRegExp).join("|")})`, "gi");
  const normalizedSearchTerms = new Set(searchTerms.map((term) => term.toLowerCase()));
  const partOccurrences = new Map<string, number>();

  return text.split(queryPattern).map((part) => {
    const isMatch = normalizedSearchTerms.has(part.toLowerCase());
    const key = getPartKey(part, partOccurrences);

    return isMatch ? (
      <mark key={key} className="bg-transparent font-medium text-accent-primary">
        {part}
      </mark>
    ) : (
      <Fragment key={key}>{part}</Fragment>
    );
  });
}
