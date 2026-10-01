/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * Modified by Okręgowa Spółdzielnia Mleczarska w Piątnicy in 2026.
 * See the LICENSE file for details.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { observer } from "mobx-react";
import { FormProvider, useForm } from "react-hook-form";
// plane imports
import { useTranslation } from "@plane/i18n";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { EFileAssetType } from "@plane/types";
import type { TProjectTemplate, TProjectTemplatePayload } from "@plane/types";
// components
import ProjectCommonAttributes from "@/components/project/create/common-attributes";
import ProjectCreateHeader from "@/components/project/create/header";
import ProjectCreateButtons from "@/components/project/create/project-create-buttons";
// hooks
import { getCoverImageType, uploadCoverImage } from "@/helpers/cover-image.helper";
import { useProject } from "@/hooks/store/use-project";
import { usePlatformOS } from "@/hooks/use-platform-os";
import { ProjectTemplateService } from "@/services/project-template.service";
// plane web types
import type { TProject } from "@/plane-web/types/projects";
import { IssueTypeService } from "@/services/issue-type.service";
import { ProjectAttributes } from "./attributes";
import { ProjectCreateFeatureToggles } from "./feature-toggles";
import { ProjectCreateIssueTypesAssign } from "./issue-types-assign";
import { getProjectFormValues } from "./utils";

const projectTemplateService = new ProjectTemplateService();
const issueTypeService = new IssueTypeService();

export type TCreateProjectFormProps = {
  setToFavorite?: boolean;
  workspaceSlug: string;
  onClose: () => void;
  handleNextStep: (projectId: string) => void;
  data?: Partial<TProject>;
  templateId?: string;
  updateCoverImageStatus: (projectId: string, coverImage: string) => Promise<void>;
};

export const CreateProjectForm = observer(function CreateProjectForm(props: TCreateProjectFormProps) {
  const { setToFavorite, workspaceSlug, data, onClose, handleNextStep, updateCoverImageStatus, templateId } = props;
  const { t } = useTranslation();
  const { addProjectToFavorites, createProject, updateProject } = useProject();
  const [shouldAutoSyncIdentifier, setShouldAutoSyncIdentifier] = useState(true);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(templateId ?? null);
  const [isTemplateApplying, setIsTemplateApplying] = useState(false);
  const [selectedIssueTypeIds, setSelectedIssueTypeIds] = useState<string[]>([]);
  const methods = useForm<TProject>({
    defaultValues: { ...getProjectFormValues(), ...data },
    reValidateMode: "onChange",
  });
  const { handleSubmit, reset, setValue, watch } = methods;
  const { isMobile } = usePlatformOS();
  const isIssueTypeEnabled = Boolean(watch("is_issue_type_enabled"));
  const applyProjectTemplatePayload = useCallback(
    (payload: TProjectTemplatePayload) => {
      if (payload.name !== undefined) setValue("name", payload.name, { shouldDirty: true });
      if (payload.identifier !== undefined) {
        setValue("identifier", payload.identifier, { shouldDirty: true });
        setShouldAutoSyncIdentifier(false);
      }
      if (payload.description !== undefined) setValue("description", payload.description, { shouldDirty: true });
      if (payload.start_date !== undefined) setValue("start_date", payload.start_date, { shouldDirty: true });
      if (payload.target_date !== undefined) setValue("target_date", payload.target_date, { shouldDirty: true });
      if (payload.network !== undefined) setValue("network", payload.network, { shouldDirty: true });
      if (payload.project_lead !== undefined) setValue("project_lead", payload.project_lead, { shouldDirty: true });
      if (payload.default_assignee !== undefined) {
        setValue("default_assignee", payload.default_assignee, { shouldDirty: true });
      }
      if (payload.logo_props) setValue("logo_props", payload.logo_props, { shouldDirty: true });
      if (payload.cover_image_url !== undefined) {
        setValue("cover_image_url", payload.cover_image_url ?? undefined, { shouldDirty: true });
      }
      if (payload.cycle_view !== undefined) setValue("cycle_view", payload.cycle_view, { shouldDirty: true });
      if (payload.module_view !== undefined) setValue("module_view", payload.module_view, { shouldDirty: true });
      if (payload.issue_views_view !== undefined) {
        setValue("issue_views_view", payload.issue_views_view, { shouldDirty: true });
      }
      if (payload.page_view !== undefined) setValue("page_view", payload.page_view, { shouldDirty: true });
      if (payload.intake_view !== undefined) setValue("inbox_view", payload.intake_view, { shouldDirty: true });
      if (payload.is_time_tracking_enabled !== undefined) {
        setValue("is_time_tracking_enabled", payload.is_time_tracking_enabled, { shouldDirty: true });
      }
      if (payload.is_issue_type_enabled !== undefined) {
        setValue("is_issue_type_enabled", payload.is_issue_type_enabled, { shouldDirty: true });
      }
      if (payload.guest_view_all_features !== undefined) {
        setValue("guest_view_all_features", payload.guest_view_all_features, { shouldDirty: true });
      }
    },
    [setValue]
  );

  const tRef = useRef(t);
  tRef.current = t;

  const fetchingTemplateKeyRef = useRef<string | null>(null);
  const appliedInitialTemplateKeyRef = useRef<string | null>(null);
  const cachedTemplateRef = useRef<TProjectTemplate | null>(null);

  const getTemplateCacheKey = useCallback((id: string) => `${workspaceSlug}:${id}`, [workspaceSlug]);

  const showApplyTemplateError = useCallback(() => {
    setToast({
      type: TOAST_TYPE.ERROR,
      title: tRef.current("error"),
      message: tRef.current("workspace_settings.settings.project_templates.toasts.apply_failed.message"),
    });
  }, []);

  const loadProjectTemplate = useCallback(
    async (id: string) => {
      const cacheKey = getTemplateCacheKey(id);
      if (fetchingTemplateKeyRef.current === cacheKey) return;

      const cached = cachedTemplateRef.current;
      if (cached?.id === id) {
        applyProjectTemplatePayload(cached.payload ?? {});
        return;
      }

      fetchingTemplateKeyRef.current = cacheKey;
      setIsTemplateApplying(true);
      try {
        const template = await projectTemplateService.retrieve(workspaceSlug.toString(), id);
        cachedTemplateRef.current = template;
        applyProjectTemplatePayload(template.payload ?? {});
      } catch (error) {
        console.error(error);
        showApplyTemplateError();
        throw error;
      } finally {
        if (fetchingTemplateKeyRef.current === cacheKey) {
          fetchingTemplateKeyRef.current = null;
        }
        setIsTemplateApplying(false);
      }
    },
    [applyProjectTemplatePayload, getTemplateCacheKey, showApplyTemplateError, workspaceSlug]
  );

  const handleTemplateSelect = useCallback(
    async (nextTemplateId: string | null) => {
      setSelectedTemplateId(nextTemplateId);
      setSelectedIssueTypeIds([]);
      if (!nextTemplateId) {
        cachedTemplateRef.current = null;
        return;
      }
      await loadProjectTemplate(nextTemplateId);
    },
    [loadProjectTemplate]
  );

  useEffect(() => {
    setSelectedTemplateId(templateId ?? null);
    if (!templateId) {
      appliedInitialTemplateKeyRef.current = null;
      cachedTemplateRef.current = null;
      return;
    }

    const templateKey = getTemplateCacheKey(templateId);
    if (appliedInitialTemplateKeyRef.current === templateKey) return;
    appliedInitialTemplateKeyRef.current = templateKey;

    void loadProjectTemplate(templateId);
  }, [getTemplateCacheKey, loadProjectTemplate, templateId]);

  const handleAddToFavorites = (projectId: string) => {
    if (!workspaceSlug) return;

    addProjectToFavorites(workspaceSlug.toString(), projectId).catch(() => {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("toast.error"),
        message: t("failed_to_remove_project_from_favorites"),
      });
    });
  };

  const onSubmit = async (formData: Partial<TProject>) => {
    formData.identifier = formData.identifier?.toUpperCase();
    const coverImage = formData.cover_image_url;
    let uploadedAssetUrl: string | null = null;

    if (coverImage) {
      const imageType = getCoverImageType(coverImage);

      if (imageType === "local_static") {
        try {
          uploadedAssetUrl = await uploadCoverImage(coverImage, {
            workspaceSlug: workspaceSlug.toString(),
            entityIdentifier: "",
            entityType: EFileAssetType.PROJECT_COVER,
            isUserAsset: false,
          });
        } catch (error) {
          console.error("Error uploading cover image:", error);
          setToast({
            type: TOAST_TYPE.ERROR,
            title: t("toast.error"),
            message: error instanceof Error ? error.message : "Failed to upload cover image",
          });
          return Promise.reject(error);
        }
      } else {
        formData.cover_image = coverImage;
        formData.cover_image_asset = null;
      }
    }

    try {
      const res = await createProject(workspaceSlug.toString(), formData);
      if (uploadedAssetUrl) {
        await updateCoverImageStatus(res.id, uploadedAssetUrl);
        await updateProject(workspaceSlug.toString(), res.id, { cover_image_url: uploadedAssetUrl });
      } else if (coverImage && coverImage.startsWith("http")) {
        await updateCoverImageStatus(res.id, coverImage);
        await updateProject(workspaceSlug.toString(), res.id, { cover_image_url: coverImage });
      }
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("success"),
        message: t("project_created_successfully"),
      });

      if (setToFavorite) {
        handleAddToFavorites(res.id);
      }

      if (selectedTemplateId) {
        try {
          const template =
            cachedTemplateRef.current?.id === selectedTemplateId
              ? cachedTemplateRef.current
              : await projectTemplateService.retrieve(workspaceSlug.toString(), selectedTemplateId);
          if (template.payload?.state_templates?.length) {
            await projectTemplateService.createProjectStatesFromTemplate(
              workspaceSlug.toString(),
              res.id,
              template.payload.state_templates
            );
          }
          if (template.payload?.label_templates?.length) {
            await projectTemplateService.createProjectLabelsFromTemplate(
              workspaceSlug.toString(),
              res.id,
              template.payload.label_templates
            );
          }
          if (template.payload?.is_issue_type_enabled) {
            await projectTemplateService.seedIssueTypesFromProjectTemplate(
              workspaceSlug.toString(),
              res.id,
              selectedTemplateId
            );
          }
        } catch (seedError) {
          console.error(seedError);
          setToast({
            type: TOAST_TYPE.WARNING,
            title: t("warning"),
            message: t("workspace_settings.settings.project_templates.toasts.apply_followup_failed.message"),
          });
        }
      } else if (formData.is_issue_type_enabled && selectedIssueTypeIds.length > 0) {
        try {
          await issueTypeService.bulkAssignProjectTypes(workspaceSlug.toString(), res.id, {
            issue_type_ids: selectedIssueTypeIds,
            default_type_id: selectedIssueTypeIds[0],
          });
        } catch (assignError) {
          console.error(assignError);
          setToast({
            type: TOAST_TYPE.WARNING,
            title: t("warning"),
            message: t("project_create.features.work_item_types.assign_failed"),
          });
        }
      }
      handleNextStep(res.id);
    } catch (err) {
      try {
        const errorData = (err as { data?: Record<string, string[]> })?.data ?? {};

        const nameError = errorData.name?.includes("PROJECT_NAME_ALREADY_EXIST");
        const identifierError = errorData.identifier?.includes("PROJECT_IDENTIFIER_ALREADY_EXIST");
        const nameCharsError = errorData.name?.includes("PROJECT_NAME_CANNOT_CONTAIN_SPECIAL_CHARACTERS");

        if (nameError || identifierError || nameCharsError) {
          if (nameError) {
            setToast({
              type: TOAST_TYPE.ERROR,
              title: t("toast.error"),
              message: t("project_name_already_taken"),
            });
          }

          if (identifierError) {
            setToast({
              type: TOAST_TYPE.ERROR,
              title: t("toast.error"),
              message: t("project_identifier_already_taken"),
            });
          }

          if (nameCharsError) {
            setToast({
              type: TOAST_TYPE.ERROR,
              title: t("toast.error"),
              message: t("project_name_cannot_contain_special_characters"),
            });
          }
        } else {
          setToast({
            type: TOAST_TYPE.ERROR,
            title: t("toast.error"),
            message: t("something_went_wrong"),
          });
        }
      } catch (error) {
        console.error("Error processing API error:", error);
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("toast.error"),
          message: t("something_went_wrong"),
        });
      }
    }
  };

  const handleClose = () => {
    onClose();
    setShouldAutoSyncIdentifier(true);
    setSelectedTemplateId(null);
    setSelectedIssueTypeIds([]);
    appliedInitialTemplateKeyRef.current = null;
    fetchingTemplateKeyRef.current = null;
    cachedTemplateRef.current = null;
    setTimeout(() => {
      reset();
    }, 300);
  };

  return (
    <FormProvider {...methods}>
      <ProjectCreateHeader
        handleClose={handleClose}
        isMobile={isMobile}
        selectedTemplateId={selectedTemplateId}
        handleTemplateSelect={handleTemplateSelect}
        isTemplateApplying={isTemplateApplying}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="px-3">
        <div className="mt-9 space-y-6 pb-5">
          <ProjectCommonAttributes
            setValue={setValue}
            isMobile={isMobile}
            shouldAutoSyncIdentifier={shouldAutoSyncIdentifier}
            setShouldAutoSyncIdentifier={setShouldAutoSyncIdentifier}
          />
          <ProjectAttributes isMobile={isMobile} />
          <ProjectCreateFeatureToggles />
          {isIssueTypeEnabled && !selectedTemplateId ? (
            <div className="rounded-md border border-subtle bg-surface-1 p-3">
              <p className="pb-2 text-13 font-medium text-primary">
                {t("project_create.features.work_item_types.assign_label")}
              </p>
              <ProjectCreateIssueTypesAssign
                workspaceSlug={workspaceSlug.toString()}
                value={selectedIssueTypeIds}
                onChange={setSelectedIssueTypeIds}
              />
            </div>
          ) : null}
        </div>
        <ProjectCreateButtons handleClose={handleClose} />
      </form>
    </FormProvider>
  );
});
