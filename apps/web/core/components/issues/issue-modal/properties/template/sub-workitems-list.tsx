/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import React from "react";
import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
// hooks
import { extractWorkItemFormDataBlueprint } from "@plane/utils";
import { useIssueModal } from "@/hooks/context/use-issue-modal";
// plane web imports
import { TemplateCollapsibleWrapper } from "@/components/templates/settings/common/collapsible-wrapper";
import { WorkItemBlueprintListItem } from "@/components/templates/settings/work-item/blueprint/list/list-item";
import { useWorkItemTemplates } from "@/plane-web/hooks/store";

export const TemplateSubWorkitemsList = observer(function TemplateSubWorkitemsList() {
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
