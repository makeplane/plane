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

// plane utils
import { cn } from "@plane/utils";
// types
import type { ISlashCommandItem } from "@/types";

type Props = {
  isSelected: boolean;
  item: ISlashCommandItem;
  itemIndex: number;
  onClick: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  onMouseEnter: () => void;
  sectionIndex: number;
  query?: string;
};

// Utility to highlight matched text in a string (supports fuzzy matching)
const highlightMatch = (text: string, query: string): React.ReactNode => {
  if (!query || query.trim() === "") return text;

  const queryLower = query.toLowerCase().trim();
  const textLower = text.toLowerCase();

  // 1. Direct substring match
  const index = textLower.indexOf(queryLower);
  if (index >= 0) {
    const before = text.substring(0, index);
    const match = text.substring(index, index + queryLower.length);
    const after = text.substring(index + queryLower.length);

    return (
      <>
        {before}
        <span className="font-medium text-primary">{match}</span>
        {after}
      </>
    );
  }

  // 2. Fuzzy subsequence match — greedily match query chars left-to-right
  const matchedIndices: number[] = [];
  let qi = 0;
  for (let ti = 0; ti < textLower.length && qi < queryLower.length; ti++) {
    if (textLower[ti] === queryLower[qi]) {
      matchedIndices.push(ti);
      qi++;
    }
  }

  if (matchedIndices.length === queryLower.length) {
    const matchSet = new Set(matchedIndices);
    const parts: React.ReactNode[] = [];
    let i = 0;
    while (i < text.length) {
      if (matchSet.has(i)) {
        // Collect consecutive matched characters into one span
        let end = i;
        while (end + 1 < text.length && matchSet.has(end + 1)) end++;
        parts.push(
          <span key={i} className="font-medium text-primary">
            {text.substring(i, end + 1)}
          </span>
        );
        i = end + 1;
      } else {
        // Collect consecutive unmatched characters
        let end = i;
        while (end + 1 < text.length && !matchSet.has(end + 1)) end++;
        parts.push(text.substring(i, end + 1));
        i = end + 1;
      }
    }
    return <>{parts}</>;
  }

  return text;
};

export function CommandMenuItem(props: Props) {
  const { isSelected, item, itemIndex, onClick, onMouseEnter, sectionIndex, query } = props;

  return (
    <button
      type="button"
      id={`item-${sectionIndex}-${itemIndex}`}
      className={cn(
        "flex items-center gap-2 w-full rounded-sm px-1 py-1.5 text-13 text-left truncate text-secondary hover:bg-layer-1-hover",
        {
          "bg-layer-1-hover": isSelected,
        }
      )}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
    >
      <span className="size-5 grid place-items-center flex-shrink-0" style={item.iconContainerStyle}>
        {item.icon}
      </span>
      <p className="flex-grow truncate text-12">{query ? highlightMatch(item.title, query) : item.title}</p>
      {item.badge}
    </button>
  );
}
