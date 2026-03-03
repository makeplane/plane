/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
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

// Utility to highlight matched text in a string
const highlightMatch = (text: string, query: string): React.ReactNode => {
  if (!query || query.trim() === "") return text;

  const queryLower = query.toLowerCase().trim();
  const textLower = text.toLowerCase();

  // Check for direct substring match
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

  // Otherwise just return the text
  return text;
};

export function CommandMenuItem(props: Props) {
  const { isSelected, item, itemIndex, onClick, onMouseEnter, sectionIndex, query } = props;

  return (
    <button
      type="button"
      id={`item-${sectionIndex}-${itemIndex}`}
      className={cn(
        "flex w-full items-center gap-2 truncate rounded-sm px-1 py-1.5 text-left text-13 text-secondary hover:bg-layer-1-hover",
        {
          "bg-layer-1-hover": isSelected,
        }
      )}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
    >
      <span className="grid size-5 flex-shrink-0 place-items-center" style={item.iconContainerStyle}>
        {item.icon}
      </span>
      <p className="flex-grow truncate text-12">{query ? highlightMatch(item.title, query) : item.title}</p>
      {item.badge}
    </button>
  );
}
