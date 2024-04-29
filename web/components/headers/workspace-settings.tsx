import { FC } from "react";
import { observer } from "mobx-react";
import { useRouter } from "next/router";
import { Settings } from "lucide-react";
// ui
import { Breadcrumbs } from "@plane/ui";
// components
import { BreadcrumbLink } from "@/components/common";

export interface IWorkspaceSettingHeader {
  title: string;
}

export const WorkspaceSettingHeader: FC<IWorkspaceSettingHeader> = observer((props) => {
  const { title } = props;
  const router = useRouter();

  const { workspaceSlug } = router.query;

  return (
    <div className="relative z-10 flex h-[3.75rem] w-full flex-shrink-0 flex-row items-center justify-between gap-x-2 gap-y-4 bg-custom-sidebar-background-100 p-4">
      <div className="flex w-full flex-grow items-center gap-2 overflow-ellipsis whitespace-nowrap">
        <div>
          <Breadcrumbs>
            <Breadcrumbs.BreadcrumbItem
              type="text"
              link={
                <BreadcrumbLink
                  href={`/${workspaceSlug}/settings`}
                  label="Settings"
                  icon={<Settings className="h-4 w-4 text-custom-text-300" />}
                />
              }
            />
            <Breadcrumbs.BreadcrumbItem type="text" link={<BreadcrumbLink label={title} />} />
          </Breadcrumbs>
        </div>
      </div>
    </div>
  );
});
