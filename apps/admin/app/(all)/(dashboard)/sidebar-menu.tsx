import { observer } from "mobx-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Image, BrainCog, Cog, Lock, Mail } from "lucide-react";
// plane internal packages
import { WorkspaceIcon } from "@plane/propel/icons";
import { Tooltip } from "@plane/propel/tooltip";
import { cn } from "@plane/utils";
// hooks
import { useTheme } from "@/hooks/store";

const INSTANCE_ADMIN_LINKS = [
  {
    Icon: Cog,
    name: "General",
    description: "Identify your instances and get key details.",
    href: `/general/`,
  },
  {
    Icon: WorkspaceIcon,
    name: "Workspaces",
    description: "Manage all workspaces on this instance.",
    href: `/workspace/`,
  },
  {
    Icon: Mail,
    name: "Email",
    description: "Configure your SMTP controls.",
    href: `/email/`,
  },
  {
    Icon: Lock,
    name: "Authentication",
    description: "Configure authentication modes.",
    href: `/authentication/`,
  },
  {
    Icon: BrainCog,
    name: "Artificial intelligence",
    description: "Configure your OpenAI creds.",
    href: `/ai/`,
  },
  {
    Icon: Image,
    name: "Images in Plane",
    description: "Allow third-party image libraries.",
    href: `/image/`,
  },
];

export const AdminSidebarMenu = observer(function AdminSidebarMenu() {
  // store hooks
  const { isSidebarCollapsed, toggleSidebar } = useTheme();
  // router
  const pathName = usePathname();

  const handleItemClick = () => {
    if (window.innerWidth < 768) {
      toggleSidebar(!isSidebarCollapsed);
    }
  };

  return (
    <div className="flex h-full w-full flex-col gap-2.5 overflow-y-scroll vertical-scrollbar scrollbar-sm px-4 py-4">
      {INSTANCE_ADMIN_LINKS.map((item, index) => {
        const isActive = item.href === pathName || pathName.includes(item.href);
        return (
          <Link key={index} href={item.href} onClick={handleItemClick}>
            <div>
              <Tooltip tooltipContent={item.name} position="right" className="ml-2" disabled={!isSidebarCollapsed}>
                <div
                  className={cn(
                    `group flex w-full items-center gap-3 rounded-md px-3 py-2 outline-none transition-colors`,
                    isActive
                      ? "bg-accent-primary/10 text-accent-primary"
                      : "text-secondary hover:bg-layer-1 focus:bg-layer-1",
                    isSidebarCollapsed ? "justify-center" : "w-[260px]"
                  )}
                >
                  {<item.Icon className="h-4 w-4 flex-shrink-0" />}
                  {!isSidebarCollapsed && (
                    <div className="w-full ">
                      <div
                        className={cn(
                          `text-13 font-medium transition-colors`,
                          isActive ? "text-accent-primary" : "text-secondary"
                        )}
                      >
                        {item.name}
                      </div>
                      <div
                        className={cn(
                          `text-10 transition-colors`,
                          isActive ? "text-custom-primary-90" : "text-placeholder"
                        )}
                      >
                        {item.description}
                      </div>
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
