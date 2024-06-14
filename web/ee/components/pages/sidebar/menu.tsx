import { observer } from "mobx-react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { Home, LucideIcon } from "lucide-react";
// ui
import { Tooltip } from "@plane/ui";
// constants
import { EUserWorkspaceRoles } from "@/constants/workspace";
// helpers
import { cn } from "@/helpers/common.helper";
// hooks
import { useAppTheme, useUser } from "@/hooks/store";
import { usePlatformOS } from "@/hooks/use-platform-os";

export const SIDEBAR_MENU_ITEMS: {
  key: string;
  label: string;
  href: string;
  access: EUserWorkspaceRoles;
  highlight: (pathname: string, baseUrl: string) => boolean;
  Icon: LucideIcon;
}[] = [
  {
    key: "home",
    label: "Home",
    href: `/pages`,
    access: EUserWorkspaceRoles.GUEST,
    highlight: (pathname: string, baseUrl: string) => pathname === `${baseUrl}`,
    Icon: Home,
  },
];

export const PagesAppSidebarMenu = observer(() => {
  // params
  const { workspaceSlug } = useParams();
  const pathname = usePathname();
  // store hooks
  const { sidebarCollapsed } = useAppTheme();
  const {
    membership: { currentWorkspaceRole },
  } = useUser();
  // platform os
  const { isMobile } = usePlatformOS();

  return (
    <div className="w-full cursor-pointer space-y-2 px-4 !-mb-2">
      {SIDEBAR_MENU_ITEMS.map((link) => {
        if (currentWorkspaceRole && currentWorkspaceRole < link.access) return null;

        return (
          <Link key={link.key} href={`/${workspaceSlug}${link.href}`}>
            <span className="block w-full">
              <Tooltip
                tooltipContent={link.label}
                position="right"
                className="ml-2"
                disabled={!sidebarCollapsed}
                isMobile={isMobile}
              >
                <div
                  className={`group flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium outline-none ${
                    link.highlight(pathname, `/${workspaceSlug}/pages`)
                      ? "bg-custom-primary-100/10 text-custom-primary-100"
                      : "text-custom-sidebar-text-200 hover:bg-custom-sidebar-background-90 focus:bg-custom-sidebar-background-90"
                  } ${sidebarCollapsed ? "justify-center" : ""}`}
                >
                  {
                    <link.Icon
                      className={cn("h-4 w-4", {
                        "rotate-180": link.key === "active-cycles",
                      })}
                    />
                  }
                  {!sidebarCollapsed && <p className="leading-5">{link.label}</p>}
                  {!sidebarCollapsed && link.key === "active-cycles" && (
                    <span className="flex items-center justify-center px-3.5 py-0.5 text-xs leading-4 rounded-xl text-orange-500 bg-orange-500/20">
                      Beta
                    </span>
                  )}
                </div>
              </Tooltip>
            </span>
          </Link>
        );
      })}
    </div>
  );
});
