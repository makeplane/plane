interface GroupHeaderProps {
  group: { id: string; name: string; icon?: React.ReactNode };
  isCollapsed: boolean;
  onToggle: () => void;
  count: number;
}

export const GroupHeader = ({ group, count }: GroupHeaderProps) => (
  <div className="flex w-full items-center gap-2 text-sm font-medium text-custom-text-200">
    <div className="flex items-center gap-2">
      {group.icon}
      <span>{group.name}</span>
    </div>
    <span className="text-xs text-custom-text-300">{count}</span>
  </div>
);
