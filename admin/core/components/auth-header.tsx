"use client";

import { FC } from "react";
import { observer } from "mobx-react";
import { usePathname } from "next/navigation";
// mobx
// ui
import { Settings } from "lucide-react";
// icons
import { Breadcrumbs } from "@plane/ui";
// components
import { SidebarHamburgerToggle } from "@/components/admin-sidebar";
import { BreadcrumbLink } from "@/components/common";

export const InstanceHeader: FC = observer(() => {
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
        return "Github";
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
    <div className="relative z-10 flex h-[3.75rem] w-full flex-shrink-0 flex-row items-center justify-between gap-x-2 gap-y-4 border-b border-custom-sidebar-border-200 bg-custom-sidebar-background-100 p-4">
      <div className="flex w-full flex-grow items-center gap-2 overflow-ellipsis whitespace-nowrap">
        <SidebarHamburgerToggle />
        {breadcrumbItems.length >= 0 && (
          <div>
            <Breadcrumbs>
              <Breadcrumbs.BreadcrumbItem
                type="text"
                link={
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
                    <Breadcrumbs.BreadcrumbItem
                      key={item.title}
                      type="text"
                      link={<BreadcrumbLink href={item.href} label={item.title} />}
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
