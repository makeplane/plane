import { observer } from "mobx-react";
// plane types
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
  handleFormData: <T extends "description_html" | "name" | "email" | "username">(
    issueKey: T,
    issueValue: string
  ) => void;
  formData: TFormData;
  placeholder?: string | ((isFocused: boolean, value: string) => string);
};

const IssueForm = observer((props: TProps) => {
  const { project, isSubmitting, descriptionEditorRef, anchor, handleFormData, formData, placeholder } = props;
  // store hooks
  const { workspace: workspaceID } = usePublish(anchor);
  const { uploadIssueAsset } = useIssueDetails();

  return (
    <>
      <div className="space-y-5">
        <div className="mb-6">
          <h3 className="text-xl font-medium text-custom-text-200">Create Issue</h3>
          <div className="text-sm text-custom-text-300 flex gap-2">
            <span> This issue will be added to the intake of the project</span>
            <span className="my-auto flex capitalize">
              {project.logo_props && <ProjectLogo logo={project.logo_props} className="text-sm my-auto mr-1" />}
              <span> {project.name}</span>
            </span>
          </div>
        </div>
        <div className="space-y-1 flew-grow w-full">
          <Input
            id="username"
            type="username"
            name="username"
            value={formData.username}
            onChange={(e) => handleFormData("username", e.target.value)}
            placeholder="Your name"
            className="w-full text-md"
            autoFocus
          />
        </div>
        <div className="space-y-1 flew-grow w-full">
          <Input
            id="email"
            type="email"
            name="email"
            value={formData.email}
            onChange={(e) => handleFormData("email", e.target.value)}
            placeholder="Your email"
            className="w-full text-md"
            autoFocus
          />
        </div>

        <Input
          id="name"
          name="name"
          type="text"
          value={formData.name}
          onChange={(e) => handleFormData("name", e.target.value)}
          placeholder="Enter title of the issue"
          className="w-full text-md"
          autoFocus
          required
          pattern=".*\S+.*"
        />
        <RichTextEditor
          id="inbox-modal-editor"
          initialValue="<p></p>"
          ref={descriptionEditorRef}
          dragDropEnabled={false}
          onChange={(_description: object, description_html: string) =>
            handleFormData("description_html", description_html)
          }
          placeholder={placeholder ? placeholder : (isFocused, value) => getDescriptionPlaceholder(isFocused, value)}
          containerClassName="px-0 text-base"
          uploadFile={async (file) => {
            const { asset_id } = await uploadIssueAsset(file, anchor);
            return asset_id;
          }}
          anchor={anchor}
          workspaceId={workspaceID?.toString() ?? ""}
        />

        <Button variant="primary" size="sm" type="submit" loading={isSubmitting} className="mx-auto mr-0">
          {isSubmitting ? "Creating" : "Create issue"}
        </Button>
      </div>
    </>
  );
});

export default IssueForm;
