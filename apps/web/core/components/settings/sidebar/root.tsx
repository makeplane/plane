import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import { cn } from "@plane/utils";
import { SettingsSidebarHeader } from "./header";
import SettingsSidebarNavItem, { TSettingItem } from "./nav-item";

interface SettingsSidebarProps {
  isMobile?: boolean;
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

export const SettingsSidebar = observer((props: SettingsSidebarProps) => {
  const {
    isMobile = false,
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
  // hooks
  const { t } = useTranslation();

  return (
    <div
      className={cn("flex w-[250px] flex-col gap-2 flex-shrink-0 overflow-y-scroll h-full md:pt-page-y ", {
        "absolute left-0 top-[42px] z-50 h-fit max-h-[400px] overflow-scroll bg-custom-background-100 border border-custom-border-100 rounded shadow-sm p-4":
          isMobile,
      })}
    >
      {/* Header */}
      <SettingsSidebarHeader customHeader={customHeader} />
      {/* Navigation */}
      <div className="divide-y divide-custom-border-100 overflow-x-hidden w-full h-full overflow-y-scroll vertical-scrollbar scrollbar-sm">
        {categories.map((category) => {
          if (groupedSettings[category].length === 0) return null;
          return (
            <div key={category} className="py-3">
              <span className="text-sm font-semibold text-custom-text-350 capitalize mb-2 px-2">{t(category)}</span>
              <div className="relative flex flex-col gap-0.5 h-full mt-2">
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
            </div>
          );
        })}
      </div>
    </div>
  );
});
