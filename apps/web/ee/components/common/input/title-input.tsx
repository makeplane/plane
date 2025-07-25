"use client";

import { FC, useState, useEffect, useCallback, useRef } from "react";
import { observer } from "mobx-react";
// components
import { TextArea } from "@plane/ui";
// helpers
import { cn } from "@plane/utils";
// hooks
import useDebounce from "@/hooks/use-debounce";

export type TitleInputProps = {
  value: string | undefined | null;
  isSubmitting: "submitting" | "submitted" | "saved";
  setIsSubmitting: (value: "submitting" | "submitted" | "saved") => void;
  onSubmit: (value: string) => Promise<void>;
  className?: string;
  containerClassName?: string;
  disabled?: boolean;
};

export const TitleInput: FC<TitleInputProps> = observer((props) => {
  const { value, isSubmitting, setIsSubmitting, onSubmit, className, containerClassName, disabled } = props;
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
        onSubmit(debouncedValue).finally(() => {
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

    const textarea = document.querySelector("#title-input");
    if (textarea) {
      textarea.addEventListener("blur", handleBlur);
    }

    return () => {
      if (textarea) {
        textarea.removeEventListener("blur", handleBlur);
      }
    };
  }, [title, isSubmitting, setIsSubmitting, value]);

  // Save on unmount if there are unsaved changes
  useEffect(
    () => () => {
      if (hasUnsavedChanges.current && currentTitleRef.current.trim().length > 0) {
        onSubmit(currentTitleRef.current.trim())
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
          placeholder="Title"
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
