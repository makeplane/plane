"use client";

import React from "react";
import { Command } from "cmdk";
import { cn } from "@plane/utils";

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
  emptyText = "No results found",
}: Props<T>) => {
  if (items.length === 0) return <div className="px-3 py-8 text-center text-sm text-custom-text-300">{emptyText}</div>;

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
