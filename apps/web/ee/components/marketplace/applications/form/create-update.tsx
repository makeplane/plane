"use client";

import { useState } from "react";
import { observer } from "mobx-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Book, Camera } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { EFileAssetType, TUserApplication } from "@plane/types";
import { Button, Loader, setToast, TOAST_TYPE, ToggleSwitch, Tooltip } from "@plane/ui";
import { getAssetIdFromUrl, getFileURL } from "@plane/utils";
// components
import { SettingsHeading } from "@/components/settings/heading";
// hooks
import { useEditorAsset } from "@/hooks/store/use-editor-asset";
import { useWorkspace } from "@/hooks/store/use-workspace";
// plane web imports
import { AppImageUploadModal } from "@/plane-web/components/common/modal/upload-app-image";
import { GeneratedCredentialsModal } from "@/plane-web/components/marketplace/applications";
import { useApplications } from "@/plane-web/hooks/store";
import { WorkspaceService } from "@/plane-web/services/workspace.service";
// local imports
import { InputField } from "./fields/input-field";
import { RichTextField } from "./fields/rich-text-field";
import { FormSection } from "./form-section";
import { SelectCategories } from "./select-categories";
import { UploadAppAttachments } from "./upload-attachments";

type Props = {
  formData?: Partial<TUserApplication>;
  handleFormSubmit: (data: Partial<TUserApplication>) => Promise<Partial<TUserApplication> | undefined>;
};

const redirectURIsRegex =
  /^(https?:\/\/(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(?:\/\S*)?)(?:\s+(https?:\/\/(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(?:\/\S*)?))*$/gim;
const singleUrlRegex =
  /^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/=]*)$/;
const allowedOriginsRegex =
  /^(?:(?:https?:\/\/)?(?:[\w-]+(?:\.[\w-]+)+))(?:\s+(?:(?:https?:\/\/)?(?:[\w-]+(?:\.[\w-]+)+)))*$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const relativeUrlRegex = /^(\/[a-zA-Z0-9_\-\/]+|https?:\/\/[^\s]+)$/;

const defaultFormData: Partial<TUserApplication> = {
  id: undefined,
  name: "",
  short_description: "",
  description_html: "",
  slug: "",
  company_name: "",
  webhook_url: "",
  redirect_uris: "",
  allowed_origins: "",
  logo_url: "",
  website: "",
  categories: [],
  attachments: [],
  attachments_urls: [],
  is_mentionable: false,
};

export const CreateUpdateApplication: React.FC<Props> = observer((props) => {
  const { formData, handleFormSubmit } = props;

  const {
    watch,
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    setError,
    control,
  } = useForm<Partial<TUserApplication>>({
    defaultValues: formData || defaultFormData,
  });

  // state
  const [isImageModalOpen, setIsImageModalOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isCredentialsModalOpen, setIsCredentialsModalOpen] = useState<boolean>(false);
  const [clientId, setClientId] = useState<string | undefined>(undefined);
  const [clientSecret, setClientSecret] = useState<string | undefined>(undefined);
  // hooks
  const router = useRouter();
  const { t } = useTranslation();
  const { currentWorkspace } = useWorkspace();
  const { uploadEditorAsset } = useEditorAsset();
  const { checkApplicationSlug, categoriesLoader } = useApplications();

  // derived values
  const workspaceSlug = currentWorkspace?.slug;
  const workspaceId = currentWorkspace?.id;

  const handleTextChange = (key: keyof Partial<TUserApplication>, value: string) => {
    if (key === "name" && !watch("id")) {
      setValue("slug", value.toLowerCase().replace(/ /g, "-"), { shouldValidate: true });
    }
    setValue(key, value, { shouldValidate: true });
  };

  const isSlugAvailable = async (slug: string): Promise<boolean> => {
    try {
      await checkApplicationSlug(slug);
      return true;
    } catch (error) {
      console.log("Error in validating application slug:", error);
      setError("slug", { message: t("workspace_settings.settings.applications.slug_already_exists") });
      return false;
    }
  };

  const handleAppFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    handleSubmit(async (data) => {
      try {
        // validate slug
        if (!data.slug) return;
        if (!data.id) {
          if (!isSlugAvailable(data.slug)) {
            return;
          }
        }

        // submit form
        if (data.logo_url) {
          data.logo_asset = getAssetIdFromUrl(data.logo_url);
        }
        if (data.attachments_urls) {
          data.attachments = data.attachments_urls.map((attachment) => getAssetIdFromUrl(attachment));
        }
        const response = await handleFormSubmit(data);

        // set credentials modal open for new application
        if (!data.id && response) {
          setClientId(response.client_id);
          setClientSecret(response.client_secret);
          setIsCredentialsModalOpen(true);
        }
      } catch (error) {
        console.log("Error in submitting application form:", error);
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("common.error"),
          message: t("workspace_settings.settings.applications.failed_to_create_application"),
        });
      } finally {
        setIsSubmitting(false);
      }
    })();
    setIsSubmitting(false);
  };

  const handleRegenerateSuccess = (data: Partial<TUserApplication>) => {
    setClientId(data.client_id);
    setClientSecret(data.client_secret);
    setIsCredentialsModalOpen(true);
  };

  const handleCredentialsModalClose = () => {
    setIsCredentialsModalOpen(false);
    router.push(`/${workspaceSlug}/settings/integrations`);
    setClientId(undefined);
    setClientSecret(undefined);
  };

  if (!workspaceSlug || !workspaceId) return null;

  const workspaceService = new WorkspaceService();

  return (
    <form onSubmit={handleAppFormSubmit}>
      <div className="flex justify-between items-center">
        <SettingsHeading
          title={
            !watch("id")
              ? t("workspace_settings.settings.applications.build_your_own_app")
              : t("workspace_settings.settings.applications.edit_app_details")
          }
        />
        <Button
          type="button"
          className="flex items-center gap-2 hover:bg-custom-background-100"
          variant="link-neutral"
          prependIcon={<Book className="h-4 shrink-0" />}
          onClick={() => {
            window.open("https://developers.plane.so/api-reference/byoa/build-plane-app", "_blank");
          }}
        >
          {t("docs")}
        </Button>
      </div>

      <div className="space-y-5 flew-grow w-full">
        <FormSection title={"Basic information"}>
          <AppImageUploadModal
            isOpen={isImageModalOpen}
            onClose={() => setIsImageModalOpen(false)}
            onSuccess={(url) => setValue("logo_url", getFileURL(url) ?? "")}
            initialValue={formData?.logo_url ? (getFileURL(formData?.logo_url) ?? null) : null}
            handleRemove={async () => setValue("logo_url", undefined)}
            entityType={EFileAssetType.OAUTH_APP_LOGO}
          />

          <div className="flex  gap-4">
            <div className="space-y-2 size-14">
              {watch("logo_url") ? (
                <img
                  loading="lazy"
                  src={getFileURL(watch("logo_url") ?? "")}
                  alt="Logo"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div
                  className={`flex items-center justify-center w-full h-full gap-2 p-5 bg-custom-background-100 rounded border border-custom-border-200`}
                >
                  <Camera className="w-5 h-5 text-custom-text-400" />
                </div>
              )}
            </div>
            <button onClick={() => setIsImageModalOpen(true)} className="text-sm text-custom-primary-100 font-medium">
              {t("workspace_settings.settings.applications.upload_logo")}
            </button>
          </div>

          <InputField
            id="name"
            type="text"
            label={t("workspace_settings.settings.applications.app_name_title")}
            register={register}
            validation={{ required: t("workspace_settings.settings.applications.app_name_error") }}
            placeholder={t("workspace_settings.settings.applications.app_name_title")}
            onChange={(value) => handleTextChange("name", value)}
            error={errors.name}
          />
          <InputField
            id="slug"
            type="text"
            label={t("workspace_settings.settings.applications.app_slug_title")}
            register={register}
            validation={{ required: t("workspace_settings.settings.applications.app_slug_error") }}
            placeholder={t("workspace_settings.settings.applications.app_slug_title")}
            onChange={(value) => handleTextChange("slug", value)}
            error={errors.slug}
          />
          <InputField
            id="company_name"
            type="text"
            label={t("workspace_settings.settings.applications.app_maker.title")}
            description={t("workspace_settings.settings.applications.app_maker.description")}
            placeholder={t("workspace_settings.settings.applications.app_maker.title")}
            register={register}
            validation={{ required: t("workspace_settings.settings.applications.app_maker_error") }}
            onChange={(value) => handleTextChange("company_name", value)}
            error={errors.company_name}
          />
          <InputField
            id="short_description"
            type="text"
            label={t("workspace_settings.settings.applications.app_short_description_title")}
            register={register}
            validation={{
              required: t("workspace_settings.settings.applications.app_short_description_error"),
            }}
            placeholder={t("workspace_settings.settings.applications.app_short_description_title")}
            onChange={(value) => handleTextChange("short_description", value)}
            error={errors.short_description}
          />
          <RichTextField
            id="description_html"
            label={t("workspace_settings.settings.applications.app_description_title.label")}
            control={control}
            workspaceSlug={workspaceSlug}
            workspaceId={workspaceId}
            searchEntityCallback={async (payload) =>
              await workspaceService.searchEntity(workspaceSlug?.toString() ?? "", {
                ...payload,
              })
            }
            validation={{ required: t("workspace_settings.settings.applications.app_description_error") }}
            placeholder={t("workspace_settings.settings.applications.app_description_title.placeholder")}
            error={errors.description_html}
            uploadFile={async (blockId, file) => {
              try {
                const { asset_id } = await uploadEditorAsset({
                  blockId,
                  data: {
                    entity_identifier: workspaceId,
                    entity_type: EFileAssetType.OAUTH_APP_DESCRIPTION,
                  },
                  file,
                  workspaceSlug,
                });
                return asset_id;
              } catch (error) {
                console.log("Error in uploading application asset:", error);
                throw new Error("Asset upload failed. Please try again later.");
              }
            }}
          />

          <InputField
            id="website"
            type="url"
            label={t("workspace_settings.settings.applications.website.title")}
            placeholder={t("workspace_settings.settings.applications.website.placeholder")}
            register={register}
            validation={{
              required: t("workspace_settings.settings.applications.website_error"),
              pattern: {
                value: singleUrlRegex,
                message: t("workspace_settings.settings.applications.invalid_website_error"),
              },
            }}
            onChange={(value) => handleTextChange("website", value)}
            error={errors.website}
          />
          <div className="text-xs text-custom-text-300 flex items-center gap-2">
            <ToggleSwitch
              value={watch("is_mentionable") ?? false}
              onChange={(value) => setValue("is_mentionable", value)}
              size="sm"
            />
            <span>{t("workspace_settings.settings.applications.enable_app_mentions")}</span>
            <Tooltip
              tooltipContent={t("workspace_settings.settings.applications.enable_app_mentions_tooltip")}
              position="top"
            >
              <span className="border border-custom-border-200 rounded-full h-4 w-4 flex items-center justify-center text-custom-text-400 cursor-help">
                ?
              </span>
            </Tooltip>
          </div>
        </FormSection>
        <FormSection title={"Connections"}>
          <InputField
            id="setup_url"
            type="text"
            label={t("workspace_settings.settings.applications.setup_url.label")}
            description={t("workspace_settings.settings.applications.setup_url.description")}
            placeholder={t("workspace_settings.settings.applications.setup_url.placeholder")}
            register={register}
            validation={{ required: t("workspace_settings.settings.applications.setup_url_error") }}
            onChange={(value) => handleTextChange("setup_url", value)}
            error={errors.setup_url}
          />
          <InputField
            id="webhook_url"
            type="url"
            label={t("workspace_settings.settings.applications.webhook_url.label")}
            description={t("workspace_settings.settings.applications.webhook_url.description")}
            placeholder={t("workspace_settings.settings.applications.webhook_url.placeholder")}
            register={register}
            validation={{
              pattern: {
                value: singleUrlRegex,
                message: t("workspace_settings.settings.applications.invalid_webhook_url_error"),
              },
            }}
            onChange={(value) => handleTextChange("webhook_url", value)}
            error={errors.webhook_url}
          />
          <InputField
            id="redirect_uris"
            type="text"
            label={t("workspace_settings.settings.applications.redirect_uris.label")}
            description={t("workspace_settings.settings.applications.redirect_uris.description")}
            placeholder={t("workspace_settings.settings.applications.redirect_uris.placeholder")}
            register={register}
            validation={{
              required: t("workspace_settings.settings.applications.redirect_uris_error"),
              pattern: {
                value: redirectURIsRegex,
                message: t("workspace_settings.settings.applications.invalid_redirect_uris_error"),
              },
            }}
            onChange={(value) => handleTextChange("redirect_uris", value)}
            error={errors.redirect_uris}
          />
        </FormSection>
        <FormSection title={"Categorisation"} collapsible>
          <div tabIndex={5} className="flex flex-col gap-1">
            <div className="text-sm text-custom-text-300">
              {t("workspace_settings.settings.applications.categories_description")}
            </div>
            {categoriesLoader === "init-loader" ? (
              <Loader.Item height="20px" width="140px" />
            ) : (
              <SelectCategories
                value={watch("categories") ?? []}
                handleChange={(value) => setValue("categories", value)}
              />
            )}
          </div>
        </FormSection>
        <FormSection title={"Compliance & Support"} collapsible>
          <InputField
            id="contact_email"
            type="email"
            label={t("workspace_settings.settings.applications.contact_email_title")}
            placeholder={t("workspace_settings.settings.applications.contact_email_title")}
            register={register}
            validation={{
              pattern: {
                value: emailRegex,
                message: t("workspace_settings.settings.applications.invalid_contact_email_error"),
              },
            }}
            onChange={(value) => handleTextChange("contact_email", value)}
            error={errors.contact_email}
          />
          <InputField
            id="privacy_policy_url"
            type="url"
            label={t("workspace_settings.settings.applications.privacy_policy_url_title")}
            placeholder={t("workspace_settings.settings.applications.privacy_policy_url_title")}
            register={register}
            validation={{
              pattern: {
                value: singleUrlRegex,
                message: t("workspace_settings.settings.applications.invalid_privacy_policy_url_error"),
              },
            }}
            onChange={(value) => handleTextChange("privacy_policy_url", value)}
            error={errors.privacy_policy_url}
          />
          <InputField
            id="terms_of_service_url"
            type="url"
            label={t("workspace_settings.settings.applications.terms_of_service_url_title")}
            placeholder={t("workspace_settings.settings.applications.terms_of_service_url_title")}
            register={register}
            validation={{
              pattern: {
                value: singleUrlRegex,
                message: t("workspace_settings.settings.applications.invalid_terms_of_service_url_error"),
              },
            }}
            onChange={(value) => handleTextChange("terms_of_service_url", value)}
            error={errors.terms_of_service_url}
          />
          <InputField
            id="support_url"
            type="url"
            label={t("workspace_settings.settings.applications.support_url_title")}
            placeholder={t("workspace_settings.settings.applications.support_url_title")}
            register={register}
            validation={{
              pattern: {
                value: singleUrlRegex,
                message: t("workspace_settings.settings.applications.invalid_support_url_error"),
              },
            }}
            onChange={(value) => handleTextChange("support_url", value)}
            error={errors.support_url}
          />
        </FormSection>
        <FormSection title={"Additional resources"} collapsible>
          <InputField
            id="video_url"
            type="url"
            label={t("workspace_settings.settings.applications.video_url_title")}
            placeholder={t("workspace_settings.settings.applications.video_url_title")}
            register={register}
            validation={{
              pattern: {
                value: singleUrlRegex,
                message: t("workspace_settings.settings.applications.invalid_video_url_error"),
              },
            }}
            onChange={(value) => handleTextChange("video_url", value)}
            error={errors.video_url}
          />
          <UploadAppAttachments
            initialValue={formData?.attachments_urls ?? []}
            entityType={EFileAssetType.OAUTH_APP_ATTACHMENT}
            onFilesFinalise={(urls) => setValue("attachments_urls", urls)}
          />
        </FormSection>
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <Button type="submit" disabled={isSubmitting} loading={isSubmitting} variant="primary">
          {!watch("id")
            ? t("workspace_settings.settings.applications.create_app")
            : t("workspace_settings.settings.applications.update_app")}
        </Button>
        <Button
          type="button"
          variant="neutral-primary"
          onClick={() => router.push(`/${workspaceSlug}/settings/integrations`)}
        >
          {t("common.cancel")}
        </Button>
      </div>

      <GeneratedCredentialsModal
        handleClose={handleCredentialsModalClose}
        isOpen={isCredentialsModalOpen}
        clientId={clientId ?? ""}
        clientSecret={clientSecret ?? ""}
      />
    </form>
  );
});
