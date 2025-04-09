import { FC } from "react";
import { observer } from "mobx-react";
// plane web imports
import { ETemplateLevel } from "@plane/constants";
import { useWorkItemTemplates } from "@/plane-web/hooks/store";
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
  // derived values
  const isWorkItemTemplatesAvailable = isAnyWorkItemTemplatesAvailable(workspaceSlug);
  const isInitializingTemplates = isInitializingWorkItemTemplates;
  const isAnyTemplatesAvailable = isWorkItemTemplatesAvailable;

  if (!isInitializingTemplates && !isAnyTemplatesAvailable) {
    return <NoTemplatesEmptyState workspaceSlug={workspaceSlug} currentLevel={ETemplateLevel.WORKSPACE} />;
  }

  return <WorkspaceSettingsTemplatesListRoot workspaceSlug={workspaceSlug} />;
});
