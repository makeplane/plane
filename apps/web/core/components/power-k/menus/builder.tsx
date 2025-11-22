import React from "react";
import { Command } from "cmdk";
// local imports
import { PowerKModalCommandItem } from "../ui/modal/command-item";
import { PowerKMenuEmptyState } from "./empty-state";

type Props<T> = {
  heading?: string;
  items: T[];
  onSelect: (item: T) => void;
  getIcon?: (item: T) => React.ComponentType<{ className?: string }>;
  getIconNode?: (item: T) => React.ReactNode;
  getKey: (item: T) => string;
  getLabel: (item: T) => React.ReactNode;
  getValue: (item: T) => string;
  isSelected?: (item: T) => boolean;
  emptyText?: string;
};

export function PowerKMenuBuilder<T>({
  heading,
  items,
  onSelect,
  getIcon,
  getIconNode,
  getKey,
  getLabel,
  getValue,
  isSelected,
  emptyText,
}: Props<T>) {
  if (items.length === 0) return <PowerKMenuEmptyState emptyText={emptyText} />;

  return (
    <Command.Group heading={heading}>
      {items.map((item) => (
        <PowerKModalCommandItem
          key={getKey(item)}
          icon={getIcon?.(item)}
          iconNode={getIconNode?.(item)}
          value={getValue(item)}
          label={getLabel(item)}
          isSelected={isSelected?.(item)}
          onSelect={() => onSelect(item)}
        />
      ))}
    </Command.Group>
  );
}
