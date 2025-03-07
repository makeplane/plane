import { observer } from "mobx-react";
// plane imports
import { ETemplateLevel, ETemplateType } from "@plane/constants";
// plane web imports
import { useWorkItemTemplates } from "@/plane-web/hooks/store";
// local imports
import { TemplateListActionWrapper } from "./action-wrapper";
import { TemplateListItem } from "./list-item";
import { TemplateListWrapper } from "./list-wrapper";

type TProjectSettingsTemplatesListRootProps = {
  workspaceSlug: string;
  projectId: string;
};

export const ProjectSettingsTemplatesListRoot = observer((props: TProjectSettingsTemplatesListRootProps) => {
  const { workspaceSlug, projectId } = props;
  // store hooks
  const { loader, getAllWorkItemTemplateIdsForProject, getTemplateById, deleteWorkItemTemplate } =
    useWorkItemTemplates();
  // derived values
  const workItemTemplateIds = getAllWorkItemTemplateIdsForProject(projectId);

  return (
    <TemplateListActionWrapper>
      {({ handleUseTemplateAction }) => (
        <TemplateListWrapper type={ETemplateType.WORK_ITEM} loaderState={loader}>
          {workItemTemplateIds.map((templateId) => (
            <TemplateListItem
              key={templateId}
              templateId={templateId}
              workspaceSlug={workspaceSlug}
              currentLevel={ETemplateLevel.PROJECT}
              getTemplateById={getTemplateById}
              deleteTemplate={(templateId) => deleteWorkItemTemplate(workspaceSlug, templateId)}
              handleUseTemplateAction={() => handleUseTemplateAction(templateId, ETemplateType.WORK_ITEM)}
            />
          ))}
        </TemplateListWrapper>
      )}
    </TemplateListActionWrapper>
  );
});
