/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// propel imports
import {
  SuggestionMenuItem,
  SuggestionMenuItemIcon,
  SuggestionMenuItemTitle,
  SuggestionMenuItemTrailing,
} from "@makeplane/propel/elements/suggestion-menu";
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
    <SuggestionMenuItem
      data-highlighted={isSelected ? "" : undefined}
      render={
        <button
          type="button"
          id={`item-${sectionIndex}-${itemIndex}`}
          className="focus-visible:ring-2 focus-visible:ring-accent-strong focus-visible:ring-inset"
          style={{ textAlign: "start" }}
          onClick={onClick}
          onMouseEnter={onMouseEnter}
        />
      }
    >
      <SuggestionMenuItemIcon>
        {item.iconContainerStyle ? (
          <span className="grid size-4 place-items-center" style={item.iconContainerStyle}>
            {item.icon}
          </span>
        ) : (
          item.icon
        )}
      </SuggestionMenuItemIcon>
      <SuggestionMenuItemTitle>{query ? highlightMatch(item.title, query) : item.title}</SuggestionMenuItemTitle>
      {item.badge && <SuggestionMenuItemTrailing>{item.badge}</SuggestionMenuItemTrailing>}
    </SuggestionMenuItem>
  );
}
