import { observer } from "mobx-react";
import useSWR from "swr";
// plane imports
import { ETemplateLevel, PROJECT_TEMPLATE_TRACKER_EVENTS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { ETemplateType } from "@plane/types";
// hooks
import { setToast, TOAST_TYPE } from "@plane/ui";
import { getTemplateSettingsBasePath, getTemplateTypeI18nName, projectTemplateFormDataToData } from "@plane/utils";
import { captureError, captureSuccess } from "@/helpers/event-tracker.helper";
import { useMember, useWorkspace } from "@/hooks/store";
import { useAppRouter } from "@/hooks/use-app-router";
// plane web imports
import { useFlag, useProjectTemplates, useWorkspaceProjectStates } from "@/plane-web/hooks/store";
// local imports
import { EProjectFormOperation, TProjectTemplateFormSubmitData, ProjectTemplateFormRoot } from "./form";

type TCreateUpdateProjectTemplateProps = {
  workspaceSlug: string;
  templateId?: string;
};

export const CreateUpdateProjectTemplate = observer((props: TCreateUpdateProjectTemplateProps) => {
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

    const payload = projectTemplateFormDataToData({
      formData: templateData,
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
            captureSuccess({
              eventName: PROJECT_TEMPLATE_TRACKER_EVENTS.UPDATE,
              payload: {
                id: template.id,
              },
            });
          })
          .catch(() => {
            setToast({
              type: TOAST_TYPE.ERROR,
              title: t("templates.toasts.update.error.title"),
              message: t("templates.toasts.update.error.message"),
            });
            captureError({
              eventName: PROJECT_TEMPLATE_TRACKER_EVENTS.UPDATE,
              payload: {
                id: template.id,
              },
            });
          });
      }
    } else {
      await createProjectTemplate({
        workspaceSlug,
        templateData: payload,
      })
        .then((template) => {
          router.push(templateSettingsPagePath);
          setToast({
            type: TOAST_TYPE.SUCCESS,
            title: t("templates.toasts.create.success.title"),
            message: t("templates.toasts.create.success.message", {
              templateName: templateData.template.name,
              templateType: t(getTemplateTypeI18nName(ETemplateType.PROJECT))?.toLowerCase(),
            }),
          });
          captureSuccess({
            eventName: PROJECT_TEMPLATE_TRACKER_EVENTS.CREATE,
            payload: {
              id: template?.id,
            },
          });
        })
        .catch(() => {
          setToast({
            type: TOAST_TYPE.ERROR,
            title: t("templates.toasts.create.error.title"),
            message: t("templates.toasts.create.error.message"),
          });
          captureError({
            eventName: PROJECT_TEMPLATE_TRACKER_EVENTS.CREATE,
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
