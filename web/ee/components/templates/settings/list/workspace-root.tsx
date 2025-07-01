import { observer } from "mobx-react";
// plane imports
import { ETemplateLevel } from "@plane/constants";
import { ETemplateType } from "@plane/types";
// plane web imports
import { useProjectTemplates, useWorkItemTemplates, usePageTemplates } from "@/plane-web/hooks/store";
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
  const {
    isInitializingTemplates: isInitializingPageTemplates,
    getAllTemplateIds: getAllPageTemplateIds,
    getTemplateById: getPageTemplateById,
    deletePageTemplate,
  } = usePageTemplates();
  // derived values
  const projectTemplateIds = getAllProjectTemplateIds(workspaceSlug);
  const workItemTemplateIds = getAllWorkItemTemplateIds(workspaceSlug);
  const pageTemplateIds = getAllPageTemplateIds(workspaceSlug);

  return (
    <TemplateListActionWrapper {...props} level={ETemplateLevel.WORKSPACE}>
      {({ selectedTemplateId, handleUseTemplateAction }) => (
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
                selectedTemplateId={selectedTemplateId}
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
                selectedTemplateId={selectedTemplateId}
                getTemplateById={getWorkItemTemplateById}
                deleteTemplate={(templateId) => deleteWorkItemTemplate(workspaceSlug, templateId)}
                handleUseTemplateAction={() => handleUseTemplateAction(templateId, ETemplateType.WORK_ITEM)}
              />
            ))}
          </TemplateListWrapper>
          <TemplateListWrapper
            type={ETemplateType.PAGE}
            isInitializing={isInitializingPageTemplates}
            templateIds={pageTemplateIds}
          >
            {pageTemplateIds.map((templateId) => (
              <TemplateListItem
                key={templateId}
                templateId={templateId}
                workspaceSlug={workspaceSlug}
                currentLevel={ETemplateLevel.WORKSPACE}
                selectedTemplateId={selectedTemplateId}
                getTemplateById={getPageTemplateById}
                deleteTemplate={(templateId) => deletePageTemplate(workspaceSlug, templateId)}
                handleUseTemplateAction={() => handleUseTemplateAction(templateId, ETemplateType.PAGE)}
              />
            ))}
          </TemplateListWrapper>
        </>
      )}
    </TemplateListActionWrapper>
  );
});
