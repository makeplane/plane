import React, { useState } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Disclosure } from "@headlessui/react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { EUserWorkspaceRoles } from "@plane/types";
import { cn, joinUrlPath } from "@plane/utils";
// hooks
import { useUserSettings } from "@/hooks/store";

export type TSettingItem = {
  key: string;
  i18n_label: string;
  href: string;
  access?: EUserWorkspaceRoles[];
  icon?: React.ReactNode;
};
export type TSettingsSidebarNavItemProps = {
  workspaceSlug: string;
  setting: TSettingItem;
  isActive: boolean | ((data: { href: string }) => boolean);
  actionIcons?: (props: { type: string; size?: number; className?: string }) => React.ReactNode;
  appendItemsToTitle?: (key: string) => React.ReactNode;
  renderChildren?: (key: string) => React.ReactNode;
};

const SettingsSidebarNavItem = observer((props: TSettingsSidebarNavItemProps) => {
  const { workspaceSlug, setting, isActive, actionIcons, appendItemsToTitle, renderChildren } = props;
  // router
  const { projectId } = useParams();
  // i18n
  const { t } = useTranslation();
  // state
  const [isExpanded, setIsExpanded] = useState(projectId === setting.key);
  // hooks
  const { toggleSidebar } = useUserSettings();
  // derived
  const buttonClass = cn(
    "flex w-full items-center px-2 py-1.5 rounded text-custom-text-200 justify-between",
    "hover:bg-custom-primary-100/10",
    {
      "text-custom-primary-200 bg-custom-primary-100/10": typeof isActive === "function" ? isActive(setting) : isActive,
      "hover:bg-custom-sidebar-background-90 active:bg-custom-sidebar-background-90":
        typeof isActive === "function" ? !isActive(setting) : !isActive,
    }
  );

  const titleElement = (
    <>
      <div className="flex items-center gap-1.5 overflow-hidden">
        {setting.icon
          ? setting.icon
          : actionIcons && actionIcons({ type: setting.key, size: 16, className: "w-4 h-4" })}
        <div className="text-sm font-medium truncate">{t(setting.i18n_label)}</div>
      </div>
      {appendItemsToTitle?.(setting.key)}
    </>
  );

  return (
    <Disclosure as="div" className="flex flex-col w-full" defaultOpen={isExpanded} key={setting.key}>
      <Disclosure.Button
        as="button"
        type="button"
        className={cn(
          "group w-full flex items-center gap-1 whitespace-nowrap text-left text-sm font-semibold text-custom-sidebar-text-400"
        )}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {renderChildren ? (
          <div className={buttonClass}>{titleElement}</div>
        ) : (
          <Link
            href={joinUrlPath(workspaceSlug, setting.href)}
            className={buttonClass}
            onClick={() => toggleSidebar(true)}
          >
            {titleElement}
          </Link>
        )}
      </Disclosure.Button>
      {/* Nested Navigation */}
      {isExpanded && (
        <Disclosure.Panel
          as="div"
          className={cn("flex flex-col gap-0.5", {
            "space-y-0 ml-0": isExpanded,
          })}
          static
        >
          <div className="ml-4 border-l border-custom-border-200 pl-2 my-0.5">{renderChildren?.(setting.key)}</div>
        </Disclosure.Panel>
      )}
    </Disclosure>
  );
});

export default SettingsSidebarNavItem;
