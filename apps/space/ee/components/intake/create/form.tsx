import { observer } from "mobx-react";
// plane types
import { Controller, useFormContext } from "react-hook-form";
import { useTranslation } from "@plane/i18n";
import { IProject } from "@plane/types";
// plane ui
import { Button, Input } from "@plane/ui";
import { getFileURL } from "@plane/utils";
// components
import { ProjectLogo } from "@/components/common/project-logo";
import { RichTextEditor } from "@/components/editor/rich-text-editor";
// hooks
import { usePublish } from "@/hooks/store/publish";
import { useIssueDetails } from "@/hooks/store/use-issue-details";
// local types
import { TFormData } from "./create-issue-modal";

type TProps = {
  project: Partial<IProject>;
  isSubmitting: boolean;
  descriptionEditorRef: React.RefObject<any>;
  anchor: string;
  placeholder?: string | ((isFocused: boolean, value: string) => string);
};
const DEFAULT_COVER_IMAGE =
  "https://images.unsplash.com/photo-1672243775941-10d763d9adef?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80";

const IssueForm = observer((props: TProps) => {
  const { project, isSubmitting, descriptionEditorRef, anchor } = props;
  // store hooks
  const { workspace: workspaceID, project_details } = usePublish(anchor);
  const { uploadIssueAsset } = useIssueDetails();
  const { t } = useTranslation();
  const {
    formState: { errors },
    control,
  } = useFormContext<TFormData>();

  return (
    <>
      <div className="space-y-5">
        <div className="relative h-[133px] w-full">
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent rounded-md" />
          <img
            src={getFileURL(project_details?.cover_image ?? DEFAULT_COVER_IMAGE)}
            alt="Project cover image"
            className="h-[133px] w-full rounded-md object-cover"
          />
          <div className="z-5 absolute bottom-2 flex w-full items-end justify-between gap-3 px-4">
            <div className="flex flex-grow gap-3 truncate items-center">
              {project.logo_props && <ProjectLogo logo={project.logo_props} className="my-auto text-[24px]" />}
              <div className="flex flex-col gap-1 truncate text-white items-center">
                <span className="truncate text-lg font-semibold">{project_details?.name}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="mb-6">
          <h3 className="text-xl font-medium text-custom-text-200">{t("intake_forms.create.title")}</h3>
          <div className="text-sm text-custom-text-300 flex gap-2 mt-1">
            <span>{t("intake_forms.create.sub-title")}</span>
          </div>
        </div>

        <div className="md:col-span-3">
          <div className="text-sm text-custom-text-300 mb-1 font-medium">
            {t("intake_forms.create.name")}
            <span className="ml-0.5 text-red-500">*</span>
          </div>
          <Controller
            control={control}
            name="username"
            rules={{
              required: t("intake_forms.create.errors.name"),
              maxLength: {
                value: 255,
                message: t("intake_forms.create.errors.name_max_length"),
              },
            }}
            render={({ field: { value, onChange } }) => (
              <Input
                id="username"
                name="username"
                type="text"
                value={value}
                onChange={onChange}
                hasError={Boolean(errors.username)}
                placeholder="Jason Ray"
                className="w-full focus:border-blue-400 text-base border-custom-border-300"
              />
            )}
          />
          <span className="text-xs text-red-500 capitalize">{errors?.username?.message}</span>
        </div>
        <div className="md:col-span-3">
          <div className="text-sm text-custom-text-300 mb-1 font-medium">
            {t("intake_forms.create.email")}
            <span className="ml-0.5 text-red-500">*</span>
          </div>
          <Controller
            control={control}
            name="email"
            rules={{
              required: t("intake_forms.create.errors.email"),
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: t("intake_forms.create.errors.email_invalid"),
              },
            }}
            render={({ field: { value, onChange } }) => (
              <Input
                id="email"
                name="email"
                type="text"
                value={value}
                onChange={onChange}
                hasError={Boolean(errors.email)}
                placeholder="jason.ray@company.com"
                className="w-full focus:border-blue-400 text-base border-custom-border-300"
              />
            )}
          />
          <span className="text-xs text-red-500 capitalize">{errors?.email?.message}</span>
        </div>

        <div className="md:col-span-3">
          <div className="text-sm text-custom-text-300 mb-1 font-medium">
            {t("intake_forms.create.about")}
            <span className="ml-0.5 text-red-500">*</span>
          </div>
          <Controller
            control={control}
            name="name"
            rules={{
              required: t("intake_forms.create.errors.title"),
              maxLength: {
                value: 255,
                message: t("intake_forms.create.errors.title_max_length"),
              },
            }}
            render={({ field: { value, onChange } }) => (
              <Input
                id="name"
                name="name"
                type="text"
                value={value}
                onChange={onChange}
                hasError={Boolean(errors.name)}
                placeholder="e.g., Improve vertical scroll, Approve laptop purchase"
                className="w-full focus:border-blue-400 text-base border-custom-border-300"
              />
            )}
          />
          <span className="text-xs text-red-500 capitalize">{errors?.name?.message}</span>
        </div>
        <div className="md:col-span-3">
          <div className="text-sm text-custom-text-300 mb-1 font-medium">{t("intake_forms.create.description")}</div>
          <Controller
            name="description_html"
            control={control}
            render={({ field: { onChange } }) => (
              <RichTextEditor
                editable
                id="inbox-modal-editor"
                initialValue="<p></p>"
                ref={descriptionEditorRef}
                dragDropEnabled={false}
                onChange={(_description: object, description_html: string) => onChange(description_html)}
                placeholder={() => ""}
                containerClassName="px-0 text-base"
                uploadFile={async (blockId, file) => {
                  const { asset_id } = await uploadIssueAsset(file, anchor);
                  return asset_id;
                }}
                anchor={anchor}
                workspaceId={workspaceID?.toString() ?? ""}
              />
            )}
          />
        </div>

        <Button variant="primary" size="sm" type="submit" loading={isSubmitting} className="mx-auto ml-0">
          {isSubmitting ? t("intake_forms.create.loading") : t("intake_forms.create.create_work_item")}
        </Button>
      </div>
    </>
  );
});

export default IssueForm;
