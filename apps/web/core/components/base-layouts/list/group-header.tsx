import type { IGroupHeaderProps } from "@plane/types";

export function GroupHeader({ group, itemCount, onToggleGroup }: IGroupHeaderProps) {
  return (
    <button
      onClick={() => onToggleGroup(group.id)}
      className="flex w-full items-center gap-2 py-2 text-sm font-medium text-secondary"
    >
      {group.icon}
      <span>{group.name}</span>
      <span className="text-xs text-tertiary">{itemCount}</span>
    </button>
  );
}
