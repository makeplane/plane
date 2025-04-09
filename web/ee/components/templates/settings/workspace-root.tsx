import { FC } from "react";
import { observer } from "mobx-react";
// plane web imports
import { ETemplateLevel } from "@plane/constants";
import { useProjectTemplates, useWorkItemTemplates } from "@/plane-web/hooks/store";
// local imports
import { WorkspaceSettingsTemplatesListRoot } from "./list";
import { NoTemplatesEmptyState } from "./no-templates";

type TWorkspaceTemplatesSettingsRootProps = {
  workspaceSlug: string;
};

export const WorkspaceTemplatesSettingsRoot: FC<TWorkspaceTemplatesSettingsRootProps> = observer((props) => {
  const { workspaceSlug } = props;
  // store hooks
  const { isInitializingTemplates: isInitializingWorkItemTemplates, isAnyWorkItemTemplatesAvailable } =
    useWorkItemTemplates();
  const { isInitializingTemplates: isInitializingProjectTemplates, isAnyProjectTemplatesAvailable } =
    useProjectTemplates();
  // derived values
  const isWorkItemTemplatesAvailable = isAnyWorkItemTemplatesAvailable(workspaceSlug);
  const isProjectTemplatesAvailable = isAnyProjectTemplatesAvailable(workspaceSlug);
  const isInitializingTemplates = isInitializingWorkItemTemplates || isInitializingProjectTemplates;
  const isAnyTemplatesAvailable = isWorkItemTemplatesAvailable || isProjectTemplatesAvailable;

  if (!isInitializingTemplates && !isAnyTemplatesAvailable) {
    return <NoTemplatesEmptyState workspaceSlug={workspaceSlug} currentLevel={ETemplateLevel.WORKSPACE} />;
  }

  return <WorkspaceSettingsTemplatesListRoot workspaceSlug={workspaceSlug} />;
});
