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
  const {
    isInitializingTemplates: isInitializingWorkItemTemplates,
    getAllWorkItemTemplateIdsForProject,
    getTemplateById: getWorkItemTemplateById,
    deleteWorkItemTemplate,
  } = useWorkItemTemplates();
  // derived values
  const workItemTemplateIds = getAllWorkItemTemplateIdsForProject(workspaceSlug, projectId);

  return (
    <TemplateListActionWrapper workspaceSlug={workspaceSlug}>
      {({ handleUseTemplateAction }) => (
        <TemplateListWrapper
          type={ETemplateType.WORK_ITEM}
          isInitializing={isInitializingWorkItemTemplates}
          templateIds={workItemTemplateIds}
        >
          {workItemTemplateIds.map((templateId) => (
            <TemplateListItem
              key={templateId}
              templateId={templateId}
              workspaceSlug={workspaceSlug}
              currentLevel={ETemplateLevel.PROJECT}
              getTemplateById={getWorkItemTemplateById}
              deleteTemplate={(templateId) => deleteWorkItemTemplate(workspaceSlug, templateId)}
              handleUseTemplateAction={() => handleUseTemplateAction(templateId, ETemplateType.WORK_ITEM)}
            />
          ))}
        </TemplateListWrapper>
      )}
    </TemplateListActionWrapper>
  );
});
