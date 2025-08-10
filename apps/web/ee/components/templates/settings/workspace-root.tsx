import { FC } from "react";
import { observer } from "mobx-react";
// plane web imports
import { ETemplateLevel } from "@plane/constants";
import { useProjectTemplates, useWorkItemTemplates, usePageTemplates } from "@/plane-web/hooks/store";
// local imports
import { WorkspaceSettingsTemplatesListRoot } from "./list";
import { NoTemplatesEmptyState } from "./no-templates";

type TWorkspaceTemplatesSettingsRootProps = {
  workspaceSlug: string;
};

export const WorkspaceTemplatesSettingsRoot: FC<TWorkspaceTemplatesSettingsRootProps> = observer((props) => {
  const { workspaceSlug } = props;
  // store hooks
  const { isInitializingTemplates: isInitializingProjectTemplates, isAnyProjectTemplatesAvailable } =
    useProjectTemplates();
  const { isInitializingTemplates: isInitializingWorkItemTemplates, isAnyWorkItemTemplatesAvailable } =
    useWorkItemTemplates();
  const { isInitializingTemplates: isInitializingPageTemplates, isAnyPageTemplatesAvailable } = usePageTemplates();
  // derived values
  const isProjectTemplatesAvailable = isAnyProjectTemplatesAvailable(workspaceSlug);
  const isWorkItemTemplatesAvailable = isAnyWorkItemTemplatesAvailable(workspaceSlug);
  const isPageTemplatesAvailable = isAnyPageTemplatesAvailable(workspaceSlug);
  const isInitializingTemplates =
    isInitializingProjectTemplates || isInitializingWorkItemTemplates || isInitializingPageTemplates;
  const isAnyTemplatesAvailable =
    isProjectTemplatesAvailable || isWorkItemTemplatesAvailable || isPageTemplatesAvailable;

  if (!isInitializingTemplates && !isAnyTemplatesAvailable) {
    return <NoTemplatesEmptyState workspaceSlug={workspaceSlug} currentLevel={ETemplateLevel.WORKSPACE} />;
  }

  return <WorkspaceSettingsTemplatesListRoot workspaceSlug={workspaceSlug} />;
});
