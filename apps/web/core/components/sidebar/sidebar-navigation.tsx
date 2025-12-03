import { cn } from "@plane/utils";

type TSidebarNavItem = {
  className?: string;
  isActive?: boolean;
  children?: React.ReactNode;
};

export function SidebarNavItem(props: TSidebarNavItem) {
  const { className, isActive, children } = props;
  return (
    <div
      className={cn(
        "cursor-pointer relative group w-full flex items-center justify-between gap-1.5 rounded-sm px-2 py-1 outline-none",
        {
          "text-secondary bg-layer-1/75": isActive,
          "text-secondary hover:bg-surface-2 active:bg-surface-2": !isActive,
        },
        className
      )}
    >
      {children}
    </div>
  );
}
