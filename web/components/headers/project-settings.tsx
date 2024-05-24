import { FC } from "react";
import { observer } from "mobx-react";
import { useRouter } from "next/router";
// ui
import { Settings } from "lucide-react";
import { Breadcrumbs, CustomMenu } from "@plane/ui";
// components
import { BreadcrumbLink, Logo } from "@/components/common";
// constants
import { EUserProjectRoles, PROJECT_SETTINGS_LINKS } from "@/constants/project";
// hooks
import { useProject, useUser } from "@/hooks/store";

export const ProjectSettingHeader: FC = observer(() => {
  // router
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;
  // store hooks
  const {
    membership: { currentProjectRole },
  } = useUser();
  const { currentProjectDetails } = useProject();

  if (currentProjectRole && currentProjectRole <= EUserProjectRoles.VIEWER) return null;

  return (
    <div className="relative z-10 flex h-[3.75rem] w-full flex-shrink-0 flex-row items-center justify-between gap-x-2 gap-y-4 bg-custom-sidebar-background-100 p-4">
      <div className="flex w-full flex-grow items-center gap-2 overflow-ellipsis whitespace-nowrap">
        <div>
          <div className="z-50">
            <Breadcrumbs onBack={router.back}>
              <Breadcrumbs.BreadcrumbItem
                type="text"
                link={
                  <BreadcrumbLink
                    href={`/${workspaceSlug}/projects/${currentProjectDetails?.id}/issues`}
                    label={currentProjectDetails?.name ?? "Project"}
                    icon={
                      currentProjectDetails && (
                        <span className="grid place-items-center flex-shrink-0 h-4 w-4">
                          <Logo logo={currentProjectDetails?.logo_props} size={16} />
                        </span>
                      )
                    }
                  />
                }
              />
              <div className="hidden sm:hidden md:block lg:block">
                <Breadcrumbs.BreadcrumbItem
                  type="text"
                  link={
                    <BreadcrumbLink label="Settings" icon={<Settings className="h-4 w-4 text-custom-text-300" />} />
                  }
                />
              </div>
            </Breadcrumbs>
          </div>
        </div>
        <CustomMenu
          className="flex-shrink-0 block sm:block md:hidden lg:hidden"
          maxHeight="lg"
          customButton={
            <span className="text-xs px-1.5 py-1 border rounded-md text-custom-text-200 border-custom-border-300">
              Settings
            </span>
          }
          placement="bottom-start"
          closeOnSelect
        >
          {PROJECT_SETTINGS_LINKS.map((item) => (
            <CustomMenu.MenuItem
              key={item.key}
              onClick={() => router.push(`/${workspaceSlug}/projects/${projectId}${item.href}`)}
            >
              {item.label}
            </CustomMenu.MenuItem>
          ))}
        </CustomMenu>
      </div>
    </div>
  );
});
