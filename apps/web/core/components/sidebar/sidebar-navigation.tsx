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
        "cursor-pointer relative group w-full flex items-center justify-between gap-1.5 rounded-md px-2 py-1 outline-none",
        {
          "text-primary !bg-layer-transparent-active": isActive,
          "text-secondary hover:bg-layer-transparent-hover active:bg-layer-transparent-active": !isActive,
        },
        className
      )}
    >
      {children}
    </div>
  );
}
