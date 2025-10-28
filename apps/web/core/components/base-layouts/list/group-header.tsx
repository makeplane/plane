interface GroupHeaderProps {
  group: { id: string; name: string; icon?: React.ReactNode };
  isCollapsed: boolean;
  onToggle: () => void;
  count?: number;
}

export const GroupHeader = ({ group, count, isCollapsed: _isCollapsed, onToggle }: GroupHeaderProps) => (
  <button onClick={onToggle} className="flex w-full items-center gap-2 py-2 text-sm font-medium text-custom-text-200">
    {group.icon}
    <span>{group.name}</span>
    <span className="text-xs text-custom-text-300">{count}</span>
  </button>
);
