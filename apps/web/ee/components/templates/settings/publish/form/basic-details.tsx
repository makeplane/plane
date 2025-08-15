import { useRef } from "react";
import { observer } from "mobx-react";
import { Controller, useFormContext } from "react-hook-form";
// plane imports
import { EditorRefApi } from "@plane/editor";
import { useTranslation } from "@plane/i18n";
import { TBaseTemplateWithData, TPublishTemplateFormWithData } from "@plane/types";
import { Input, TextArea } from "@plane/ui";
// components
import { getDescriptionPlaceholderI18n, isEditorEmpty } from "@plane/utils";
import { RichTextEditor } from "@/components/editor/rich-text";
// helpers
// plane web imports
import {
  COMMON_ERROR_TEXT_CLASS_NAME,
  COMMON_LABEL_TEXT_CLASS_NAME,
  validateWhitespaceI18n,
} from "@/plane-web/components/templates/settings/common";
import { useEditorMentionSearch } from "@/plane-web/hooks/use-editor-mention-search";
import { IBaseTemplateInstance } from "@/plane-web/store/templates";

type TTemplateBasicDetailsProps<T extends TBaseTemplateWithData> = {
  templateInstance: IBaseTemplateInstance<T>;
};

export const TemplateBasicDetails = observer(
  <T extends TBaseTemplateWithData>(props: TTemplateBasicDetailsProps<T>) => {
    const { templateInstance } = props;
    // refs
    const editorRef = useRef<EditorRefApi>(null);
    // plane hooks
    const { t } = useTranslation();
    // use editor mention search
    const { searchEntity } = useEditorMentionSearch({
      memberIds: [],
    });
    // form context
    const {
      control,
      formState: { errors },
    } = useFormContext<TPublishTemplateFormWithData>();
    // derived values
    const workspaceSlug = templateInstance.getWorkspaceSlugForTemplateInstance;
    const workspaceId = templateInstance.workspace;
    const projectId = templateInstance.project;

    if (!workspaceSlug) return null;
    return (
      <>
        {/* Template Name */}
        <div className="space-y-1.5">
          <h3 className={COMMON_LABEL_TEXT_CLASS_NAME}>{t("templates.settings.form.publish.name.label")}</h3>
          <Controller
            control={control}
            name="name"
            rules={{
              validate: (value) => {
                const result = validateWhitespaceI18n(value);
                if (result) {
                  return t(result);
                }
                return undefined;
              },
              required: t("templates.settings.form.publish.name.validation.required"),
              maxLength: {
                value: 255,
                message: t("templates.settings.form.publish.name.validation.maxLength"),
              },
            }}
            render={({ field: { value, onChange, ref } }) => (
              <Input
                id="name"
                name="name"
                type="text"
                value={value}
                onChange={onChange}
                ref={ref}
                placeholder={t("templates.settings.form.publish.name.placeholder")}
                className="w-full"
                inputSize="sm"
                hasError={Boolean(errors.name)}
                autoFocus
              />
            )}
          />
          {errors?.name && typeof errors.name.message === "string" && (
            <span className={COMMON_ERROR_TEXT_CLASS_NAME}>{errors.name.message}</span>
          )}
        </div>
        {/* Template Short Description */}
        <div className="space-y-1.5">
          <h3 className={COMMON_LABEL_TEXT_CLASS_NAME}>
            {t("templates.settings.form.publish.short_description.label")}
          </h3>
          <Controller
            name="short_description"
            control={control}
            rules={{
              required: t("templates.settings.form.publish.short_description.validation.required"),
            }}
            render={({ field: { value, onChange, ref } }) => (
              <TextArea
                id="short_description"
                name="short_description"
                value={value}
                onChange={onChange}
                ref={ref}
                placeholder={t("templates.settings.form.publish.short_description.placeholder")}
                className="w-full resize-none text-sm bg-custom-background-100 mb-0"
                textAreaSize="sm"
                hasError={Boolean(errors.short_description)}
              />
            )}
          />
          {errors?.short_description && typeof errors.short_description.message === "string" && (
            <span className={COMMON_ERROR_TEXT_CLASS_NAME}>{errors.short_description.message}</span>
          )}
        </div>
        {/* Template Description for publish */}
        <div className="space-y-1.5">
          <h3 className={COMMON_LABEL_TEXT_CLASS_NAME}>{t("templates.settings.form.publish.description.label")}</h3>
          <Controller
            name="description_html"
            control={control}
            rules={{
              validate: (value) => {
                if (isEditorEmpty(value)) {
                  return t("templates.settings.form.publish.description.validation.required");
                }
                return undefined;
              },
              required: t("templates.settings.form.publish.description.validation.required"),
            }}
            render={({ field: { value, onChange } }) => (
              <RichTextEditor
                editable
                id="template-publish-description"
                initialValue={value ?? "<p></p>"}
                workspaceSlug={workspaceSlug.toString()}
                workspaceId={workspaceId}
                projectId={projectId ?? undefined}
                ref={editorRef}
                onChange={(_description_json, description_html) => onChange(description_html)}
                searchMentionCallback={searchEntity}
                placeholder={(isFocused, value) =>
                  isEditorEmpty(value)
                    ? t("templates.settings.form.publish.description.placeholder")
                    : t(`${getDescriptionPlaceholderI18n(isFocused, value)}`)
                }
                containerClassName="min-h-[240px] md:min-h-[120px] border-[0.5px] py-2 border-custom-border-200 rounded-md"
                disabledExtensions={["image", "issue-embed", "attachments"]}
                uploadFile={() => Promise.resolve("")}
              />
            )}
          />
          {errors?.description_html && typeof errors.description_html.message === "string" && (
            <span className={COMMON_ERROR_TEXT_CLASS_NAME}>{errors.description_html.message}</span>
          )}
        </div>
      </>
    );
  }
);
