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
import useSWR from "swr";
// plane imports
import { ETemplateLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import { EFileAssetType, ETemplateType } from "@plane/types";
import { getTemplateSettingsBasePath, getTemplateTypeI18nName, projectTemplateFormDataToData } from "@plane/utils";
// helpers
import { getCoverImageType, uploadCoverImage } from "@/helpers/cover-image.helper";
// hooks
import { useMember } from "@/hooks/store/use-member";
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useAppRouter } from "@/hooks/use-app-router";
// plane web imports
import { useFlag, useProjectTemplates, useWorkspaceProjectStates } from "@/plane-web/hooks/store";
// local imports
import type { TProjectTemplateFormSubmitData } from "./form";
import { EProjectFormOperation, ProjectTemplateFormRoot } from "./form";

type TCreateUpdateProjectTemplateProps = {
  workspaceSlug: string;
  templateId?: string;
};

export const CreateUpdateProjectTemplate = observer(function CreateUpdateProjectTemplate(
  props: TCreateUpdateProjectTemplateProps
) {
  const { workspaceSlug, templateId } = props;
  // router
  const router = useAppRouter();
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { getWorkspaceBySlug } = useWorkspace();
  const { getUserDetails } = useMember();
  const { getProjectStateById } = useWorkspaceProjectStates();
  const { getTemplateById, fetchTemplateById, createProjectTemplate } = useProjectTemplates();
  // derived values
  const templateSettingsPagePath = getTemplateSettingsBasePath({
    workspaceSlug,
    level: ETemplateLevel.WORKSPACE,
  });
  const operationToPerform = templateId ? EProjectFormOperation.UPDATE : EProjectFormOperation.CREATE;
  const isProjectTemplatesEnabled = useFlag(workspaceSlug, "PROJECT_TEMPLATES");
  // fetch template details
  useSWR(
    workspaceSlug && templateId && isProjectTemplatesEnabled
      ? ["workItemTemplates", workspaceSlug, templateId, isProjectTemplatesEnabled]
      : null,
    workspaceSlug && templateId && isProjectTemplatesEnabled
      ? () =>
          fetchTemplateById({
            workspaceSlug,
            templateId,
          })
      : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  const handleFormSubmit = async (data: TProjectTemplateFormSubmitData) => {
    const { data: templateData, workItemListCustomPropertyValues } = data;

    // Get current workspace detail
    const currentWorkspace = getWorkspaceBySlug(workspaceSlug);
    if (!currentWorkspace) return;

    // Handle cover image upload if it's a local static image
    let processedTemplateData = { ...templateData };
    const coverImage = templateData.project.cover_image_url;

    if (coverImage) {
      const imageType = getCoverImageType(coverImage);

      if (imageType === "local_static" || imageType === "unsplash") {
        try {
          const uploadedUrl = await uploadCoverImage(coverImage, {
            workspaceSlug: workspaceSlug,
            entityIdentifier: templateData.template.id || "",
            entityType: EFileAssetType.TEMPLATE_ATTACHMENT,
            isUserAsset: false,
          });

          processedTemplateData = {
            ...processedTemplateData,
            project: {
              ...processedTemplateData.project,
              cover_image_url: uploadedUrl,
            },
          };
        } catch (error) {
          console.error("Error uploading cover image for template:", error);
          setToast({
            type: TOAST_TYPE.ERROR,
            title: t("toast.error"),
            message: error instanceof Error ? error.message : "Failed to upload cover image",
          });
          return;
        }
      }
    }

    const payload = projectTemplateFormDataToData({
      formData: processedTemplateData,
      getUserDetails,
      getWorkspaceProjectStateById: getProjectStateById,
      workItemListCustomPropertyValues,
      workspaceId: currentWorkspace.id,
    });

    if (operationToPerform === EProjectFormOperation.UPDATE && templateData.template.id) {
      const template = getTemplateById(templateData.template.id);
      if (template) {
        template
          .update(payload)
          .then(() => {
            router.push(templateSettingsPagePath);
            setToast({
              type: TOAST_TYPE.SUCCESS,
              title: t("templates.toasts.update.success.title"),
              message: t("templates.toasts.update.success.message", {
                templateName: templateData.template.name,
                templateType: t(getTemplateTypeI18nName(template.template_type))?.toLowerCase(),
              }),
            });
          })
          .catch(() => {
            setToast({
              type: TOAST_TYPE.ERROR,
              title: t("templates.toasts.update.error.title"),
              message: t("templates.toasts.update.error.message"),
            });
          });
      }
    } else {
      await createProjectTemplate({
        workspaceSlug,
        templateData: payload,
      })
        .then(() => {
          router.push(templateSettingsPagePath);
          setToast({
            type: TOAST_TYPE.SUCCESS,
            title: t("templates.toasts.create.success.title"),
            message: t("templates.toasts.create.success.message", {
              templateName: templateData.template.name,
              templateType: t(getTemplateTypeI18nName(ETemplateType.PROJECT))?.toLowerCase(),
            }),
          });
        })
        .catch(() => {
          setToast({
            type: TOAST_TYPE.ERROR,
            title: t("templates.toasts.create.error.title"),
            message: t("templates.toasts.create.error.message"),
          });
        });
    }
  };

  const handleFormCancel = () => {
    router.back();
  };

  return (
    <ProjectTemplateFormRoot
      workspaceSlug={workspaceSlug}
      templateId={templateId}
      operation={operationToPerform}
      handleFormCancel={handleFormCancel}
      handleFormSubmit={handleFormSubmit}
    />
  );
});
