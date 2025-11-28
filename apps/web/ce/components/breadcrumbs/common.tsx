// local components
import { useProjectNavigationPreferences } from "@/hooks/use-navigation-preferences";
import { ProjectBreadcrumb } from "./project";

type TCommonProjectBreadcrumbProps = {
  workspaceSlug: string;
  projectId: string;
};

export function CommonProjectBreadcrumbs(props: TCommonProjectBreadcrumbProps) {
  const { workspaceSlug, projectId } = props;
  // preferences
  const { preferences: projectPreferences } = useProjectNavigationPreferences();

  if (projectPreferences.navigationMode === "horizontal") return null;
  return <ProjectBreadcrumb workspaceSlug={workspaceSlug} projectId={projectId} />;
}
