import Link from "next/link";
import { usePathname } from "next/navigation";
import { Image, BrainCog, Cog, Lock, Mail } from "lucide-react";
// hooks
import { useAppTheme } from "hooks/use-theme";
// ui
import { Tooltip } from "@plane/ui";
import { observer } from "mobx-react-lite";

const INSTANCE_ADMIN_LINKS = [
  {
    Icon: Cog,
    name: "General",
    description: "Identify your instances and get key details",
    href: `/`,
    highlight: (pathname: string) => pathname === "/",
  },
  {
    Icon: Mail,
    name: "Email",
    description: "Set up emails to your users",
    href: `/email`,
    highlight: (pathname: string) => pathname === "/email",
  },
  {
    Icon: Lock,
    name: "Authentication",
    description: "Configure authentication modes",
    href: `/authentication`,
    highlight: (pathname: string) => pathname.includes("/authentication"),
  },
  {
    Icon: BrainCog,
    name: "Artificial intelligence",
    description: "Configure your OpenAI creds",
    href: `/ai`,
    highlight: (pathname: string) => pathname === "/ai",
  },
  {
    Icon: Image,
    name: "Images in Plane",
    description: "Allow third-party image libraries",
    href: `/image`,
    highlight: (pathname: string) => pathname === "/image",
  },
];

export const SidebarMenu = observer(() => {
  // store hooks
  const { sidebarCollapsed, toggleSidebar } = useAppTheme();
  // router
  const pathName = usePathname();

  const handleItemClick = () => {
    if (window.innerWidth < 768) {
      toggleSidebar();
    }
  };

  return (
    <div className="flex h-full w-full flex-col gap-2.5 overflow-y-auto px-4 py-6">
      {INSTANCE_ADMIN_LINKS.map((item, index) => {
        const isActive = item.highlight(pathName);
        return (
          <Link key={index} href={item.href} onClick={handleItemClick}>
            <div>
              <Tooltip
                tooltipContent={item.name}
                position="right"
                className="ml-2"
                disabled={!sidebarCollapsed}
              >
                <div
                  className={`group flex w-full items-center gap-3 rounded-md px-3 py-2 outline-none ${
                    isActive
                      ? "bg-custom-primary-100/10 text-custom-primary-100"
                      : "text-custom-sidebar-text-200 hover:bg-custom-sidebar-background-80 focus:bg-custom-sidebar-background-80"
                  } ${sidebarCollapsed ? "justify-center" : ""}`}
                >
                  {<item.Icon className="h-4 w-4" />}
                  {!sidebarCollapsed && (
                    <div className="flex flex-col leading-snug">
                      <span
                        className={`text-sm font-medium ${
                          isActive
                            ? "text-custom-primary-100"
                            : "text-custom-sidebar-text-200"
                        }`}
                      >
                        {item.name}
                      </span>
                      <span
                        className={`text-[10px] ${
                          isActive
                            ? "text-custom-primary-90"
                            : "text-custom-sidebar-text-400"
                        }`}
                      >
                        {item.description}
                      </span>
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
