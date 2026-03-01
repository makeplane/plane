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

import React, { useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { ETemplateLevel } from "@plane/constants";
import { getEditorContentWithReplacedAssets } from "@plane/editor";
import { useTranslation } from "@plane/i18n";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import { FileService } from "@plane/services";
import type { TPage } from "@plane/types";
import { EFileAssetType, EIssuesStoreType, ETemplateType } from "@plane/types";
import { extractPageFormData } from "@plane/utils";
// components
import { CreateUpdateIssueModal } from "@/components/issues/issue-modal/root";
import { CreateProjectModal } from "@/components/projects/modals/create-project-modal";
// hooks
import { useAppRouter } from "@/hooks/use-app-router";
// plane web imports
import { EPageStoreType, usePageStore, usePageTemplates } from "@/plane-web/hooks/store";

const fileService = new FileService();

type TChildProps = {
  selectedTemplateId: string | null;
  handleUseTemplateAction: (templateId: string, type: ETemplateType) => void;
};

type TWorkspaceTemplateListActionWrapperProps = {
  level: ETemplateLevel.WORKSPACE;
};

type TProjectTemplateListActionWrapperProps = {
  level: ETemplateLevel.PROJECT;
  projectId: string;
};

type TTemplateListActionWrapperProps = {
  workspaceSlug: string;
  children: (props: TChildProps) => React.ReactElement;
} & (TWorkspaceTemplateListActionWrapperProps | TProjectTemplateListActionWrapperProps);

export const TemplateListActionWrapper = observer(function TemplateListActionWrapper(
  props: TTemplateListActionWrapperProps
) {
  const { workspaceSlug, level, children } = props;
  // states
  const [isCreateProjectModalOpen, setIsCreateProjectModalOpen] = useState(false);
  const [isCreateWorkItemModalOpen, setIsCreateWorkItemModalOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  // router
  const router = useAppRouter();
  // translation
  const { t } = useTranslation();
  // store hooks
  const { createPage, getPageById } = usePageStore(
    level === ETemplateLevel.PROJECT ? EPageStoreType.PROJECT : EPageStoreType.WORKSPACE
  );
  const { getTemplateById: getPageTemplateById } = usePageTemplates();

  const resetLocalStates = () => {
    setSelectedTemplateId(null);
    setIsCreateProjectModalOpen(false);
    setIsCreateWorkItemModalOpen(false);
  };

  const handleUseTemplateAction = (templateId: string, type: ETemplateType) => {
    setSelectedTemplateId(templateId);
    switch (type) {
      case ETemplateType.PROJECT:
        setIsCreateProjectModalOpen(true);
        break;
      case ETemplateType.WORK_ITEM:
        setIsCreateWorkItemModalOpen(true);
        break;
      case ETemplateType.PAGE:
        handleUsePageTemplateAction(templateId);
        break;
      default:
        console.warn(`Unhandled template type: ${type}`);
    }
  };

  const handleUsePageTemplateAction = async (templateId: string) => {
    try {
      // Get the template details
      const template = getPageTemplateById(templateId);
      if (!template) {
        console.error("Template not found");
        return;
      }

      // Extract the page data from the template for the payload
      const pageData = extractPageFormData(template.template_data);
      const payload: Partial<TPage> = {
        name: pageData.name,
        logo_props: pageData.logo_props,
      };

      // create the page
      const createPageResponse = await createPage(payload);
      if (!createPageResponse?.id) {
        console.error("Failed to create page while using template.");
        return;
      }
      const page = getPageById(createPageResponse.id);
      if (!page || !page.id) {
        console.error("Failed to get page while using template.");
        return;
      }

      // duplicate the assets
      const duplicateAssetService = fileService.duplicateAssets.bind(fileService, workspaceSlug);
      const documentPayload = await getEditorContentWithReplacedAssets({
        descriptionHTML: pageData.description_html ?? "",
        entityId: page.id,
        entityType: EFileAssetType.PAGE_DESCRIPTION,
        projectId: level === ETemplateLevel.PROJECT ? props.projectId : undefined,
        variant: "document",
        duplicateAssetService,
      });
      await page.updateDescription(documentPayload);

      // get the page route for redirection
      const pageRoute = page?.getRedirectionLink() ?? "";
      router.push(pageRoute);
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: `${t("toast.error")}!`,
        message: "Error while creating page using template. Please try again.",
      });
    } finally {
      resetLocalStates();
    }
  };

  return (
    <>
      <CreateProjectModal
        workspaceSlug={workspaceSlug}
        templateId={selectedTemplateId ?? undefined}
        isOpen={isCreateProjectModalOpen}
        onClose={resetLocalStates}
      />
      <CreateUpdateIssueModal
        isOpen={isCreateWorkItemModalOpen}
        onClose={resetLocalStates}
        storeType={EIssuesStoreType.PROJECT}
        templateId={selectedTemplateId ?? undefined}
      />
      <div className="flex flex-col gap-10 py-6 w-full">
        {children({ selectedTemplateId, handleUseTemplateAction })}
      </div>
    </>
  );
});
