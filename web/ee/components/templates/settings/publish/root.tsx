import { useCallback } from "react";
import { observer } from "mobx-react";
// plane imports
import { ETemplateLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { TBaseTemplateWithData, TPublishTemplateFormWithData } from "@plane/types";
import { setToast, TOAST_TYPE } from "@plane/ui";
import { ensureUrlHasProtocol, getTemplateSettingsBasePath, getTemplateTypeI18nName } from "@plane/utils";
// helpers
import { getAssetIdFromUrl } from "@/helpers/file.helper";
// hooks
import { useAppRouter } from "@/hooks/use-app-router";
// plane web imports
import { IBaseTemplateInstance } from "@/plane-web/store/templates";
// local imports
import { PublishTemplateFormRoot, PublishTemplateLoader } from "./form";

type TPublishTemplateProps<T extends TBaseTemplateWithData> = {
  workspaceSlug: string;
  templateInstance: IBaseTemplateInstance<T> | undefined;
  isInitializing: boolean;
};

export const PublishTemplate = observer(<T extends TBaseTemplateWithData>(props: TPublishTemplateProps<T>) => {
  const { workspaceSlug, templateInstance, isInitializing } = props;
  // router
  const router = useAppRouter();
  // plane hooks
  const { t } = useTranslation();
  // derived values
  const templateSettingsPagePath = getTemplateSettingsBasePath({
    workspaceSlug,
    // Only workspace level templates can be published
    level: ETemplateLevel.WORKSPACE,
  });

  const handleFormSubmit = useCallback(
    async (data: TPublishTemplateFormWithData) => {
      if (!templateInstance) return;
      try {
        // Process URLs and attachments in a more structured way
        const processedData = {
          ...data,
          // Process attachments if they exist
          attachments: data.attachments_urls?.map((attachment) => getAssetIdFromUrl(attachment)) || [],
          // Ensure URLs have http protocol
          privacy_policy_url: data.privacy_policy_url ? ensureUrlHasProtocol(data.privacy_policy_url) : undefined,
          terms_of_service_url: data.terms_of_service_url ? ensureUrlHasProtocol(data.terms_of_service_url) : undefined,
        };
        // Update template with processed data
        await templateInstance.update(processedData as T); // This is done just to satisfy the typescript (publish data is always partial of the base template)
        router.push(templateSettingsPagePath);
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: t("templates.toasts.update.success.title"),
          message: t("templates.toasts.update.success.message", {
            templateName: data.name,
            templateType: t(getTemplateTypeI18nName(templateInstance.template_type))?.toLowerCase(),
          }),
        });
      } catch (error) {
        console.error("Template update failed:", error);
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("templates.toasts.update.error.title"),
          message: t("templates.toasts.update.error.message"),
        });
      }
    },
    [templateInstance, router, templateSettingsPagePath, t]
  );

  const handleFormCancel = () => {
    router.back();
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="flex items-center justify-between border-b border-custom-border-200 pb-3 tracking-tight w-full">
        <h3 className="text-lg font-semibold">{t("templates.settings.form.publish.title")}</h3>
      </div>
      {isInitializing && <PublishTemplateLoader />}
      {!isInitializing && templateInstance && (
        <PublishTemplateFormRoot
          templateInstance={templateInstance}
          handleFormCancel={handleFormCancel}
          handleFormSubmit={handleFormSubmit}
        />
      )}
    </div>
  );
});
