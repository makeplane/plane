import { useRouter } from "next/router";
import { ArrowLeft, BarChart2 } from "lucide-react";
// ui
import { Breadcrumbs } from "@plane/ui";
// components
import { SidebarHamburgerToggle } from "components/core/sidebar/sidebar-menu-hamburger-toggle";
import { BreadcrumbLink } from "components/common";

export const WorkspaceAnalyticsHeader = () => {
  const router = useRouter();

  return (
    <>
      <div
        className={`relative z-10 flex h-[3.75rem] w-full flex-shrink-0 flex-row items-center justify-between gap-x-2 gap-y-4 border-b border-neutral-border-medium bg-sidebar-neutral-component-surface-light p-4`}
      >
        <div className="flex w-full flex-grow items-center gap-2 overflow-ellipsis whitespace-nowrap">
          <SidebarHamburgerToggle />
          <div>
            <Breadcrumbs>
              <Breadcrumbs.BreadcrumbItem
                type="text"
                link={
                  <BreadcrumbLink label="Analytics" icon={<BarChart2 className="h-4 w-4 text-neutral-text-medium" />} />
                }
              />
            </Breadcrumbs>
          </div>
        </div>
      </div>
    </>
  );
};
