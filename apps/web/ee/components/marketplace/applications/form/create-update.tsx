"use client";

import { useState } from "react";
import { observer } from "mobx-react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { Camera } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { EFileAssetType, TUserApplication } from "@plane/types";
import { Button, Input, Loader, setToast, TOAST_TYPE } from "@plane/ui";
import { getAssetIdFromUrl, getFileURL } from "@plane/utils";
// components
import { RichTextEditor } from "@/components/editor/rich-text";
import { SettingsHeading } from "@/components/settings/heading";
// hooks
import { useWorkspace } from "@/hooks/store/use-workspace"
import { useEditorAsset } from "@/hooks/store/use-editor-asset";
// plane web imports
import { AppImageUploadModal } from "@/plane-web/components/common/modal";
import { GeneratedCredentialsModal, RegenerateClientSecret } from "@/plane-web/components/marketplace/applications";
import { useApplications } from "@/plane-web/hooks/store";
import { WorkspaceService } from "@/plane-web/services/workspace.service";
// local imports
import { CustomCheckbox } from "../ui/checkbox";
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
    router.push(`/${workspaceSlug}/settings/applications`);
    setClientId(undefined);
    setClientSecret(undefined);
  };

  if (!workspaceSlug || !workspaceId) return null;

  const workspaceService = new WorkspaceService();

  return (
    <form onSubmit={handleAppFormSubmit}>
      <div className="space-y-4">
        <SettingsHeading title={!watch("id") ? "Let's get all the necessary info" : "Edit your app's details"} />
        <AppImageUploadModal
          isOpen={isImageModalOpen}
          onClose={() => setIsImageModalOpen(false)}
          onSuccess={(url) => setValue("logo_url", getFileURL(url) ?? "")}
          initialValue={formData?.logo_url ? (getFileURL(formData?.logo_url) ?? null) : null}
          handleRemove={async () => setValue("logo_url", undefined)}
          entityType={EFileAssetType.OAUTH_APP_LOGO}
        />
        <div className="space-y-5 flew-grow w-full">
          <div className="space-y-2">
            {watch("logo_url") ? (
              <img
                loading="lazy"
                src={getFileURL(watch("logo_url") ?? "")}
                alt="Logo"
                className="w-20 h-20 object-cover"
              />
            ) : (
              <div
                className={`flex items-center justify-center w-20 gap-2 p-5 bg-custom-background-100 rounded border border-custom-border-200`}
              >
                <Camera className="w-5 h-5 text-custom-text-400" />
              </div>
            )}
            <button onClick={() => setIsImageModalOpen(true)} className="text-sm text-custom-primary-100 font-medium">
              {t("workspace_settings.settings.applications.upload_logo")}
            </button>
          </div>
          <div className="flex flex-col gap-1">
            <Input
              id="name"
              type="text"
              placeholder={t("workspace_settings.settings.applications.app_name_title")}
              className="w-full resize-none text-sm"
              hasError={Boolean(errors.name)}
              tabIndex={1}
              {...register("name", { required: t("workspace_settings.settings.applications.app_name_error") })}
              onChange={(e) => handleTextChange("name", e.target.value)}
            />
            {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}
          </div>
          <div className="flex flex-col gap-1">
            <Input
              id="short_description"
              type="text"
              placeholder={t("workspace_settings.settings.applications.app_short_description_title")}
              className="w-full resize-none text-sm"
              hasError={Boolean(errors.short_description)}
              tabIndex={2}
              {...register("short_description", {
                required: t("workspace_settings.settings.applications.app_short_description_error"),
              })}
              onChange={(e) => handleTextChange("short_description", e.target.value)}
            />
            {errors.short_description && <p className="text-red-500 text-xs">{errors.short_description.message}</p>}
          </div>

          <div className="flex flex-col gap-1">
            <Controller
              name="description_html"
              control={control}
              rules={{ required: t("workspace_settings.settings.applications.app_description_error") }}
              render={({ field: { onChange } }) => (
                <RichTextEditor
                  editable
                  id={workspaceSlug.toString()}
                  tabIndex={3}
                  initialValue={!watch("description_html") ? "<p></p>" : watch("description_html") || "<p></p>"}
                  workspaceSlug={workspaceSlug}
                  workspaceId={workspaceId}
                  searchMentionCallback={async (payload) =>
                    await workspaceService.searchEntity(workspaceSlug?.toString() ?? "", {
                      ...payload,
                    })
                  }
                  dragDropEnabled={false}
                  onChange={(_description: object, description_html: string) => {
                    onChange(description_html);
                  }}
                  placeholder={t("workspace_settings.settings.applications.app_description_title")}
                  editorClassName="text-xs"
                  containerClassName="resize-none min-h-24 text-xs border-[0.5px] border-custom-border-200 rounded-md px-3 py-2"
                  displayConfig={{ fontSize: "small-font" }}
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
                  disabledExtensions={["attachments"]}
                />
              )}
            />
            {errors.description_html && <p className="text-red-500 text-xs">{errors.description_html.message}</p>}
          </div>
          <div className="flex flex-col gap-1">
            <div className="text-sm text-custom-text-300">
              {t("workspace_settings.settings.applications.app_slug_title")}
            </div>
            <Input
              id="slug"
              type="text"
              disabled={!!watch("id")}
              className="w-full resize-none text-sm"
              hasError={Boolean(errors.slug)}
              tabIndex={4}
              {...register("slug", { required: t("workspace_settings.settings.applications.app_slug_error") })}
              onChange={(e) => handleTextChange("slug", e.target.value)}
            />
            {errors.slug && <p className="text-red-500 text-xs">{errors.slug.message}</p>}
          </div>
          <CustomCheckbox
            label="Is mentionable"
            checked={watch("is_mentionable") ?? false}
            onChange={(value) => setValue("is_mentionable", value)}
          />
          <div className="flex flex-col gap-1">
            <div className="text-sm text-custom-text-300">
              {t("workspace_settings.settings.applications.website_title")}
            </div>
            <Input
              id="website"
              type="text"
              className="w-full resize-none text-sm"
              hasError={Boolean(errors.website)}
              tabIndex={4}
              {...register("website", {
                pattern: {
                  value: singleUrlRegex,
                  message: t("workspace_settings.settings.applications.invalid_website_error"),
                },
              })}
              onChange={(e) => handleTextChange("website", e.target.value)}
            />
            {errors.website && <p className="text-red-500 text-xs">{errors.website.message}</p>}
          </div>
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
          <div className="flex flex-col gap-1">
            <div className="text-sm text-custom-text-300">
              {t("workspace_settings.settings.applications.app_maker_title")}
            </div>
            <Input
              id="company_name"
              type="text"
              placeholder={t("workspace_settings.settings.applications.app_maker_title")}
              className="w-full resize-none text-sm"
              hasError={Boolean(errors.company_name)}
              tabIndex={6}
              {...register("company_name", { required: t("workspace_settings.settings.applications.app_maker_error") })}
              onChange={(e) => handleTextChange("company_name", e.target.value)}
            />
            {errors.company_name && <p className="text-red-500 text-xs">{errors.company_name.message}</p>}
          </div>
          <div className="flex flex-col gap-1">
            <div className="text-sm text-custom-text-300">
              {t("workspace_settings.settings.applications.webhook_url_title")}
            </div>
            <Input
              id="webhook_url"
              type="text"
              className="w-full resize-none text-sm"
              hasError={Boolean(errors.webhook_url)}
              tabIndex={7}
              {...register("webhook_url", {
                pattern: {
                  value: singleUrlRegex,
                  message: t("workspace_settings.settings.applications.invalid_webhook_url_error"),
                },
              })}
              onChange={(e) => handleTextChange("webhook_url", e.target.value)}
            />
            {errors.webhook_url && <p className="text-red-500 text-xs">{errors.webhook_url.message}</p>}
          </div>
          <div className="flex flex-col gap-1">
            <div className="text-sm text-custom-text-300">
              {t("workspace_settings.settings.applications.redirect_uris_title")}
            </div>
            <Input
              id="redirect_uris"
              type="text"
              placeholder={t("workspace_settings.settings.applications.redirect_uris_description")}
              className="w-full resize-none text-sm"
              hasError={Boolean(errors.redirect_uris)}
              tabIndex={8}
              {...register("redirect_uris", {
                required: t("workspace_settings.settings.applications.redirect_uris_error"),
                pattern: {
                  value: redirectURIsRegex,
                  message: t("workspace_settings.settings.applications.invalid_redirect_uris_error"),
                },
              })}
              onChange={(e) => handleTextChange("redirect_uris", e.target.value)}
            />
            {errors.redirect_uris && <p className="text-red-500 text-xs">{errors.redirect_uris.message}</p>}
          </div>
          <div className="flex flex-col gap-1">
            <div className="text-sm text-custom-text-300">
              {t("workspace_settings.settings.applications.authorized_javascript_origins_title")}
            </div>
            <Input
              id="allowed_origins"
              type="text"
              placeholder={t("workspace_settings.settings.applications.authorized_javascript_origins_description")}
              className="w-full resize-none text-sm"
              hasError={Boolean(errors.allowed_origins)}
              tabIndex={9}
              {...register("allowed_origins", {
                pattern: {
                  value: allowedOriginsRegex,
                  message: t("workspace_settings.settings.applications.invalid_authorized_javascript_origins_error"),
                },
              })}
              onChange={(e) => handleTextChange("allowed_origins", e.target.value)}
            />
            {errors.allowed_origins && <p className="text-red-500 text-xs">{errors.allowed_origins.message}</p>}
          </div>
          <div className="flex flex-col gap-1">
            <div className="text-sm text-custom-text-300">
              {t("workspace_settings.settings.applications.contact_email_title")}
            </div>
            <Input
              id="contact_email"
              type="text"
              className="w-full resize-none text-sm"
              hasError={Boolean(errors.contact_email)}
              tabIndex={10}
              {...register("contact_email", {
                pattern: {
                  value: emailRegex,
                  message: t("workspace_settings.settings.applications.invalid_contact_email_error"),
                },
              })}
              onChange={(e) => handleTextChange("contact_email", e.target.value)}
            />
            {errors.contact_email && <p className="text-red-500 text-xs">{errors.contact_email.message}</p>}
          </div>
          <div className="flex flex-col gap-1">
            <div className="text-sm text-custom-text-300">
              {t("workspace_settings.settings.applications.privacy_policy_url_title")}
            </div>
            <Input
              id="privacy_policy_url"
              type="text"
              className="w-full resize-none text-sm"
              hasError={Boolean(errors.privacy_policy_url)}
              tabIndex={11}
              {...register("privacy_policy_url", {
                pattern: {
                  value: singleUrlRegex,
                  message: t("workspace_settings.settings.applications.invalid_privacy_policy_url_error"),
                },
              })}
              onChange={(e) => handleTextChange("privacy_policy_url", e.target.value)}
            />
            {errors.privacy_policy_url && <p className="text-red-500 text-xs">{errors.privacy_policy_url.message}</p>}
          </div>
          <div className="flex flex-col gap-1">
            <div className="text-sm text-custom-text-300">
              {t("workspace_settings.settings.applications.terms_of_service_url_title")}
            </div>
            <Input
              id="terms_of_service_url"
              type="text"
              className="w-full resize-none text-sm"
              hasError={Boolean(errors.terms_of_service_url)}
              tabIndex={12}
              {...register("terms_of_service_url", {
                pattern: {
                  value: singleUrlRegex,
                  message: t("workspace_settings.settings.applications.invalid_terms_of_service_url_error"),
                },
              })}
              onChange={(e) => handleTextChange("terms_of_service_url", e.target.value)}
            />
            {errors.terms_of_service_url && (
              <p className="text-red-500 text-xs">{errors.terms_of_service_url.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <div className="text-sm text-custom-text-300">
              {t("workspace_settings.settings.applications.support_url_title")}
            </div>
            <Input
              id="support_url"
              type="text"
              className="w-full resize-none text-sm"
              hasError={Boolean(errors.support_url)}
              tabIndex={13}
              {...register("support_url", {
                pattern: {
                  value: singleUrlRegex,
                  message: t("workspace_settings.settings.applications.invalid_support_url_error"),
                },
              })}
              onChange={(e) => handleTextChange("support_url", e.target.value)}
            />
            {errors.support_url && <p className="text-red-500 text-xs">{errors.support_url.message}</p>}
          </div>

          <div className="flex flex-col gap-1">
            <div className="text-sm text-custom-text-300">
              {t("workspace_settings.settings.applications.video_url_title")}
            </div>
            <Input
              id="video_url"
              type="text"
              className="w-full resize-none text-sm"
              hasError={Boolean(errors.video_url)}
              tabIndex={14}
              {...register("video_url", {
                pattern: {
                  value: singleUrlRegex,
                  message: t("workspace_settings.settings.applications.invalid_video_url_error"),
                },
              })}
              onChange={(e) => handleTextChange("video_url", e.target.value)}
            />
            {errors.video_url && <p className="text-red-500 text-xs">{errors.video_url.message}</p>}
          </div>
          <div className="flex flex-col gap-1">
            <div className="text-sm text-custom-text-300">
              {t("workspace_settings.settings.applications.setup_url_title")}
            </div>
            <Input
              id="setup_url"
              type="text"
              className="w-full resize-none text-sm"
              hasError={Boolean(errors.setup_url)}
              tabIndex={15}
              {...register("setup_url", {
                pattern: {
                  value: relativeUrlRegex,
                  message: t("workspace_settings.settings.applications.invalid_setup_url_error"),
                },
              })}
              onChange={(e) => handleTextChange("setup_url", e.target.value)}
            />
            {errors.setup_url && <p className="text-red-500 text-xs">{errors.setup_url.message}</p>}
          </div>
          <div className="flex flex-col gap-1">
            <div className="text-sm text-custom-text-300">
              {t("workspace_settings.settings.applications.configuration_url_title")}
            </div>
            <Input
              id="configuration_url"
              type="text"
              className="w-full resize-none text-sm"
              hasError={Boolean(errors.configuration_url)}
              tabIndex={16}
              {...register("configuration_url", {
                pattern: {
                  value: relativeUrlRegex,
                  message: t("workspace_settings.settings.applications.invalid_configuration_url_error"),
                },
              })}
              onChange={(e) => handleTextChange("configuration_url", e.target.value)}
            />
            {errors.configuration_url && <p className="text-red-500 text-xs">{errors.configuration_url.message}</p>}
          </div>
          <UploadAppAttachments
            initialValue={formData?.attachments_urls ?? []}
            entityType={EFileAssetType.OAUTH_APP_ATTACHMENT}
            onFilesFinalise={(urls) => setValue("attachments_urls", urls)}
          />
          {watch("id") && formData && (
            <RegenerateClientSecret application={formData} handleRegenerateSuccess={handleRegenerateSuccess} />
          )}
        </div>
        <div className="flex justify-start gap-2 mt-10">
          <Button
            type="button"
            variant="outline-primary"
            onClick={() => router.push(`/${workspaceSlug}/settings/applications`)}
          >
            {t("common.cancel")}
          </Button>
          <Button type="submit" disabled={isSubmitting} loading={isSubmitting} variant="primary">
            {!watch("id")
              ? t("workspace_settings.settings.applications.create_app")
              : t("workspace_settings.settings.applications.update_app")}
          </Button>
        </div>
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
