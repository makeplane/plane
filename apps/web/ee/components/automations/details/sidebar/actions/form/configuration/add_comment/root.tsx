import { observer } from "mobx-react";
import { Controller, useFormContext } from "react-hook-form";
// plane imports
import { EditorRefApi } from "@plane/editor";
// components
import { LiteTextEditor } from "@/components/editor/lite-text/editor";
// local imports
import { TAutomationActionFormData } from "../../root";

type TProps = {
  automationId: string;
  editorRef: React.RefObject<EditorRefApi>;
  isDisabled?: boolean;
  workspaceId: string;
  workspaceSlug: string;
};

export const AutomationActionAddCommentConfiguration: React.FC<TProps> = observer((props) => {
  const { automationId, editorRef, isDisabled, workspaceId, workspaceSlug } = props;
  // form hooks
  const { control } = useFormContext<TAutomationActionFormData>();

  return (
    <Controller
      control={control}
      name="config.comment_text"
      render={({ field: { onChange, value } }) => (
        <LiteTextEditor
          ref={editorRef}
          workspaceSlug={workspaceSlug}
          workspaceId={workspaceId}
          uploadFile={async () => ""} // TODO: Add upload file function
          id={automationId}
          initialValue={value || "<p></p>"}
          showSubmitButton={false}
          displayConfig={{
            fontSize: "small-font",
          }}
          disabledExtensions={["enter-key"]}
          onChange={(_json, html) => onChange(html)}
          parentClassName="p-2" // TODO: add background if disabled
          editable={!isDisabled}
          variant={isDisabled ? "none" : "full"}
        />
      )}
    />
  );
});
