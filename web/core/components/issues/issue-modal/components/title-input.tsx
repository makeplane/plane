"use client";

import React from "react";
import { observer } from "mobx-react";
import { Control, Controller, FieldErrors } from "react-hook-form";
// types
import { TIssue } from "@plane/types";
// ui
import { Input } from "@plane/ui";
// constants
import { ETabIndices } from "@/constants/tab-indices";
// helpers
import { getTabIndex } from "@/helpers/tab-indices.helper";
// hooks
import { usePlatformOS } from "@/hooks/use-platform-os";

type TIssueTitleInputProps = {
  control: Control<TIssue>;
  issueTitleRef: React.MutableRefObject<HTMLInputElement | null>;
  errors: FieldErrors<TIssue>;
  handleFormChange: () => void;
};

export const IssueTitleInput: React.FC<TIssueTitleInputProps> = observer((props) => {
  const { control, issueTitleRef, errors, handleFormChange } = props;
  // store hooks
  const { isMobile } = usePlatformOS();

  const { getIndex } = getTabIndex(ETabIndices.ISSUE_FORM, isMobile);

  const validateWhitespace = (value: string) => {
    if (value.trim() === "") {
      return "Title is required";
    }
    return undefined;
  };
  return (
    <>
      <Controller
        control={control}
        name="name"
        rules={{
          validate: validateWhitespace,
          required: "Title is required",
          maxLength: {
            value: 255,
            message: "Title should be less than 255 characters",
          },
        }}
        render={({ field: { value, onChange, ref } }) => (
          <Input
            id="name"
            name="name"
            type="text"
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
              handleFormChange();
            }}
            ref={issueTitleRef || ref}
            hasError={Boolean(errors.name)}
            placeholder="Title"
            className="w-full text-base"
            tabIndex={getIndex("name")}
            autoFocus
          />
        )}
      />
      <span className="text-xs font-medium text-red-500">{errors?.name?.message}</span>
    </>
  );
});
