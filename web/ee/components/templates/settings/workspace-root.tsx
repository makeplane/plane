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
  const { loader, getAllWorkItemTemplateIds } = useWorkItemTemplates();
  // derived values
  const isLoading = loader === "init-loader";
  const workItemTemplateIds = getAllWorkItemTemplateIds(workspaceSlug);

  if (workItemTemplateIds.length === 0 && !isLoading) {
    return <NoTemplatesEmptyState workspaceSlug={workspaceSlug} currentLevel={ETemplateLevel.WORKSPACE} />;
  }

  return <WorkspaceSettingsTemplatesListRoot workspaceSlug={workspaceSlug} />;
});
