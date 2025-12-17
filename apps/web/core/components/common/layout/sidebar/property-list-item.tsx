import type { ReactNode } from "react";
import { cn } from "@plane/utils";

type TSidebarPropertyListItemProps = {
  icon: React.FC<{ className?: string }> | React.ReactNode;
  label: string;
  children: ReactNode;
  appendElement?: ReactNode;
  childrenClassName?: string;
};

export function SidebarPropertyListItem(props: TSidebarPropertyListItemProps) {
  const { icon: Icon, label, children, appendElement, childrenClassName } = props;

  return (
    <div className="flex items-center gap-2">
      <div className="flex shrink-0 items-center gap-1.5 w-30 text-body-xs-regular text-tertiary h-7.5">
        {typeof Icon === "function" ? <Icon className="size-4 shrink-0" /> : Icon}
        <span>{label}</span>
        {appendElement}
      </div>
      <div className={cn("grow flex items-center flex-wrap gap-2", childrenClassName)}>{children}</div>
    </div>
  );
}
