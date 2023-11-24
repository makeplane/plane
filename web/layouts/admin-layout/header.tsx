import { FC } from "react";
// mobx
import { observer } from "mobx-react-lite";
// ui
import { Breadcrumbs } from "@plane/ui";
// icons
import { Settings } from "lucide-react";

export interface IInstanceAdminHeader {
  title: string;
}

export const InstanceAdminHeader: FC<IInstanceAdminHeader> = observer((props) => {
  const { title } = props;

  return (
    <div className="relative flex w-full flex-shrink-0 flex-row z-10 h-[3.75rem] items-center justify-between gap-x-2 gap-y-4 border-b border-custom-border-200 bg-custom-sidebar-background-100 p-4">
      <div className="flex items-center gap-2 flex-grow w-full whitespace-nowrap overflow-ellipsis">
        <div>
          <Breadcrumbs>
            <Breadcrumbs.BreadcrumbItem
              type="text"
              icon={<Settings className="h-4 w-4 text-custom-text-300" />}
              label="Settings"
              link="/god-mode"
            />
            <Breadcrumbs.BreadcrumbItem type="text" label={title} />
          </Breadcrumbs>
        </div>
      </div>
    </div>
  );
});
