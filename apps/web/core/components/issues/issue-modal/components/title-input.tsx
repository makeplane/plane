/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
import { observer } from "mobx-react";
import type { Control, FormState } from "react-hook-form";
import { Controller } from "react-hook-form";
// plane imports
import { Field } from "@makeplane/propel/components/field";
import { Input, InputGroup } from "@makeplane/propel/components/input";
import { ETabIndices } from "@plane/constants";
// types
import { useTranslation } from "@plane/i18n";
import type { TIssue } from "@plane/types";
// ui

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

export const IssueTitleInput = observer(function IssueTitleInput(props: TIssueTitleInputProps) {
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
          <Field name="name" invalid={Boolean(errors.name)}>
            <InputGroup size="2xl">
              <Input
                size="2xl"
                id="name"
                name="name"
                type="text"
                value={value}
                onChange={(e) => {
                  onChange(e.target.value);
                  handleFormChange();
                }}
                ref={issueTitleRef || ref}
                placeholder={t("title")}
                autoFocus
                tabIndex={getIndex("name")}
              />
            </InputGroup>
          </Field>
        )}
      />
      <span className="text-caption-sm-medium text-danger-primary">{errors?.name?.message}</span>
    </div>
  );
});
