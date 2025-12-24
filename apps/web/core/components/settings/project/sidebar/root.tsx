import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { PROJECT_SETTINGS_CATEGORIES, PROJECT_SETTINGS_CATEGORY } from "@plane/constants";
import { Logo } from "@plane/propel/emoji-icon-picker";
import { getUserRole } from "@plane/utils";
// components
// hooks
import { useProject } from "@/hooks/store/use-project";
// local imports
import { SettingsSidebar } from "../../sidebar";
import { NavItemChildren } from "./nav-item-children";

type TProjectSettingsSidebarProps = {
  isMobile?: boolean;
};

export const ProjectSettingsSidebar = observer(function ProjectSettingsSidebar(props: TProjectSettingsSidebarProps) {
  const { isMobile = false } = props;
  const { workspaceSlug } = useParams();
  // store hooks
  const { joinedProjectIds, projectMap } = useProject();

  const groupedProject = joinedProjectIds.map((projectId) => ({
    key: projectId,
    i18n_label: projectMap[projectId].name,
    href: `/settings/projects/${projectId}`,
    icon: <Logo logo={projectMap[projectId].logo_props} />,
  }));

  return (
    <SettingsSidebar
      isMobile={isMobile}
      categories={PROJECT_SETTINGS_CATEGORIES}
      groupedSettings={{
        [PROJECT_SETTINGS_CATEGORY.PROJECTS]: groupedProject,
      }}
      workspaceSlug={workspaceSlug.toString()}
      isActive={false}
      appendItemsToTitle={(key: string) => {
        const role = projectMap[key].member_role;
        return (
          <div className="text-11 font-medium text-secondary capitalize rounded-md px-1 py-0.5">
            {role ? getUserRole(role)?.toLowerCase() : "Guest"}
          </div>
        );
      }}
      shouldRender
      renderChildren={(key: string) => <NavItemChildren projectId={key} />}
    />
  );
});
