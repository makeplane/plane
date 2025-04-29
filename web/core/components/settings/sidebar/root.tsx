import { useTranslation } from "@plane/i18n";
import { SettingsSidebarHeader } from "./header";
import SettingsSidebarNavItem, { TSettingItem } from "./nav-item";

interface SettingsSidebarProps {
  customHeader?: React.ReactNode;
  categories: string[];
  groupedSettings: {
    [key: string]: TSettingItem[];
  };
  workspaceSlug: string;
  isActive: boolean | ((data: { href: string }) => boolean);
  shouldRender: boolean | ((setting: TSettingItem) => boolean);
  actionIcons?: (props: { type: string; size?: number; className?: string }) => React.ReactNode;
  appendItemsToTitle?: (key: string) => React.ReactNode;
  renderChildren?: (key: string) => React.ReactNode;
}

export const SettingsSidebar = (props: SettingsSidebarProps) => {
  const {
    customHeader,
    categories,
    groupedSettings,
    workspaceSlug,
    isActive,
    shouldRender,
    actionIcons,
    appendItemsToTitle,
    renderChildren,
  } = props;
  const { t } = useTranslation();
  return (
    <div className="flex w-[220px] flex-col gap-2 h-full">
      {/* Header */}
      <SettingsSidebarHeader customHeader={customHeader} />
      {/* Navigation */}
      <div className="divide-y divide-custom-border-100 overflow-x-hidden scrollbar-sm h-full w-full overflow-y-auto vertical-scrollbar">
        {categories.map((category) => (
          <div key={category} className="py-3">
            <span className="text-sm font-semibold text-custom-text-400 capitalize mb-2">{t(category)}</span>
            {groupedSettings[category].length > 0 && (
              <div className="relative flex flex-col gap-0.5 overflow-y-scroll h-full mt-2">
                {groupedSettings[category].map(
                  (setting) =>
                    (typeof shouldRender === "function" ? shouldRender(setting) : shouldRender) && (
                      <SettingsSidebarNavItem
                        key={setting.key}
                        setting={setting}
                        workspaceSlug={workspaceSlug}
                        isActive={isActive}
                        appendItemsToTitle={appendItemsToTitle}
                        renderChildren={renderChildren}
                        actionIcons={actionIcons}
                      />
                    )
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
