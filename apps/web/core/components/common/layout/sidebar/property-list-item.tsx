import type { ReactNode } from "react";

type TSidebarPropertyListItemProps = {
  icon: React.FC<{ className?: string }>;
  label: string;
  children: ReactNode;
  appendElement?: ReactNode;
};

export function SidebarPropertyListItem(props: TSidebarPropertyListItemProps) {
  const { icon: Icon, label, children, appendElement } = props;

  return (
    <div className="flex items-center gap-2">
      <div className="flex shrink-0 items-center gap-1 w-30 text-body-xs-regular text-tertiary h-7.5">
        <Icon className="h-4 w-4 shrink-0" />
        <span>{label}</span>
        {appendElement}
      </div>
      <div className="grow flex items-center flex-wrap gap-2">{children}</div>
    </div>
  );
}
