import { observer } from "mobx-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
// plane internal packages
import { Tooltip } from "@plane/propel/tooltip";
import { cn } from "@plane/utils";
// hooks
import { useTheme } from "@/hooks/store";
import { useSidebarMenu } from "@/hooks/use-sidebar-menu";

export const AdminSidebarMenu = observer(function AdminSidebarMenu() {
  // router
  const pathName = usePathname();
  // store hooks
  const { isSidebarCollapsed, toggleSidebar } = useTheme();
  // derived values
  const sidebarMenu = useSidebarMenu();

  const handleItemClick = () => {
    if (window.innerWidth < 768) {
      toggleSidebar(!isSidebarCollapsed);
    }
  };

  return (
    <div className="flex h-full w-full flex-col gap-2.5 overflow-y-scroll vertical-scrollbar scrollbar-sm px-4 py-4">
      {sidebarMenu.map((item, index) => {
        const isActive = item.href === pathName || pathName?.includes(item.href);
        return (
          <Link key={index} href={item.href} onClick={handleItemClick}>
            <div>
              <Tooltip tooltipContent={item.name} position="right" className="ml-2" disabled={!isSidebarCollapsed}>
                <div
                  className={cn(
                    "group flex w-full items-center gap-3 rounded-md px-3 py-2 outline-none transition-colors",
                    {
                      "text-primary !bg-layer-transparent-active": isActive,
                      "text-secondary hover:bg-layer-transparent-hover active:bg-layer-transparent-active": !isActive,
                    },
                    isSidebarCollapsed ? "justify-center" : "w-[260px]"
                  )}
                >
                  {<item.Icon className="h-4 w-4 flex-shrink-0" />}
                  {!isSidebarCollapsed && (
                    <div className="w-full ">
                      <div className={cn(`text-body-xs-medium transition-colors`)}>{item.name}</div>
                      <div className={cn(`text-caption-sm-regular transition-colors`)}>{item.description}</div>
                    </div>
                  )}
                </div>
              </Tooltip>
            </div>
          </Link>
        );
      })}
    </div>
  );
});
