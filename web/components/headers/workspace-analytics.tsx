import { useRouter } from "next/router";
import { ArrowLeft, BarChart2 } from "lucide-react";
// ui
import { Breadcrumbs } from "@plane/ui";
// components
import { SidebarHamburgerToggle } from "components/core/sidebar/sidebar-menu-hamburger-toggle";

export const WorkspaceAnalyticsHeader = () => {
  const router = useRouter();

  return (
    <>
      <div
        className={`relative z-10 flex h-[3.75rem] w-full flex-shrink-0 flex-row items-center justify-between gap-x-2 gap-y-4 border-b border-custom-border-200 bg-custom-sidebar-background-100 p-4`}
      >
        <div className="flex w-full flex-grow items-center gap-2 overflow-ellipsis whitespace-nowrap">
          <SidebarHamburgerToggle />
          <div className="block md:hidden">
            <button
              type="button"
              className="grid h-8 w-8 place-items-center rounded border border-custom-border-200"
              onClick={() => router.back()}
            >
              <ArrowLeft fontSize={14} strokeWidth={2} />
            </button>
          </div>
          <div>
            <Breadcrumbs>
              <Breadcrumbs.BreadcrumbItem
                type="text"
                icon={<BarChart2 className="h-4 w-4 text-custom-text-300" />}
                label="Analytics"
              />
            </Breadcrumbs>
          </div>
        </div>
      </div>
    </>
  );
};
