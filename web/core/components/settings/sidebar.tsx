import { WorkspaceEditionBadge } from "ee/components/workspace";
import Link from "next/link";
import { EUserWorkspaceRoles } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { cn } from "@plane/utils";
import { getUserRole } from "@/helpers/user.helper";
import { useWorkspace } from "@/hooks/store";
import WorkspaceLogo from "./workspace-logo";

type SettingsSidebarProps = {
  categories: string[];
  workspaceSlug: string;
  children?: React.ReactNode;
  customHeader?: React.ReactNode;
  groupedSettings: {
    [key: string]: {
      key: string;
      i18n_label: string;
      href: string;
      access?: EUserWorkspaceRoles[];
    }[];
  };
  isActive: (data: { href: string }) => boolean;
  shouldRender: boolean | ((data: { key: string; access?: EUserWorkspaceRoles[] | undefined }) => boolean);
  actionIcons?: (props: { type: string; size?: number; className?: string }) => React.ReactNode;
};

const SettingsSidebar = (props: SettingsSidebarProps) => {
  const { categories, groupedSettings, workspaceSlug, children, customHeader, isActive, shouldRender, actionIcons } =
    props;
  const { currentWorkspace } = useWorkspace();
  const { t } = useTranslation();

  return (
    <div className="flex w-[220px] flex-col gap-6">
      <div className="flex flex-col w-full">
        {/* Header */}
        {customHeader
          ? customHeader
          : currentWorkspace && (
              <div className="flex w-full gap-3 items-center justify-between">
                <div className="flex w-full gap-3 items-center overflow-hidden">
                  <WorkspaceLogo
                    workspace={{
                      logo_url: currentWorkspace.logo_url || "",
                      name: currentWorkspace.name,
                    }}
                    size="md"
                  />
                  <div className="w-full overflow-hidden">
                    <div className="text-base font-medium text-custom-text-200 truncate text-ellipsis ">
                      {currentWorkspace.name}
                    </div>
                    <div className="text-sm text-custom-text-300 capitalize">
                      {getUserRole(currentWorkspace.role)?.toLowerCase() || "guest"}
                    </div>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <WorkspaceEditionBadge
                    isEditable={false}
                    className="text-xs rounded-md min-w-fit px-1 py-0.5 flex-shrink-0"
                  />
                </div>
              </div>
            )}
        {/* Navigation */}
        <div className="divide-y divide-custom-border-100">
          {categories.map((category) => (
            <div key={category} className="py-3">
              <span className="text-sm font-semibold text-custom-text-400 capitalize mb-2">{t(category)}</span>
              <div className="flex flex-col gap-0.5">
                {groupedSettings[category].map(
                  (setting) =>
                    (typeof shouldRender === "function" ? shouldRender(setting) : shouldRender) && (
                      <div key={setting.key}>
                        <Link
                          href={`/${workspaceSlug}/${setting.href}`}
                          className={cn(
                            "flex items-center px-2 py-1.5 rounded text-custom-text-200 gap-1.5",
                            "hover:bg-custom-primary-100/10",
                            {
                              "text-custom-primary-200 bg-custom-primary-100/10": isActive(setting),
                              "hover:bg-custom-sidebar-background-90 active:bg-custom-sidebar-background-90":
                                !isActive(setting),
                            }
                          )}
                        >
                          {actionIcons && actionIcons({ type: setting.key, size: 16 })}
                          <div className="text-sm font-medium">{t(setting.i18n_label)}</div>
                        </Link>
                        {/* Nested Navigation */}
                        {children}
                      </div>
                    )
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SettingsSidebar;
