import { observer } from "mobx-react";
// components
import { Controller, useFormContext } from "react-hook-form";
import { LiteTextEditor } from "@/components/editor/lite-text/editor";
import { TAutomationActionFormData } from "../../root";

type TProps = {
  automationId: string;
  isDisabled?: boolean;
  workspaceId: string;
  workspaceSlug: string;
};

export const AutomationActionAddCommentConfiguration: React.FC<TProps> = observer((props) => {
  const { automationId, isDisabled, workspaceId, workspaceSlug } = props;
  // form hooks
  const { control } = useFormContext<TAutomationActionFormData>();

  return (
    <Controller
      control={control}
      name="config.comment_text"
      render={({ field: { onChange, value } }) => (
        <LiteTextEditor
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
          showToolbar={!isDisabled}
        />
      )}
    />
  );
});
