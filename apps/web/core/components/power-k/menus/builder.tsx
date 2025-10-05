"use client";

import React from "react";
import { Command } from "cmdk";
// plane imports
import { cn } from "@plane/utils";
// local imports
import { PowerKMenuEmptyState } from "./empty-state";

type Props<T> = {
  heading: string;
  items: T[];
  onSelect: (item: T) => void;
  getKey?: (item: T) => string;
  getLabel: (item: T) => string;
  renderItem?: (item: T) => React.ReactNode;
  emptyText?: string;
};

export const PowerKMenuBuilder = <T,>({
  heading,
  items,
  onSelect,
  getKey,
  getLabel,
  renderItem,
  emptyText,
}: Props<T>) => {
  if (items.length === 0) return <PowerKMenuEmptyState emptyText={emptyText} />;

  return (
    <Command.Group heading={heading}>
      {items.map((item) => (
        <Command.Item
          key={getKey?.(item) ?? getLabel(item)}
          value={getLabel(item)}
          onSelect={() => onSelect(item)}
          className={cn("focus:outline-none")}
        >
          {renderItem?.(item) ?? getLabel(item)}
        </Command.Item>
      ))}
    </Command.Group>
  );
};
