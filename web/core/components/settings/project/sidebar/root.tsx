import { observer } from "mobx-react";
import { PROJECT_SETTINGS_CATEGORIES, PROJECT_SETTINGS_CATEGORY } from "@plane/constants";
import { Logo } from "@/components/common";

import { getUserRole } from "@/helpers/user.helper";
import { useProject } from "@/hooks/store/use-project";
import { SettingsSidebar } from "../..";
import { NavItemChildren } from "./nav-item-children";

type TProjectSettingsSidebarProps = {
  workspaceSlug: string;
  pathname: string;
};

export const ProjectSettingsSidebar = observer((props: TProjectSettingsSidebarProps) => {
  const { workspaceSlug } = props;
  // store hooks
  const { joinedProjectIds, projectMap } = useProject();

  const groupedProject = joinedProjectIds.map((projectId) => ({
    key: projectId,
    i18n_label: projectMap[projectId].name,
    href: `/settings/project/${projectId}`,
    icon: <Logo logo={projectMap[projectId].logo_props} />,
  }));

  return (
    <SettingsSidebar
      categories={PROJECT_SETTINGS_CATEGORIES}
      groupedSettings={{
        [PROJECT_SETTINGS_CATEGORY.PROJECTS]: groupedProject,
      }}
      workspaceSlug={workspaceSlug.toString()}
      isActive={false}
      appendItemsToTitle={(key: string) => {
        const role = projectMap[key].member_role;
        return (
          <div className="text-xs font-medium text-custom-text-200 capitalize bg-custom-background-90 rounded-md px-1 py-0.5">
            {role ? getUserRole(role)?.toLowerCase() : "Guest"}
          </div>
        );
      }}
      shouldRender
      renderChildren={(key: string) => <NavItemChildren projectId={key} />}
    />
  );
});
