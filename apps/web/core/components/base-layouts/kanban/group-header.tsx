import type { IGroupHeaderProps } from "@plane/types";

export const GroupHeader = ({ group, itemCount, onToggleGroup }: IGroupHeaderProps) => (
  <button
    onClick={() => onToggleGroup(group.id)}
    className="flex w-full items-center gap-2 text-sm font-medium text-custom-text-200"
  >
    <div className="flex items-center gap-2">
      {group.icon}
      <span>{group.name}</span>
    </div>
    <span className="text-xs text-custom-text-300">{itemCount}</span>
  </button>
);
