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

import { observer } from "mobx-react";
// plane imports
import { ETemplateLevel } from "@plane/constants";
import { ETemplateType } from "@plane/types";
// plane web imports
import { usePageTemplates, useWorkItemTemplates } from "@/plane-web/hooks/store";
// local imports
import { TemplateListActionWrapper } from "./action-wrapper";
import { TemplateListItem } from "./list-item";
import { TemplateListWrapper } from "./list-wrapper";

type TProjectSettingsTemplatesListRootProps = {
  workspaceSlug: string;
  projectId: string;
};

export const ProjectSettingsTemplatesListRoot = observer(function ProjectSettingsTemplatesListRoot(
  props: TProjectSettingsTemplatesListRootProps
) {
  const { workspaceSlug, projectId } = props;
  // store hooks
  const {
    isInitializingTemplates: isInitializingWorkItemTemplates,
    getAllWorkItemTemplateIdsForProject,
    getTemplateById: getWorkItemTemplateById,
    deleteWorkItemTemplate,
  } = useWorkItemTemplates();
  const {
    isInitializingTemplates: isInitializingPageTemplates,
    getAllPageTemplateIdsForProject,
    getTemplateById: getPageTemplateById,
    deletePageTemplate,
  } = usePageTemplates();
  // derived values
  const workItemTemplateIds = getAllWorkItemTemplateIdsForProject(workspaceSlug, projectId);
  const pageTemplateIds = getAllPageTemplateIdsForProject(workspaceSlug, projectId);

  return (
    <TemplateListActionWrapper {...props} level={ETemplateLevel.PROJECT}>
      {({ selectedTemplateId, handleUseTemplateAction }) => (
        <>
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
                currentLevel={ETemplateLevel.PROJECT}
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
