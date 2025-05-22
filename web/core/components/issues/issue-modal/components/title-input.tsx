"use client";

import React from "react";
import { observer } from "mobx-react";
import { Control, Controller, FormState } from "react-hook-form";
// plane imports
import { ETabIndices } from "@plane/constants";
// types
import { useTranslation } from "@plane/i18n";
import { TIssue } from "@plane/types";
// ui
import { Input } from "@plane/ui";
// helpers
import { getTabIndex } from "@plane/utils";
// hooks
import { usePlatformOS } from "@/hooks/use-platform-os";

type TIssueTitleInputProps = {
  control: Control<TIssue>;
  issueTitleRef: React.MutableRefObject<HTMLInputElement | null>;
  formState: FormState<TIssue>;
  handleFormChange: () => void;
};

export const IssueTitleInput: React.FC<TIssueTitleInputProps> = observer((props) => {
  const {
    control,
    issueTitleRef,
    formState: { errors },
    handleFormChange,
  } = props;
  // store hooks
  const { isMobile } = usePlatformOS();
  const { t } = useTranslation();

  const { getIndex } = getTabIndex(ETabIndices.ISSUE_FORM, isMobile);

  const validateWhitespace = (value: string) => {
    if (value.trim() === "") {
      return t("title_is_required");
    }
    return undefined;
  };
  return (
    <div>
      <Controller
        control={control}
        name="name"
        rules={{
          validate: validateWhitespace,
          required: t("title_is_required"),
          maxLength: {
            value: 255,
            message: t("title_should_be_less_than_255_characters"),
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
            placeholder={t("title")}
            className="w-full text-base"
            autoFocus
            tabIndex={getIndex("name")}
          />
        )}
      />
      <span className="text-xs font-medium text-red-500">{errors?.name?.message}</span>
    </div>
  );
});
