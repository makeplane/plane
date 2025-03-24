import { observer } from "mobx-react";
// plane types
import { Controller, useFormContext } from "react-hook-form";
import { IProject } from "@plane/types";
// plane ui
import { Button, Input } from "@plane/ui";
// components
import { ProjectLogo } from "@/components/common";
import { RichTextEditor } from "@/components/editor/rich-text-editor";
// hooks
import { useIssueDetails, usePublish } from "@/hooks/store";
// helpers
import { getDescriptionPlaceholder } from "@/plane-web/helpers/issue.helper";
// local types
import { TFormData } from "./create-issue-modal";

type TProps = {
  project: Partial<IProject>;
  isSubmitting: boolean;
  descriptionEditorRef: React.RefObject<any>;
  anchor: string;

  placeholder?: string | ((isFocused: boolean, value: string) => string);
};

const IssueForm = observer((props: TProps) => {
  const { project, isSubmitting, descriptionEditorRef, anchor, placeholder } = props;
  // store hooks
  const { workspace: workspaceID } = usePublish(anchor);
  const { uploadIssueAsset } = useIssueDetails();
  const {
    formState: { errors },
    control,
  } = useFormContext<TFormData>();

  return (
    <>
      <div className="space-y-5">
        <div className="mb-6">
          <h3 className="text-xl font-medium text-custom-text-200">Create Work item</h3>
          <div className="text-sm text-custom-text-300 flex gap-2">
            <span> This work item will be added to the intake of the project</span>
            <span className="my-auto flex capitalize">
              {project.logo_props && <ProjectLogo logo={project.logo_props} className="text-sm my-auto mr-1" />}
              <span> {project.name}</span>
            </span>
          </div>
        </div>

        <div className="md:col-span-3">
          <Controller
            control={control}
            name="username"
            rules={{
              required: "Name is required",
              maxLength: {
                value: 255,
                message: "Name should be less than 255 characters",
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
                placeholder="Your name"
                className="w-full focus:border-blue-400 text-base"
              />
            )}
          />
          <span className="text-xs text-red-500 capitalize">{errors?.username?.message}</span>
        </div>
        <div className="md:col-span-3">
          <Controller
            control={control}
            name="email"
            rules={{
              required: "Email is required",
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: "invalid email address",
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
                placeholder="Your email"
                className="w-full focus:border-blue-400 text-base"
              />
            )}
          />
          <span className="text-xs text-red-500 capitalize">{errors?.email?.message}</span>
        </div>

        <div className="md:col-span-3">
          <Controller
            control={control}
            name="name"
            rules={{
              required: "Title is required",
              maxLength: {
                value: 255,
                message: "Title should be less than 255 characters",
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
                placeholder="Enter title of the work item"
                className="w-full focus:border-blue-400 text-base"
              />
            )}
          />
          <span className="text-xs text-red-500 capitalize">{errors?.name?.message}</span>
        </div>
        <Controller
          name="description_html"
          control={control}
          render={({ field: { onChange } }) => (
            <RichTextEditor
              id="inbox-modal-editor"
              initialValue="<p></p>"
              ref={descriptionEditorRef}
              dragDropEnabled={false}
              onChange={(_description: object, description_html: string) => onChange(description_html)}
              placeholder={
                placeholder ? placeholder : (isFocused, value) => getDescriptionPlaceholder(isFocused, value)
              }
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

        <Button variant="primary" size="sm" type="submit" loading={isSubmitting} className="mx-auto mr-0">
          {isSubmitting ? "Creating" : "Create work item"}
        </Button>
      </div>
    </>
  );
});

export default IssueForm;
