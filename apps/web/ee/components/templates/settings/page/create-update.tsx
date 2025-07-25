import { useCallback, useEffect, useState } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
// plane imports
import { ETemplateLevel, PAGE_TEMPLATE_TRACKER_EVENTS } from "@plane/constants";
import { extractAssetsFromHTMLContent } from "@plane/editor";
import { useTranslation } from "@plane/i18n";
import { ETemplateType, PartialDeep, TPageTemplateForm } from "@plane/types";
import { setToast, TOAST_TYPE } from "@plane/ui";
import {
  getTemplateTypeI18nName,
  getTemplateSettingsBasePath,
  pageTemplateDataToTemplateFormData,
  pageTemplateFormDataToData,
} from "@plane/utils";
// helpers
import { captureError, captureSuccess } from "@/helpers/event-tracker.helper";
// hooks
import { useWorkspace } from "@/hooks/store";
import { useAppRouter } from "@/hooks/use-app-router";
// plane web imports
import { useFlag } from "@/plane-web/hooks/store";
import { usePageTemplates } from "@/plane-web/hooks/store/templates/use-page-templates";
// local imports
import { FileService } from "@/services/file.service";
import { EPageFormOperation, PageTemplateFormRoot, TPageTemplateFormSubmitData } from "./form";
import { PageTemplateLoader } from "./loader";

const fileService = new FileService();

type Props = {
  workspaceSlug: string;
  templateId?: string;
} & (
  | {
      currentLevel: ETemplateLevel.WORKSPACE;
    }
  | {
      currentLevel: ETemplateLevel.PROJECT;
      projectId: string;
    }
);

export const CreateUpdatePageTemplate: React.FC<Props> = observer((props) => {
  const { workspaceSlug, templateId, currentLevel } = props;
  // router
  const router = useAppRouter();
  // states
  const [isApplyingTemplate, setIsApplyingTemplate] = useState(true);
  const [preloadedData, setPreloadedData] = useState<TPageTemplateForm | undefined>(undefined);
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { getWorkspaceBySlug } = useWorkspace();
  const { loader, createPageTemplate, getTemplateById, fetchTemplateById } = usePageTemplates();
  // derived values
  const templateSettingsPagePath = getTemplateSettingsBasePath({
    workspaceSlug,
    ...("projectId" in props
      ? { level: ETemplateLevel.PROJECT, projectId: props.projectId }
      : { level: ETemplateLevel.WORKSPACE }),
  });
  const operationToPerform = templateId ? EPageFormOperation.UPDATE : EPageFormOperation.CREATE;
  const isPageTemplatesEnabled = useFlag(workspaceSlug, "PAGE_TEMPLATES");
  // fetch template details
  useSWR(
    workspaceSlug && templateId && isPageTemplatesEnabled
      ? ["pageTemplates", workspaceSlug, templateId, isPageTemplatesEnabled]
      : null,
    workspaceSlug && templateId && isPageTemplatesEnabled
      ? () =>
          fetchTemplateById({
            workspaceSlug,
            templateId,
            ...("projectId" in props
              ? { level: ETemplateLevel.PROJECT, projectId: props.projectId }
              : { level: ETemplateLevel.WORKSPACE }),
          })
      : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  const resetLocalStates = useCallback(() => {
    setPreloadedData(undefined);
  }, []);

  useEffect(() => {
    const handleTemplateDataPreload = async () => {
      if (!templateId || loader === "init-loader") return;
      const templateDetails = getTemplateById(templateId)?.asJSON;
      if (!templateDetails) return;

      setIsApplyingTemplate(true);

      const formData = pageTemplateDataToTemplateFormData({
        template: templateDetails,
      });

      // Set the preloaded
      setPreloadedData(formData);
      setIsApplyingTemplate(false);
    };

    if (templateId) {
      handleTemplateDataPreload();
    } else {
      setIsApplyingTemplate(false);
      resetLocalStates();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loader, templateId, workspaceSlug, getTemplateById]);

  const getDataForPreload = useCallback((): PartialDeep<TPageTemplateForm> | undefined => {
    if (preloadedData && templateId) {
      return preloadedData;
    }

    if (currentLevel === ETemplateLevel.PROJECT) {
      return {
        page: {
          project: props.projectId,
        },
      };
    }

    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preloadedData, templateId, props]);

  // Handle preloaded invalid IDs change

  const handleFormSubmit = async (data: TPageTemplateFormSubmitData) => {
    const { data: templateData } = data;

    // Get current workspace detail
    const currentWorkspace = getWorkspaceBySlug(workspaceSlug);
    if (!currentWorkspace) return;

    const payload = pageTemplateFormDataToData({
      workspaceId: currentWorkspace.id,
      formData: templateData,
    });

    if (operationToPerform === EPageFormOperation.UPDATE && templateData.template.id) {
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
              eventName: PAGE_TEMPLATE_TRACKER_EVENTS.UPDATE,
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
              eventName: PAGE_TEMPLATE_TRACKER_EVENTS.UPDATE,
              payload: {
                id: template.id,
              },
            });
          });
      }
    } else {
      await createPageTemplate({
        workspaceSlug,
        templateData: payload,
        ...("projectId" in props
          ? { level: ETemplateLevel.PROJECT, projectId: props.projectId }
          : { level: ETemplateLevel.WORKSPACE }),
      })
        .then(async (response) => {
          // Extract image assets from the description and attach them to the page template
          if (response?.id && response?.template_data.description_html) {
            const uploadedAssets = extractAssetsFromHTMLContent(response.template_data.description_html);
            if (uploadedAssets.length > 0) {
              await fileService.updateBulkWorkspaceAssetsUploadStatus(workspaceSlug, response.id, {
                asset_ids: uploadedAssets,
              });
            }
          }
          resetLocalStates();
          router.push(templateSettingsPagePath);
          setToast({
            type: TOAST_TYPE.SUCCESS,
            title: t("templates.toasts.create.success.title"),
            message: t("templates.toasts.create.success.message", {
              templateName: templateData.template.name,
              templateType: t(getTemplateTypeI18nName(ETemplateType.WORK_ITEM))?.toLowerCase(),
            }),
          });
          captureSuccess({
            eventName: PAGE_TEMPLATE_TRACKER_EVENTS.CREATE,
            payload: {
              id: response?.id,
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
            eventName: PAGE_TEMPLATE_TRACKER_EVENTS.CREATE,
          });
        });
    }
  };

  const handleFormCancel = () => {
    resetLocalStates();
    router.back();
  };

  if (loader === "init-loader" || isApplyingTemplate) {
    return <PageTemplateLoader />;
  }

  return (
    <PageTemplateFormRoot
      workspaceSlug={workspaceSlug}
      currentLevel={currentLevel}
      operation={operationToPerform}
      preloadedData={getDataForPreload()}
      handleFormCancel={handleFormCancel}
      handleFormSubmit={handleFormSubmit}
    />
  );
});
