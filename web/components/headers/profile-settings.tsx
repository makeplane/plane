import { FC } from "react";
// ui
import { Breadcrumbs } from "@plane/ui";
import { Settings } from "lucide-react";
import { BreadcrumbLink } from "components/common";

interface IProfileSettingHeader {
  title: string;
}

export const ProfileSettingsHeader: FC<IProfileSettingHeader> = (props) => {
  const { title } = props;

  return (
    <div className="relative z-10 flex h-[3.75rem] w-full flex-shrink-0 flex-row items-center justify-between gap-x-2 gap-y-4 border-b border-neutral-border-medium bg-sidebar-neutral-component-surface-light p-4">
      <div className="flex w-full flex-grow items-center gap-2 overflow-ellipsis whitespace-nowrap">
        <div>
          <Breadcrumbs>
            <Breadcrumbs.BreadcrumbItem
              type="text"
              link={
                <BreadcrumbLink
                  href="/profile"
                  label="My Profile"
                  icon={<Settings className="h-4 w-4 text-neutral-text-medium" />}
                />
              }
            />
            <Breadcrumbs.BreadcrumbItem type="text" link={<BreadcrumbLink label={title} />} />
          </Breadcrumbs>
        </div>
      </div>
    </div>
  );
};
