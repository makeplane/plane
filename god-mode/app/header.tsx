"use client";

import { FC } from "react";
import { usePathname } from "next/navigation";
// mobx
import { observer } from "mobx-react-lite";
// ui
import { Settings } from "lucide-react";
import { Breadcrumbs } from "@plane/ui";
// icons
import { BreadcrumbLink } from "components/common";

export const InstanceHeader: FC = observer(() => {
  const pathName = usePathname();

  const getHeaderTitle = () => {
    if (pathName === "/") {
      return "General";
    }
    if (pathName === "/ai") {
      return "Artificial Intelligence";
    }
    if (pathName === "/email") {
      return "Email";
    }
    if (pathName === "/authorization") {
      return "Authorization";
    }
    if (pathName === "/image") {
      return "Image";
    }
    return;
  };
  const title = getHeaderTitle();

  return (
    <div className="relative z-10 flex h-[3.75rem] w-full flex-shrink-0 flex-row items-center justify-between gap-x-2 gap-y-4 border-b border-custom-sidebar-border-200 bg-custom-sidebar-background-100 p-4">
      <div className="flex w-full flex-grow items-center gap-2 overflow-ellipsis whitespace-nowrap">
        {title && (
          <div>
            <Breadcrumbs>
              <Breadcrumbs.BreadcrumbItem
                type="text"
                link={
                  <BreadcrumbLink
                    href="/"
                    label="Settings"
                    icon={<Settings className="h-4 w-4 text-custom-text-300" />}
                  />
                }
              />
              <Breadcrumbs.BreadcrumbItem
                type="text"
                link={<BreadcrumbLink label={title} />}
              />
            </Breadcrumbs>
          </div>
        )}
      </div>
    </div>
  );
});
