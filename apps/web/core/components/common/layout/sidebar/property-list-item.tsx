import type { ReactNode } from "react";
import { cn } from "@plane/utils";

type TSidebarPropertyListItemProps = {
  icon: React.FC<{ className?: string }>;
  label: string;
  children: ReactNode;
  appendElement?: ReactNode;
  childrenClassName?: string;
};

export function SidebarPropertyListItem(props: TSidebarPropertyListItemProps) {
  const { icon: Icon, label, children, appendElement, childrenClassName } = props;

  return (
    <div className="flex items-start gap-2">
      <div className="flex shrink-0 items-center gap-1.5 w-30 text-body-xs-regular text-tertiary h-7.5">
        <Icon className="size-4 shrink-0" />
        <span>{label}</span>
        {appendElement}
      </div>
      <div className={cn("grow flex items-center flex-wrap gap-1", childrenClassName)}>{children}</div>
    </div>
  );
}
