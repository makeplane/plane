import { observer } from "mobx-react";
import { Controller, useFormContext } from "react-hook-form";
// plane imports
import { useTranslation } from "@plane/i18n";
import { EFileAssetType, TPublishTemplateFormWithData } from "@plane/types";
import { Input, PillInput } from "@plane/ui";
import { cn, checkEmailValidity, checkURLValidity } from "@plane/utils";
import { UploadAppAttachments } from "@/plane-web/components/marketplace/applications/form/upload-attachments";
import {
  COMMON_ERROR_TEXT_CLASS_NAME,
  COMMON_LABEL_TEXT_CLASS_NAME,
  validateWhitespaceI18n,
} from "@/plane-web/components/templates/settings/common";
// local imports
import { TemplateCategoriesDropdown } from "./template-categories-dropdown";
import { TemplateCoverImageUpload } from "./template-cover-image-upload";

const COMMON_DROPDOWN_CONTAINER_CLASSNAME =
  "bg-custom-background-100 border-[0.5px] border-custom-border-200 rounded-md px-2 py-1 h-8 w-full";

export const TemplateAdditionalDetails = observer(() => {
  // plane hooks
  const { t } = useTranslation();
  // form context
  const {
    control,
    formState: { errors },
  } = useFormContext<TPublishTemplateFormWithData>();

  const renderOptionalTag = () => (
    <>
      <svg viewBox="0 0 2 2" className="h-1 w-1 fill-current">
        <circle cx={1} cy={1} r={1} />
      </svg>
      <span className="italic">{t("common.optional")}</span>
    </>
  );

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Template Category */}
        <div className="space-y-1.5">
          <h3 className={COMMON_LABEL_TEXT_CLASS_NAME}>{t("templates.settings.form.publish.category.label")}</h3>
          <Controller
            control={control}
            name="categories"
            rules={{
              required: t("templates.settings.form.publish.category.validation.required"),
            }}
            render={({ field: { value, onChange } }) => (
              <TemplateCategoriesDropdown
                value={value}
                handleChange={onChange}
                buttonContainerClassName={cn(COMMON_DROPDOWN_CONTAINER_CLASSNAME, {
                  "border-red-500": Boolean(errors.categories),
                })}
              />
            )}
          />
          {errors?.categories && typeof errors.categories.message === "string" && (
            <span className={COMMON_ERROR_TEXT_CLASS_NAME}>{errors.categories.message}</span>
          )}
        </div>
        {/* Company Name */}
        <div className="space-y-1.5">
          <h3 className={COMMON_LABEL_TEXT_CLASS_NAME}>{t("templates.settings.form.publish.company_name.label")}</h3>
          <Controller
            control={control}
            name="company_name"
            rules={{
              validate: (value) => {
                if (!value) return undefined;
                const result = validateWhitespaceI18n(value);
                if (result) {
                  return t(result);
                }
                return undefined;
              },
              required: t("templates.settings.form.publish.company_name.validation.required"),
              maxLength: {
                value: 255,
                message: t("templates.settings.form.publish.company_name.validation.maxLength"),
              },
            }}
            render={({ field: { value, onChange, ref } }) => (
              <Input
                id="company_name"
                name="company_name"
                type="text"
                value={value}
                onChange={onChange}
                ref={ref}
                placeholder={t("templates.settings.form.publish.company_name.placeholder")}
                className="w-full"
                inputSize="sm"
                hasError={Boolean(errors.company_name)}
                autoFocus
              />
            )}
          />
          {errors?.company_name && typeof errors.company_name.message === "string" && (
            <span className={COMMON_ERROR_TEXT_CLASS_NAME}>{errors.company_name.message}</span>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Contact Email */}
        <div className="space-y-1.5">
          <h3 className={cn(COMMON_LABEL_TEXT_CLASS_NAME, "flex items-center gap-1")}>
            {t("templates.settings.form.publish.contact_email.label")}
            {renderOptionalTag()}
          </h3>
          <Controller
            control={control}
            name="contact_email"
            rules={{
              validate: (value) => {
                if (!value) return undefined;
                const result = validateWhitespaceI18n(value);
                if (result) return t(result);
                if (!checkEmailValidity(value)) {
                  return t("templates.settings.form.publish.contact_email.validation.invalid");
                }
                return undefined;
              },
              maxLength: {
                value: 255,
                message: t("templates.settings.form.publish.contact_email.validation.maxLength"),
              },
            }}
            render={({ field: { value, onChange, ref } }) => (
              <Input
                id="contact_email"
                name="contact_email"
                type="text"
                value={value}
                onChange={onChange}
                ref={ref}
                placeholder={t("templates.settings.form.publish.contact_email.placeholder")}
                className="w-full"
                inputSize="sm"
                hasError={Boolean(errors.contact_email)}
                autoFocus
              />
            )}
          />
          {errors?.contact_email && typeof errors.contact_email.message === "string" && (
            <span className={COMMON_ERROR_TEXT_CLASS_NAME}>{errors.contact_email.message}</span>
          )}
        </div>
        {/* Website */}
        <div className="space-y-1.5">
          <h3 className={cn(COMMON_LABEL_TEXT_CLASS_NAME, "flex items-center gap-1")}>
            {t("templates.settings.form.publish.website.label")}
            {renderOptionalTag()}
          </h3>
          <Controller
            control={control}
            name="website"
            rules={{
              validate: (value) => {
                if (!value) return undefined;
                const result = validateWhitespaceI18n(value);
                if (result) return t(result);
                if (!checkURLValidity(value)) {
                  return t("templates.settings.form.publish.website.validation.invalid");
                }
                return undefined;
              },
              maxLength: {
                value: 800,
                message: t("templates.settings.form.publish.website.validation.maxLength"),
              },
            }}
            render={({ field: { value, onChange, ref } }) => (
              <Input
                id="website"
                name="website"
                type="text"
                value={value}
                onChange={onChange}
                ref={ref}
                placeholder={t("templates.settings.form.publish.website.placeholder")}
                className="w-full"
                inputSize="sm"
                hasError={Boolean(errors.website)}
                autoFocus
              />
            )}
          />
          {errors?.website && typeof errors.website.message === "string" && (
            <span className={COMMON_ERROR_TEXT_CLASS_NAME}>{errors.website.message}</span>
          )}
        </div>
      </div>
      {/* Keywords */}
      <div className="space-y-1.5">
        <h3 className={COMMON_LABEL_TEXT_CLASS_NAME}>{t("templates.settings.form.publish.keywords.label")}</h3>
        <Controller
          control={control}
          name="keywords"
          rules={{
            required: t("templates.settings.form.publish.keywords.validation.required"),
          }}
          render={({ field: { value, onChange } }) => (
            <PillInput
              id="keywords"
              name="keywords"
              value={value}
              onChange={onChange}
              placeholder={t("templates.settings.form.publish.keywords.placeholder")}
              helperText={t("templates.settings.form.publish.keywords.helperText")}
            />
          )}
        />
        {errors?.keywords && typeof errors.keywords.message === "string" && (
          <span className={COMMON_ERROR_TEXT_CLASS_NAME}>{errors.keywords.message}</span>
        )}
      </div>
      {/* Privacy Policy URL */}
      <div className="space-y-1.5">
        <h3 className={cn(COMMON_LABEL_TEXT_CLASS_NAME, "flex items-center gap-1")}>
          {t("templates.settings.form.publish.privacy_policy_url.label")}
          {renderOptionalTag()}
        </h3>
        <Controller
          control={control}
          name="privacy_policy_url"
          rules={{
            validate: (value) => {
              if (!value) return undefined;
              const result = validateWhitespaceI18n(value);
              if (result) return t(result);
              if (!checkURLValidity(value)) {
                return t("templates.settings.form.publish.privacy_policy_url.validation.invalid");
              }
              return undefined;
            },
            maxLength: {
              value: 800,
              message: t("templates.settings.form.publish.privacy_policy_url.validation.maxLength"),
            },
          }}
          render={({ field: { value, onChange, ref } }) => (
            <Input
              id="privacy_policy_url"
              name="privacy_policy_url"
              type="text"
              value={value}
              onChange={onChange}
              ref={ref}
              placeholder={t("templates.settings.form.publish.privacy_policy_url.placeholder")}
              className="w-full"
              inputSize="sm"
              hasError={Boolean(errors.privacy_policy_url)}
              autoFocus
            />
          )}
        />
        {errors?.privacy_policy_url && typeof errors.privacy_policy_url.message === "string" && (
          <span className={COMMON_ERROR_TEXT_CLASS_NAME}>{errors.privacy_policy_url.message}</span>
        )}
      </div>
      {/* Terms of Service URL */}
      <div className="space-y-1.5">
        <h3 className={cn(COMMON_LABEL_TEXT_CLASS_NAME, "flex items-center gap-1")}>
          {t("templates.settings.form.publish.terms_of_service_url.label")}
          {renderOptionalTag()}
        </h3>
        <Controller
          control={control}
          name="terms_of_service_url"
          rules={{
            validate: (value) => {
              if (!value) return undefined;
              const result = validateWhitespaceI18n(value);
              if (result) return t(result);
              if (!checkURLValidity(value)) {
                return t("templates.settings.form.publish.terms_of_service_url.validation.invalid");
              }
              return undefined;
            },
            maxLength: {
              value: 800,
              message: t("templates.settings.form.publish.terms_of_service_url.validation.maxLength"),
            },
          }}
          render={({ field: { value, onChange, ref } }) => (
            <Input
              id="terms_of_service_url"
              name="terms_of_service_url"
              type="text"
              value={value}
              onChange={onChange}
              ref={ref}
              placeholder={t("templates.settings.form.publish.terms_of_service_url.placeholder")}
              className="w-full"
              inputSize="sm"
              hasError={Boolean(errors.terms_of_service_url)}
              autoFocus
            />
          )}
        />
        {errors?.terms_of_service_url && typeof errors.terms_of_service_url.message === "string" && (
          <span className={COMMON_ERROR_TEXT_CLASS_NAME}>{errors.terms_of_service_url.message}</span>
        )}
      </div>
      {/* Cover Image */}
      <div className="space-y-1.5">
        <h3 className={COMMON_LABEL_TEXT_CLASS_NAME}>{t("templates.settings.form.publish.cover_image.label")}</h3>
        <Controller
          name="cover_image_url"
          control={control}
          rules={{
            required: t("templates.settings.form.publish.cover_image.validation.required"),
          }}
          render={({ field: { value, onChange } }) => (
            <TemplateCoverImageUpload
              initialValue={value ?? null}
              onImageUpload={onChange}
              hasError={Boolean(errors.cover_image_url)}
            />
          )}
        />
        {errors?.cover_image_url && typeof errors.cover_image_url.message === "string" && (
          <span className={COMMON_ERROR_TEXT_CLASS_NAME}>{errors.cover_image_url.message}</span>
        )}
      </div>
      {/* Attach Screenshots */}
      <div className="space-y-1.5">
        <h3 className={COMMON_LABEL_TEXT_CLASS_NAME}>
          {t("templates.settings.form.publish.attach_screenshots.label")}
        </h3>
        <Controller
          control={control}
          name="attachments_urls"
          rules={{
            validate: (value) => {
              if (value.length === 0) {
                return t("templates.settings.form.publish.attach_screenshots.validation.required");
              }
              return undefined;
            },
          }}
          render={({ field: { value, onChange } }) => (
            <UploadAppAttachments
              initialValue={value}
              entityType={EFileAssetType.TEMPLATE_ATTACHMENT}
              onFilesFinalise={onChange}
              hasError={Boolean(errors.attachments_urls)}
            />
          )}
        />
        {errors?.attachments_urls && typeof errors.attachments_urls.message === "string" && (
          <span className={COMMON_ERROR_TEXT_CLASS_NAME}>{errors.attachments_urls.message}</span>
        )}
      </div>
    </>
  );
});
