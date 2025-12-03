import type { IGroupHeaderProps } from "@plane/types";

export function GroupHeader({ group, itemCount, onToggleGroup }: IGroupHeaderProps) {
  return (
    <button
      onClick={() => onToggleGroup(group.id)}
      className="flex w-full items-center gap-2 text-sm font-medium text-secondary"
    >
      <div className="flex items-center gap-2">
        {group.icon}
        <span>{group.name}</span>
      </div>
      <span className="text-xs text-tertiary">{itemCount}</span>
    </button>
  );
}
