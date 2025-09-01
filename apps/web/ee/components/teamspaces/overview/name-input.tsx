"use client";

import { FC, useState, useEffect, useCallback } from "react";
import { observer } from "mobx-react";
import { TNameDescriptionLoader } from "@plane/types";
// ui
import { TextArea } from "@plane/ui";
// types
import { cn } from "@plane/utils";
// hooks
import useDebounce from "@/hooks/use-debounce";
// plane web hooks
import { useTeamspaces } from "@/plane-web/hooks/store";

export type TeamNameInputProps = {
  value: string | undefined | null;
  workspaceSlug: string;
  teamspaceId: string;
  disabled?: boolean;
  className?: string;
  containerClassName?: string;
};

export const TeamNameInput: FC<TeamNameInputProps> = observer((props) => {
  const { disabled, value, workspaceSlug, teamspaceId, className, containerClassName } = props;
  // states
  const [name, setName] = useState("");
  const [isLengthVisible, setIsLengthVisible] = useState(false);
  // hooks
  const { getTeamspaceNameDescriptionLoaderById, updateTeamspaceNameDescriptionLoader, updateTeamspace } =
    useTeamspaces();
  // derived value
  const debouncedValue = useDebounce(name, 1500);
  const loaderType = getTeamspaceNameDescriptionLoaderById(teamspaceId);

  useEffect(() => {
    if (value) setName(value);
  }, [value]);

  const setIsSubmitting = (loaderType: TNameDescriptionLoader) => {
    updateTeamspaceNameDescriptionLoader(teamspaceId, loaderType);
  };

  useEffect(() => {
    const textarea = document.querySelector(`#teamspace-${teamspaceId}-input`);
    if (debouncedValue && debouncedValue !== value) {
      if (debouncedValue.trim().length > 0) {
        updateTeamspace(workspaceSlug, teamspaceId, { name: debouncedValue }).finally(() => {
          setIsSubmitting("saved");
          if (textarea && !textarea.matches(":focus")) {
            const trimmedName = debouncedValue.trim();
            if (trimmedName !== name) setName(trimmedName);
          }
        });
      } else {
        setName(value || "");
        setIsSubmitting("saved");
      }
    }
    // DO NOT Add more dependencies here. It will cause multiple requests to be sent.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedValue]);

  useEffect(() => {
    const handleBlur = () => {
      const trimmedName = name.trim();
      if (trimmedName !== name && loaderType !== "submitting") {
        if (trimmedName.length > 0) {
          setName(trimmedName);
          setIsSubmitting("submitting");
        } else {
          setName(value || "");
          setIsSubmitting("saved");
        }
      }
    };

    const textarea = document.querySelector(`#teamspace-${teamspaceId}-input`);
    if (textarea) {
      textarea.addEventListener("blur", handleBlur);
    }

    return () => {
      if (textarea) {
        textarea.removeEventListener("blur", handleBlur);
      }
    };
  }, [name, loaderType, setIsSubmitting, teamspaceId]);

  const handleNameChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      updateTeamspaceNameDescriptionLoader(teamspaceId, "submitting");
      setName(e.target.value);
    },
    [updateTeamspaceNameDescriptionLoader, teamspaceId]
  );

  if (disabled) return <div className="text-xl font-semibold whitespace-pre-line">{name}</div>;

  return (
    <div className="flex flex-col gap-1.5">
      <div className={cn("relative", containerClassName)}>
        <TextArea
          id={`teamspace-${teamspaceId}-input`}
          className={cn(
            "block w-full resize-none overflow-hidden rounded border-none bg-transparent px-0 py-0 text-xl font-semibold outline-none ring-0",
            {
              "ring-1 ring-red-400 mx-2.5": name?.length === 0,
            },
            className
          )}
          disabled={disabled}
          value={name}
          onChange={handleNameChange}
          maxLength={255}
          placeholder="Teamspace name"
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
          <span className={`${name.length === 0 || name.length > 255 ? "text-red-500" : ""}`}>{name.length}</span>
          /255
        </div>
      </div>
      {name?.length === 0 && <span className="text-sm font-medium text-red-500">Name is required</span>}
    </div>
  );
});
