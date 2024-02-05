import { FC } from "react";
// mobx
import { observer } from "mobx-react-lite";
// ui
import { Breadcrumbs } from "@plane/ui";
// icons
import { Settings } from "lucide-react";
import { BreadcrumbLink } from "components/common";

export interface IInstanceAdminHeader {
  title?: string;
}

export const InstanceAdminHeader: FC<IInstanceAdminHeader> = observer((props) => {
  const { title } = props;

  return (
    <div className="relative z-10 flex h-[3.75rem] w-full flex-shrink-0 flex-row items-center justify-between gap-x-2 gap-y-4 border-b border-custom-border-200 bg-custom-sidebar-background-100 p-4">
      <div className="flex w-full flex-grow items-center gap-2 overflow-ellipsis whitespace-nowrap">
        {title && (
          <div>
            <Breadcrumbs>
              <Breadcrumbs.BreadcrumbItem
                type="text"
                link={
                  <BreadcrumbLink
                    href="/god-mode"
                    label="Settings"
                    icon={<Settings className="h-4 w-4 text-custom-text-300" />}
                  />
                }
              />
              <Breadcrumbs.BreadcrumbItem type="text" link={<BreadcrumbLink label={title} />} />
            </Breadcrumbs>
          </div>
        )}
      </div>
    </div>
  );
});
