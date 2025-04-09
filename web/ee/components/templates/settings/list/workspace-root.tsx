import { observer } from "mobx-react";
// plane imports
import { ETemplateLevel, ETemplateType } from "@plane/constants";
// plane web imports
import { useProjectTemplates, useWorkItemTemplates } from "@/plane-web/hooks/store";
// local imports
import { TemplateListActionWrapper } from "./action-wrapper";
import { TemplateListItem } from "./list-item";
import { TemplateListWrapper } from "./list-wrapper";

type TWorkspaceSettingsTemplatesListRoot = {
  workspaceSlug: string;
};

export const WorkspaceSettingsTemplatesListRoot = observer((props: TWorkspaceSettingsTemplatesListRoot) => {
  const { workspaceSlug } = props;
  // store hooks
  const {
    isInitializingTemplates: isInitializingProjectTemplates,
    getAllTemplateIds: getAllProjectTemplateIds,
    getTemplateById: getProjectTemplateById,
    deleteProjectTemplate,
  } = useProjectTemplates();
  const {
    isInitializingTemplates: isInitializingWorkItemTemplates,
    getAllWorkItemTemplateIds,
    getTemplateById: getWorkItemTemplateById,
    deleteWorkItemTemplate,
  } = useWorkItemTemplates();
  // derived values
  const projectTemplateIds = getAllProjectTemplateIds(workspaceSlug);
  const workItemTemplateIds = getAllWorkItemTemplateIds(workspaceSlug);

  return (
    <TemplateListActionWrapper workspaceSlug={workspaceSlug}>
      {({ handleUseTemplateAction }) => (
        <>
          <TemplateListWrapper
            type={ETemplateType.PROJECT}
            isInitializing={isInitializingProjectTemplates}
            templateIds={projectTemplateIds}
          >
            {projectTemplateIds.map((templateId) => (
              <TemplateListItem
                key={templateId}
                templateId={templateId}
                workspaceSlug={workspaceSlug}
                currentLevel={ETemplateLevel.WORKSPACE}
                getTemplateById={getProjectTemplateById}
                deleteTemplate={(templateId) => deleteProjectTemplate(workspaceSlug, templateId)}
                handleUseTemplateAction={() => handleUseTemplateAction(templateId, ETemplateType.PROJECT)}
              />
            ))}
          </TemplateListWrapper>
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
                currentLevel={ETemplateLevel.WORKSPACE}
                getTemplateById={getWorkItemTemplateById}
                deleteTemplate={(templateId) => deleteWorkItemTemplate(workspaceSlug, templateId)}
                handleUseTemplateAction={() => handleUseTemplateAction(templateId, ETemplateType.WORK_ITEM)}
              />
            ))}
          </TemplateListWrapper>
        </>
      )}
    </TemplateListActionWrapper>
  );
});
