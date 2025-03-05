import { observer } from "mobx-react";
// plane imports
import { ETemplateLevel, ETemplateType } from "@plane/constants";
// plane web imports
import { useWorkItemTemplates } from "@/plane-web/hooks/store";
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
  const { loader, getAllWorkItemTemplateIds, getTemplateById, deleteWorkItemTemplate } = useWorkItemTemplates();
  // derived values
  const workItemTemplateIds = getAllWorkItemTemplateIds();

  return (
    <TemplateListActionWrapper>
      {({ handleUseTemplateAction }) => (
        <TemplateListWrapper type={ETemplateType.WORK_ITEM} loaderState={loader}>
          {workItemTemplateIds.map((templateId) => (
            <TemplateListItem
              key={templateId}
              templateId={templateId}
              workspaceSlug={workspaceSlug}
              currentLevel={ETemplateLevel.WORKSPACE}
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
