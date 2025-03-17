import { FC } from "react";
import { observer } from "mobx-react";
// plane web imports
import { ETemplateLevel } from "@plane/constants";
import { useWorkItemTemplates } from "@/plane-web/hooks/store";
// local imports
import { ProjectSettingsTemplatesListRoot } from "./list";
import { NoTemplatesEmptyState } from "./no-templates";

type TProjectTemplatesSettingsRootProps = {
  workspaceSlug: string;
  projectId: string;
};

export const ProjectTemplatesSettingsRoot: FC<TProjectTemplatesSettingsRootProps> = observer((props) => {
  const { workspaceSlug, projectId } = props;
  // store hooks
  const { isInitializingTemplates, isAnyWorkItemTemplatesAvailableForProject } = useWorkItemTemplates();
  // derived values
  const isWorkItemTemplatesAvailable = isAnyWorkItemTemplatesAvailableForProject(workspaceSlug, projectId);

  if (!isInitializingTemplates && !isWorkItemTemplatesAvailable) {
    return (
      <NoTemplatesEmptyState
        workspaceSlug={workspaceSlug}
        projectId={projectId}
        currentLevel={ETemplateLevel.PROJECT}
      />
    );
  }

  return <ProjectSettingsTemplatesListRoot workspaceSlug={workspaceSlug} projectId={projectId} />;
});
