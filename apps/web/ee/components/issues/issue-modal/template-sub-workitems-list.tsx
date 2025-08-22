import React from "react";
import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
// hooks
import { extractWorkItemFormDataBlueprint } from "@plane/utils";
import { useIssueModal } from "@/hooks/context/use-issue-modal";
// plane web imports
import { TemplateCollapsibleWrapper } from "@/plane-web/components/templates/settings/common/collapsible-wrapper";
import { WorkItemBlueprintListItem } from "@/plane-web/components/templates/settings/work-item/blueprint/list/list-item";
import { useWorkItemTemplates } from "@/plane-web/hooks/store";

export const TemplateSubWorkitemsList: React.FC = observer(() => {
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { getTemplateById } = useWorkItemTemplates();
  // modal context
  const { workItemTemplateId } = useIssueModal();
  // derived values
  const workItemTemplate = workItemTemplateId ? getTemplateById(workItemTemplateId) : null;
  const subWorkItemsBlueprint = workItemTemplate?.template_data?.sub_workitems?.map(extractWorkItemFormDataBlueprint);

  if (!workItemTemplate || !subWorkItemsBlueprint || subWorkItemsBlueprint.length === 0) return null;
  return (
    <TemplateCollapsibleWrapper borderVariant="none" defaultOpen isOptional={false} title={t("common.sub_work_items")}>
      {subWorkItemsBlueprint?.map((workItem, index) => (
        <WorkItemBlueprintListItem
          allowEdit={false}
          key={workItem.id}
          index={index}
          workItem={workItem}
          usePropsForAdditionalData={false}
        />
      ))}
    </TemplateCollapsibleWrapper>
  );
});
