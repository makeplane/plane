import { useCallback } from "react";
// plane imports
import { EUserPermissions } from "@plane/constants";
import { IntakeIcon } from "@plane/propel/icons";
// components
import { ProjectNavigation } from "@/components/workspace/sidebar/project-navigation";
import type { TNavigationItem } from "@/components/workspace/sidebar/project-navigation";

type TProjectItemsRootProps = {
  workspaceSlug: string;
  projectId: string;
};

export function ProjectNavigationRoot(props: TProjectItemsRootProps) {
  const { workspaceSlug, projectId } = props;

  const additionalNavigationItems = useCallback(
    (workspaceSlug: string, projectId: string): TNavigationItem[] => [
      {
        i18n_key: "sidebar.support_tickets",
        key: "support_tickets",
        name: "Support Tickets",
        href: `/${workspaceSlug}/projects/${projectId}/support-tickets`,
        icon: IntakeIcon,
        access: [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
        shouldRender: true,
        sortOrder: 0,
      },
    ],
    []
  );

  return (
    <ProjectNavigation
      workspaceSlug={workspaceSlug}
      projectId={projectId}
      additionalNavigationItems={additionalNavigationItems}
    />
  );
}
