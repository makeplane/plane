"use client";

import { FC, useState, useEffect, useCallback } from "react";
import { observer } from "mobx-react";
// components
import { TextArea } from "@plane/ui";
// types
import { cn } from "@/helpers/common.helper";
import useDebounce from "@/hooks/use-debounce";
import { TIssueOperations } from "./issue-detail";
// hooks

export type IssueTitleInputProps = {
  disabled?: boolean;
  value: string | undefined | null;
  workspaceSlug: string;
  isSubmitting: "submitting" | "submitted" | "saved";
  setIsSubmitting: (value: "submitting" | "submitted" | "saved") => void;
  issueOperations: TIssueOperations;
  projectId: string;
  issueId: string;
  className?: string;
  containerClassName?: string;
};

export const IssueTitleInput: FC<IssueTitleInputProps> = observer((props) => {
  const {
    disabled,
    value,
    workspaceSlug,
    isSubmitting,
    setIsSubmitting,
    issueId,
    issueOperations,
    projectId,
    className,
    containerClassName,
  } = props;
  // states
  const [title, setTitle] = useState("");
  const [isLengthVisible, setIsLengthVisible] = useState(false);
  // hooks
  const debouncedValue = useDebounce(title, 1500);

  useEffect(() => {
    if (value) setTitle(value);
  }, [value]);

  useEffect(() => {
    const textarea = document.querySelector("#title-input");
    if (debouncedValue && debouncedValue !== value) {
      if (debouncedValue.trim().length > 0) {
        issueOperations.update(workspaceSlug, projectId, issueId, { name: debouncedValue }).finally(() => {
          setIsSubmitting("saved");
          if (textarea && !textarea.matches(":focus")) {
            const trimmedTitle = debouncedValue.trim();
            if (trimmedTitle !== title) setTitle(trimmedTitle);
          }
        });
      } else {
        setTitle(value || "");
        setIsSubmitting("saved");
      }
    }
    // DO NOT Add more dependencies here. It will cause multiple requests to be sent.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedValue]);

  useEffect(() => {
    const handleBlur = () => {
      const trimmedTitle = title.trim();
      if (trimmedTitle !== title && isSubmitting !== "submitting") {
        if (trimmedTitle.length > 0) {
          setTitle(trimmedTitle);
          setIsSubmitting("submitting");
        } else {
          setTitle(value || "");
          setIsSubmitting("saved");
        }
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

  if (disabled) return <div className="text-2xl font-medium whitespace-pre-line">{title}</div>;

  return (
    <div className="flex flex-col gap-1.5">
      <div className={cn("relative", containerClassName)}>
        <TextArea
          id="title-input"
          className={cn(
            "block w-full resize-none overflow-hidden rounded border-none bg-transparent px-3 py-0 text-2xl font-medium outline-none ring-0",
            {
              "ring-1 ring-red-400 mx-2.5": title?.length === 0,
            },
            className
          )}
          disabled={disabled}
          value={title}
          onChange={handleTitleChange}
          maxLength={255}
          placeholder="Issue title"
          onFocus={() => setIsLengthVisible(true)}
          onBlur={() => setIsLengthVisible(false)}
        />
        <div
          className={cn(
            "pointer-events-none absolute bottom-1 right-1 z-[2] rounded bg-custom-background-100 p-0.5 text-xs text-custom-text-200 opacity-0 transition-opacity",
            {
              "opacity-100": isLengthVisible,
            }
          )}
        >
          <span className={`${title.length === 0 || title.length > 255 ? "text-red-500" : ""}`}>{title.length}</span>
          /255
        </div>
      </div>
      {title?.length === 0 && <span className="text-sm font-medium text-red-500">Title is required</span>}
    </div>
  );
});
