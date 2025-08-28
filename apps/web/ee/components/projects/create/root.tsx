"use client";

import { useState, FC, useEffect } from "react";
import { observer } from "mobx-react";
import { useForm, FormProvider } from "react-hook-form";
// plane imports
import { DEFAULT_PROJECT_FORM_VALUES, PROJECT_TRACKER_EVENTS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { EUserProjectRoles, IProjectBulkAddFormData } from "@plane/types";
import { Button, setToast, TOAST_TYPE } from "@plane/ui";
// types
import { TCreateProjectFormProps } from "@/ce/components/projects/create/root";
// constants
import ProjectCommonAttributes from "@/components/project/create/common-attributes";
import ProjectCreateHeader from "@/components/project/create/header";
// hooks
import { captureError, captureSuccess } from "@/helpers/event-tracker.helper";
import { useMember } from "@/hooks/store/use-member"
import { useProject } from "@/hooks/store/use-project"
import { useUser } from "@/hooks/store/user"
import { useWorkspace } from "@/hooks/store/use-workspace";
import { usePlatformOS } from "@/hooks/use-platform-os";
// plane web imports
import { useProjectCreation } from "@/plane-web/hooks/context/use-project-creation";
import { useFlag, useWorkspaceFeatures } from "@/plane-web/hooks/store";
import { useProjectAdvanced } from "@/plane-web/hooks/store/projects/use-projects";
import { TProject } from "@/plane-web/types/projects";
import { EWorkspaceFeatures } from "@/plane-web/types/workspace-feature";
// local imports
import ProjectAttributes from "./attributes";
import { ProjectCreateLoader } from "./loader";
import { ProjectCreationProvider } from "./provider";

export const CreateProjectForm: FC<TCreateProjectFormProps> = observer((props) => (
  <ProjectCreationProvider templateId={props.templateId}>
    <CreateProjectFormBase {...props} />
  </ProjectCreationProvider>
));

export const CreateProjectFormBase: FC<TCreateProjectFormProps> = observer((props) => {
  const { setToFavorite, workspaceSlug, onClose, handleNextStep, data, updateCoverImageStatus } = props;
  // store
  const { addProjectToFavorites, createProject } = useProject();
  const { projectCreationLoader, createProjectUsingTemplate } = useProjectAdvanced();
  // states
  const [isChangeInIdentifierRequired, setIsChangeInIdentifierRequired] = useState(true);
  // store hooks
  const { t } = useTranslation();
  const { currentWorkspace } = useWorkspace();
  const {
    project: { bulkAddMembersToProject },
    workspace: { getWorkspaceMemberDetails },
  } = useMember();
  const { data: currentUser } = useUser();
  const { isWorkspaceFeatureEnabled } = useWorkspaceFeatures();
  const { isMobile } = usePlatformOS();
  // context hooks
  const { projectTemplateId, isApplyingTemplate, handleTemplateChange } = useProjectCreation();
  // form info
  const methods = useForm<TProject>({
    defaultValues: { ...DEFAULT_PROJECT_FORM_VALUES, ...data },
    reValidateMode: "onChange",
  });
  const {
    formState: { isSubmitting },
    handleSubmit,
    reset,
    setValue,
  } = methods;
  // derived values
  const isProjectGroupingFlagEnabled = useFlag(workspaceSlug.toString(), "PROJECT_GROUPING");
  const isProjectGroupingEnabled =
    isWorkspaceFeatureEnabled(EWorkspaceFeatures.IS_PROJECT_GROUPING_ENABLED) && isProjectGroupingFlagEnabled;
  const isLoading = isSubmitting || isApplyingTemplate;

  useEffect(() => {
    if (projectTemplateId) {
      handleTemplateChange({
        workspaceSlug,
        reset,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectTemplateId]);

  const handleAddToFavorites = (projectId: string) => {
    if (!workspaceSlug) return;

    addProjectToFavorites(workspaceSlug.toString(), projectId).catch(() => {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "Couldn't remove the project from favorites. Please try again.",
      });
    });
  };

  const onSubmit = async (formData: Partial<TProject>) => {
    // Get the members payload for bulk add
    const allowAssetStatusUpdate = !projectTemplateId;
    const allowBulkAddMembers = isProjectGroupingEnabled || projectTemplateId;
    const membersPayload: IProjectBulkAddFormData["members"] = [];
    if (formData.members) {
      formData.members.forEach((memberId) => {
        const memberDetails = getWorkspaceMemberDetails(memberId);
        if (currentUser && currentUser.id !== memberId && memberDetails && memberDetails.role) {
          membersPayload.push({
            member_id: memberId,
            role: memberDetails.role as unknown as EUserProjectRoles,
          });
        }
      });
    }
    // Upper case identifier
    formData.identifier = formData.identifier?.toUpperCase();
    const coverImage = formData.cover_image_url;
    // if unsplash or a pre-defined image is uploaded, delete the old uploaded asset
    if (coverImage?.startsWith("http")) {
      formData.cover_image = coverImage;
      formData.cover_image_asset = null;
    }

    const createProjectService = projectTemplateId
      ? createProjectUsingTemplate.bind(
          createProjectUsingTemplate,
          workspaceSlug.toString(),
          projectTemplateId,
          handleNextStep
        )
      : createProject.bind(createProject, workspaceSlug.toString());

    return createProjectService(formData)
      .then(async (res) => {
        if (coverImage && allowAssetStatusUpdate) {
          await updateCoverImageStatus(res.id, coverImage);
        }
        if (allowBulkAddMembers && membersPayload.length > 0) {
          bulkAddMembersToProject(workspaceSlug.toString(), res.id, {
            members: membersPayload,
          });
        }
        captureSuccess({
          eventName: PROJECT_TRACKER_EVENTS.create,
          payload: {
            identifier: formData.identifier,
            id: res.id,
          },
        });
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Success!",
          message: "Project created successfully.",
        });
        if (setToFavorite) {
          handleAddToFavorites(res.id);
        }
        if (!projectTemplateId) {
          handleNextStep(res.id);
        }
      })
      .catch((err) => {
        try {
          captureError({
            eventName: PROJECT_TRACKER_EVENTS.create,
            payload: {
              identifier: formData.identifier,
            },
          });

          // Handle the new error format where codes are nested in arrays under field names
          const errorData = err?.data ?? {};

          const nameError = errorData.name?.includes("PROJECT_NAME_ALREADY_EXIST");
          const identifierError = errorData?.identifier?.includes("PROJECT_IDENTIFIER_ALREADY_EXIST");

          if (nameError || identifierError) {
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
          } else {
            setToast({
              type: TOAST_TYPE.ERROR,
              title: t("toast.error"),
              message: t("something_went_wrong"),
            });
          }
        } catch (error) {
          // Fallback error handling if the error processing fails
          console.error("Error processing API error:", error);
          setToast({
            type: TOAST_TYPE.ERROR,
            title: t("toast.error"),
            message: t("something_went_wrong"),
          });
        }
      });
  };

  const handleClose = () => {
    onClose();
    setIsChangeInIdentifierRequired(true);
    setTimeout(() => {
      reset();
    }, 300);
  };

  if (!currentWorkspace) return null;

  if (projectCreationLoader) {
    return <ProjectCreateLoader />;
  }

  return (
    <FormProvider {...methods}>
      <div className="p-3">
        <ProjectCreateHeader handleClose={handleClose} />
        <form onSubmit={handleSubmit(onSubmit)} className="px-3">
          <div className="mt-9 space-y-6 pb-5">
            <ProjectCommonAttributes
              setValue={setValue}
              isMobile={isMobile}
              isChangeInIdentifierRequired={isChangeInIdentifierRequired}
              setIsChangeInIdentifierRequired={setIsChangeInIdentifierRequired}
            />
            <ProjectAttributes
              workspaceSlug={workspaceSlug}
              currentWorkspace={currentWorkspace}
              isProjectGroupingEnabled={isProjectGroupingEnabled}
              data={data}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-custom-border-100">
            <Button variant="neutral-primary" size="sm" onClick={handleClose} tabIndex={6}>
              {t("common.cancel")}
            </Button>
            <Button variant="primary" type="submit" size="sm" loading={isLoading} tabIndex={7}>
              {isSubmitting ? t("common.creating") : t("create_project")}
            </Button>
          </div>
        </form>
      </div>
    </FormProvider>
  );
});
