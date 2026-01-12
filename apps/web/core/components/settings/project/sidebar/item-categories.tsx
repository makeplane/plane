import { observer } from "mobx-react";
import { usePathname } from "next/navigation";
import { useParams } from "react-router";
// plane imports
import { GROUPED_PROJECT_SETTINGS, PROJECT_SETTINGS_CATEGORIES } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
// components
import { SettingsSidebarItem } from "@/components/settings/sidebar/item";
// local imports
import { PROJECT_SETTINGS_ICONS } from "./item-icon";

type Props = {
  projectId: string;
};

export const ProjectSettingsSidebarItemCategories = observer(function ProjectSettingsSidebarItemCategories(
  props: Props
) {
  const { projectId } = props;
  // params
  const { workspaceSlug } = useParams();
  const pathname = usePathname();
  // translation
  const { t } = useTranslation();

  return (
    <div className="mt-3 flex flex-col divide-y divide-subtle px-3">
      {PROJECT_SETTINGS_CATEGORIES.map((category) => {
        const categoryItems = GROUPED_PROJECT_SETTINGS[category];

        if (categoryItems.length === 0) return null;

        return (
          <div key={category} className="shrink-0 py-3 first:pt-0 last:pb-0">
            <div className="p-2 text-caption-md-medium text-tertiary capitalize">{t(category)}</div>
            <div className="flex flex-col">
              {categoryItems.map((item) => {
                const isItemActive =
                  item.href === "/settings"
                    ? pathname === `/${workspaceSlug}${item.href}/settings/projects/${projectId}/`
                    : new RegExp(`^/${workspaceSlug}${item.href}/settings/projects/${projectId}/`).test(pathname);

                return (
                  <SettingsSidebarItem
                    key={item.key}
                    as="link"
                    href={`/${workspaceSlug}/settings/projects/${projectId}${item.href}/`}
                    isActive={isItemActive}
                    icon={PROJECT_SETTINGS_ICONS[item.key]}
                    label={t(item.i18n_label)}
                  />
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
});
