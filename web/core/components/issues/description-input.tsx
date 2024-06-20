"use client";

import { FC, useRef } from "react";
import { observer } from "mobx-react";

// ui
import { Loader } from "@plane/ui";
// components
import { RichTextEditor, RichTextReadOnlyEditor } from "@/components/editor";
import { TIssueOperations } from "@/components/issues/issue-detail";
// helpers
import { getDescriptionPlaceholder } from "@/helpers/issue.helper";
// hooks
import { useWorkspace } from "@/hooks/store";
import { EditorRefApi } from "@plane/rich-text-editor";

import { useIssueDescription } from "@/hooks/use-issue-description";
import { PageContentLoader } from "../pages";

export type IssueDescriptionInputProps = {
  containerClassName?: string;
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  disabled?: boolean;
  issueOperations: TIssueOperations;
  placeholder?: string | ((isFocused: boolean, value: string) => string);
  isSubmitting: "submitting" | "submitted" | "saved";
  setIsSubmitting: (initialValue: "submitting" | "submitted" | "saved") => void;
  value: Uint8Array;
};

export const IssueDescriptionInput: FC<IssueDescriptionInputProps> = observer((props) => {
  const {
    containerClassName,
    workspaceSlug,
    projectId,
    issueId,
    disabled,
    issueOperations,
    isSubmitting,
    setIsSubmitting,
    placeholder,
    value,
  } = props;

  const { getWorkspaceBySlug } = useWorkspace();
  // computed values
  const workspaceId = getWorkspaceBySlug(workspaceSlug)?.id as string;
  const editorRef = useRef<EditorRefApi>(null);

  const { handleDescriptionChange, isDescriptionReady, issueDescriptionYJS } = useIssueDescription({
    editorRef,
    projectId,
    updateIssueDescription: issueOperations.update,
    issueId,
    setIsSubmitting,
    isSubmitting,
    canUpdateDescription: true,
    workspaceSlug,
  });

  if (!isDescriptionReady || !issueDescriptionYJS)
    return (
      <Loader>
        <Loader.Item height="150px" />
      </Loader>
    );

  return (
    <>
      <RichTextEditor
        id={issueId}
        value={issueDescriptionYJS}
        workspaceSlug={workspaceSlug}
        workspaceId={workspaceId}
        projectId={projectId}
        dragDropEnabled
        onChange={handleDescriptionChange}
        placeholder={placeholder ? placeholder : (isFocused, value) => getDescriptionPlaceholder(isFocused, value)}
        containerClassName={containerClassName}
      />
    </>
  );
});
