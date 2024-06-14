"use client";

import { FC, useCallback, useEffect, useState } from "react";
import debounce from "lodash/debounce";
import { observer } from "mobx-react";
import { Controller, useForm } from "react-hook-form";
// types
import { TIssue } from "@plane/types";
// ui
import { Loader } from "@plane/ui";
// components
import { RichTextEditor, RichTextReadOnlyEditor } from "@/components/editor";
import { TIssueOperations } from "@/components/issues/issue-detail";
// helpers
import { getDescriptionPlaceholder } from "@/helpers/issue.helper";
// hooks
import { useWorkspace } from "@/hooks/store";
import { useIssueDescription } from "@/hooks/use-issue-description";

export type IssueDescriptionInputProps = {
  containerClassName?: string;
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  disabled?: boolean;
  issueOperations: TIssueOperations;
  placeholder?: string | ((isFocused: boolean, value: string) => string);
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
    setIsSubmitting,
    placeholder,
    value,
  } = props;

  const { getWorkspaceBySlug } = useWorkspace();
  // computed values
  const workspaceId = getWorkspaceBySlug(workspaceSlug)?.id as string;

  if (!isDescriptionReady)
    return (
      <Loader>
        <Loader.Item height="150px" />
      </Loader>
    );

  return (
    <>
      {!disabled ? (
        <RichTextEditor
          id={issueId}
          value={value}
          workspaceSlug={workspaceSlug}
          workspaceId={workspaceId}
          projectId={projectId}
          dragDropEnabled
          onChange={handleDescriptionChange}
          placeholder={placeholder ? placeholder : (isFocused, value) => getDescriptionPlaceholder(isFocused, value)}
          containerClassName={containerClassName}
        />
      ) : (
        <RichTextReadOnlyEditor
          initialValue={localIssueDescription.description_html ?? ""}
          containerClassName={containerClassName}
        />
      )}
    </>
  );
});
