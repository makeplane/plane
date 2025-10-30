"use client";

import type { FC } from "react";
import { observer } from "mobx-react";
import { usePathname } from "next/navigation";
import { Menu, Settings } from "lucide-react";
// icons
import { Breadcrumbs } from "@plane/ui";
// components
import { BreadcrumbLink } from "@/components/common/breadcrumb-link";
// hooks
import { useTheme } from "@/hooks/store";

export const HamburgerToggle: FC = observer(() => {
  const { isSidebarCollapsed, toggleSidebar } = useTheme();
  return (
    <div
      className="w-7 h-7 rounded flex justify-center items-center bg-custom-background-80 transition-all hover:bg-custom-background-90 cursor-pointer group md:hidden"
      onClick={() => toggleSidebar(!isSidebarCollapsed)}
    >
      <Menu size={14} className="text-custom-text-200 group-hover:text-custom-text-100 transition-all" />
    </div>
  );
});

export const AdminHeader: FC = observer(() => {
  const pathName = usePathname();

  const getHeaderTitle = (pathName: string) => {
    switch (pathName) {
      case "general":
        return "General";
      case "ai":
        return "Artificial Intelligence";
      case "email":
        return "Email";
      case "authentication":
        return "Authentication";
      case "image":
        return "Image";
      case "google":
        return "Google";
      case "github":
        return "GitHub";
      case "gitlab":
        return "GitLab";
      case "workspace":
        return "Workspace";
      case "create":
        return "Create";
      default:
        return pathName.toUpperCase();
    }
  };

  // Function to dynamically generate breadcrumb items based on pathname
  const generateBreadcrumbItems = (pathname: string) => {
    const pathSegments = pathname.split("/").slice(1); // removing the first empty string.
    pathSegments.pop();

    let currentUrl = "";
    const breadcrumbItems = pathSegments.map((segment) => {
      currentUrl += "/" + segment;
      return {
        title: getHeaderTitle(segment),
        href: currentUrl,
      };
    });
    return breadcrumbItems;
  };

  const breadcrumbItems = generateBreadcrumbItems(pathName);

  return (
    <div className="relative z-10 flex h-header w-full flex-shrink-0 flex-row items-center justify-between gap-x-2 gap-y-4 border-b border-custom-sidebar-border-200 bg-custom-sidebar-background-100 p-4">
      <div className="flex w-full flex-grow items-center gap-2 overflow-ellipsis whitespace-nowrap">
        <HamburgerToggle />
        {breadcrumbItems.length >= 0 && (
          <div>
            <Breadcrumbs>
              <Breadcrumbs.Item
                component={
                  <BreadcrumbLink
                    href="/general/"
                    label="Settings"
                    icon={<Settings className="h-4 w-4 text-custom-text-300" />}
                  />
                }
              />
              {breadcrumbItems.map(
                (item) =>
                  item.title && (
                    <Breadcrumbs.Item
                      key={item.title}
                      component={<BreadcrumbLink href={item.href} label={item.title} />}
                    />
                  )
              )}
            </Breadcrumbs>
          </div>
        )}
      </div>
    </div>
  );
});
