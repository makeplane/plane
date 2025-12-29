import type { FC } from "react";
import { useState, useEffect, useCallback, useRef } from "react";
import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import type { TNameDescriptionLoader } from "@plane/types";
// components
import { TextArea } from "@plane/ui";
// types
import { cn } from "@plane/utils";
import useDebounce from "@/hooks/use-debounce";
import type { TIssueOperations } from "./issue-detail";
// hooks

export type IssueTitleInputProps = {
  disabled?: boolean;
  value: string | undefined | null;
  workspaceSlug: string;
  isSubmitting: TNameDescriptionLoader;
  setIsSubmitting: (value: TNameDescriptionLoader) => void;
  issueOperations: TIssueOperations;
  projectId: string;
  issueId: string;
  className?: string;
  containerClassName?: string;
};

export const IssueTitleInput = observer(function IssueTitleInput(props: IssueTitleInputProps) {
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
  const { t } = useTranslation();
  // states
  const [title, setTitle] = useState("");
  const [isLengthVisible, setIsLengthVisible] = useState(false);
  // ref to track if there are unsaved changes
  const hasUnsavedChanges = useRef(false);
  // ref to store current title value for cleanup function
  const currentTitleRef = useRef(title);
  // hooks
  const debouncedValue = useDebounce(title, 1500);

  useEffect(() => {
    if (value) {
      setTitle(value);
      currentTitleRef.current = value;
      // Reset unsaved changes flag when value is set from props
      hasUnsavedChanges.current = false;
    }
  }, [value]);

  useEffect(() => {
    const textarea = document.querySelector("#title-input");
    if (debouncedValue && debouncedValue !== value) {
      if (debouncedValue.trim().length > 0) {
        issueOperations.update(workspaceSlug, projectId, issueId, { name: debouncedValue }).finally(() => {
          setIsSubmitting("saved");
          hasUnsavedChanges.current = false;
          if (textarea && !textarea.matches(":focus")) {
            const trimmedTitle = debouncedValue.trim();
            if (trimmedTitle !== title) setTitle(trimmedTitle);
          }
        });
      } else {
        setTitle(value || "");
        setIsSubmitting("saved");
        hasUnsavedChanges.current = false;
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
          hasUnsavedChanges.current = true;
        } else {
          setTitle(value || "");
          setIsSubmitting("saved");
          hasUnsavedChanges.current = false;
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

  // Save on unmount if there are unsaved changes
  useEffect(
    () => () => {
      if (hasUnsavedChanges.current && currentTitleRef.current.trim().length > 0) {
        issueOperations
          .update(workspaceSlug, projectId, issueId, { name: currentTitleRef.current.trim() })
          .catch((error) => {
            console.error("Failed to save title on unmount:", error);
          })
          .finally(() => {
            setIsSubmitting("saved");
            hasUnsavedChanges.current = false;
          });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const handleTitleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setIsSubmitting("submitting");
      const titleFromEvent = e.target.value;
      setTitle(titleFromEvent);
      currentTitleRef.current = titleFromEvent;
      hasUnsavedChanges.current = true;
    },
    [setIsSubmitting]
  );

  if (disabled) return <div className="text-20 font-medium whitespace-pre-line">{title}</div>;

  return (
    <div className="flex flex-col gap-1.5">
      <div className={cn("relative", containerClassName)}>
        <TextArea
          id="title-input"
          className={cn(
            "block w-full resize-none overflow-hidden rounded-sm border-none bg-transparent px-3 py-0 text-20 font-medium outline-none ring-0",
            {
              "ring-1 ring-danger-strong mx-2.5": title?.length === 0,
            },
            className
          )}
          disabled={disabled}
          value={title}
          onChange={handleTitleChange}
          maxLength={255}
          placeholder={t("issue.title.label")}
          onFocus={() => setIsLengthVisible(true)}
          onBlur={() => setIsLengthVisible(false)}
        />
        <div
          className={cn(
            "pointer-events-none absolute bottom-1 right-1 z-[2] rounded-sm bg-surface-1 p-0.5 text-11 text-secondary opacity-0 transition-opacity",
            {
              "opacity-100": isLengthVisible,
            }
          )}
        >
          <span className={`${title.length === 0 || title.length > 255 ? "text-danger-primary" : ""}`}>
            {title.length}
          </span>
          /255
        </div>
      </div>
      {title?.length === 0 && (
        <span className="text-13 font-medium text-danger-primary">{t("form.title.required")}</span>
      )}
    </div>
  );
});
