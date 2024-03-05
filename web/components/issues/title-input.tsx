import { FC, useState, useEffect, useCallback } from "react";
import { observer } from "mobx-react";
// components
import { TextArea } from "@plane/ui";
// types
import { TIssueOperations } from "./issue-detail";
// hooks
import useDebounce from "hooks/use-debounce";

export type IssueTitleInputProps = {
  disabled?: boolean;
  value: string | undefined | null;
  workspaceSlug: string;
  isSubmitting: "submitting" | "submitted" | "saved";
  setIsSubmitting: (value: "submitting" | "submitted" | "saved") => void;
  issueOperations: TIssueOperations;
  projectId: string;
  issueId: string;
};

export const IssueTitleInput: FC<IssueTitleInputProps> = observer((props) => {
  const { disabled, value, workspaceSlug, isSubmitting, setIsSubmitting, issueId, issueOperations, projectId } = props;
  // states
  const [title, setTitle] = useState("");
  // hooks
  const debouncedValue = useDebounce(title, 1500);

  useEffect(() => {
    if (value) setTitle(value);
  }, [value]);

  useEffect(() => {
    const textarea = document.querySelector("#title-input");
    if (debouncedValue && debouncedValue !== value) {
      issueOperations.update(workspaceSlug, projectId, issueId, { name: debouncedValue }, false).finally(() => {
        setIsSubmitting("saved");
        if (textarea && !textarea.matches(":focus")) {
          const trimmedTitle = debouncedValue.trim();
          if (trimmedTitle !== title) setTitle(trimmedTitle);
        }
      });
    }
    // DO NOT Add more dependencies here. It will cause multiple requests to be sent.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedValue]);

  useEffect(() => {
    const handleBlur = () => {
      const trimmedTitle = title.trim();
      if (trimmedTitle !== title && isSubmitting !== "submitting") {
        setTitle(trimmedTitle);
        setIsSubmitting("submitting");
      }
    };

    const textarea = document.querySelector("#title-input"); // You might need to change this selector according to your TextArea component
    if (textarea) {
      textarea.addEventListener("blur", handleBlur);
    }

    return () => {
      if (textarea) {
        textarea.removeEventListener("blur", handleBlur);
      }
    };
  }, [title, isSubmitting, setIsSubmitting]);

  const handleTitleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setIsSubmitting("submitting");
      setTitle(e.target.value);
    },
    [setIsSubmitting]
  );

  if (disabled) return <div className="text-2xl font-medium">{title}</div>;

  return (
    <div className="relative">
      <TextArea
        id="title-input"
        className={`min-h-min block w-full resize-none overflow-hidden rounded border-none bg-transparent px-3 py-2 text-2xl font-medium outline-none ring-0 focus:ring-1 focus:ring-custom-primary ${
          title?.length === 0 ? "!ring-red-400" : ""
        }`}
        disabled={disabled}
        value={title}
        onChange={handleTitleChange}
        maxLength={255}
        placeholder="Issue title"
      />
      <div className="pointer-events-none absolute bottom-1 right-1 z-[2] rounded bg-custom-background-100 p-0.5 text-xs text-custom-text-200">
        <span className={`${title.length === 0 || title.length > 255 ? "text-red-500" : ""}`}>{title.length}</span>
        /255
      </div>
    </div>
  );
});
