import { range } from "lodash";
import { observer } from "mobx-react";
import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Loader } from "@plane/ui";
import { cn } from "@plane/utils";
import { useProject, useUserPermissions, useUserSettings } from "@/hooks/store";
import { PROJECT_SETTINGS_LINKS } from "@/plane-web/constants/project";
import { getProjectSettingsPageLabelI18nKey } from "@/plane-web/helpers/project-settings";

export const NavItemChildren = observer((props: { projectId: string }) => {
  const { projectId } = props;
  const { workspaceSlug } = useParams();
  const pathname = usePathname();
  // mobx store
  const { getProjectById } = useProject();
  const { allowPermissions } = useUserPermissions();
  const { t } = useTranslation();
  const { toggleSidebar } = useUserSettings();

  // derived values
  const currentProject = getProjectById(projectId);

  if (!currentProject) {
    return (
      <div className="flex w-[280px] flex-col gap-6">
        <div className="flex flex-col gap-2">
          <Loader className="flex w-full flex-col gap-2">
            {range(8).map((index) => (
              <Loader.Item key={index} height="34px" />
            ))}
          </Loader>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="flex w-full flex-col gap-1">
          {PROJECT_SETTINGS_LINKS.map((link) => {
            const isActive = link.highlight(pathname, `/${workspaceSlug}/settings/projects/${projectId}`);
            return (
              allowPermissions(
                link.access,
                EUserPermissionsLevel.PROJECT,
                workspaceSlug?.toString() ?? "",
                projectId?.toString() ?? ""
              ) && (
                <Link
                  key={link.key}
                  href={`/${workspaceSlug}/settings/projects/${projectId}${link.href}`}
                  onClick={() => toggleSidebar(true)}
                >
                  <div
                    className={cn(
                      "cursor-pointer relative group w-full flex items-center justify-between gap-1.5 rounded p-1 px-1.5 outline-none",
                      {
                        "text-custom-primary-200 bg-custom-primary-100/10": isActive,
                        "text-custom-sidebar-text-200 hover:bg-custom-sidebar-background-90 active:bg-custom-sidebar-background-90":
                          !isActive,
                      },
                      "text-sm font-medium"
                    )}
                  >
                    {t(getProjectSettingsPageLabelI18nKey(link.key, link.i18n_label))}
                  </div>
                </Link>
              )
            );
          })}
        </div>
      </div>
    </div>
  );
});
