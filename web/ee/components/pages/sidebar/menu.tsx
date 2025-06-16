import { observer } from "mobx-react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { Home, LucideIcon } from "lucide-react";
// plane imports
import { EUserWorkspaceRoles, EUserPermissionsLevel } from "@plane/constants";
import { Tooltip } from "@plane/ui";
// helpers
import { cn  } from "@plane/utils";
// hooks
import { useAppTheme, useUserPermissions } from "@/hooks/store";
import { usePlatformOS } from "@/hooks/use-platform-os";

export const SIDEBAR_MENU_ITEMS: {
  key: string;
  label: string;
  href: string;
  access: EUserWorkspaceRoles[];
  highlight: (pathname: string, baseUrl: string) => boolean;
  Icon: LucideIcon;
}[] = [
  {
    key: "home",
    label: "Home",
    href: `/pages`,
    access: [EUserWorkspaceRoles.ADMIN, EUserWorkspaceRoles.MEMBER, EUserWorkspaceRoles.GUEST],
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
  const { allowPermissions } = useUserPermissions();
  // platform os
  const { isMobile } = usePlatformOS();

  return (
    <div className="w-full space-y-1">
      {SIDEBAR_MENU_ITEMS.map((link) => {
        if (!allowPermissions(link.access, EUserPermissionsLevel.WORKSPACE)) return null;

        return (
          <Link key={link.key} href={`/${workspaceSlug}${link.href}`} className="block">
            <Tooltip
              tooltipContent={link.label}
              position="right"
              className="ml-2"
              disabled={!sidebarCollapsed}
              isMobile={isMobile}
            >
              <div
                className={cn(
                  "group w-full flex items-center gap-1.5 rounded-md px-2 py-1.5 outline-none text-custom-sidebar-text-200 hover:bg-custom-sidebar-background-90 focus:bg-custom-sidebar-background-90",
                  {
                    "text-custom-primary-100 bg-custom-primary-100/10 hover:bg-custom-primary-100/10 focus:bg-custom-primary-100/10":
                      link.highlight(pathname, `/${workspaceSlug}${link.href}/`),
                    "p-0 size-8 aspect-square justify-center mx-auto": sidebarCollapsed,
                  }
                )}
              >
                {<link.Icon className="size-4" />}
                {!sidebarCollapsed && <p className="text-sm leading-5 font-medium">{link.label}</p>}
              </div>
            </Tooltip>
          </Link>
        );
      })}
    </div>
  );
});
