/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { Controller, useFormContext } from "react-hook-form";
// plane imports
import { useTranslation } from "@plane/i18n";
import { EmojiPicker, EmojiIconPickerTypes, Logo } from "@plane/propel/emoji-icon-picker";
import { PageIcon } from "@plane/propel/icons";
import type { TPageTemplateForm } from "@plane/types";
import { Input } from "@plane/ui";
// components
// plane web imports
import { validateWhitespaceI18n } from "@/components/templates/settings/common";
// local imports
import { PageTemplateEditor } from "./editor";

type Props = {
  workspaceSlug: string;
  templateId: string | undefined;
};

export const PageTemplatePageDetails = observer(function PageTemplatePageDetails(props: Props) {
  const { workspaceSlug, templateId } = props;
  // plane hooks
  const { t } = useTranslation();
  // states
  const [isEmojiIconPickerOpen, setIsEmojiIconPickerOpen] = useState(false);
  // form info
  const {
    control,
    formState: { errors },
    watch,
  } = useFormContext<TPageTemplateForm>();
  // derived form values
  const projectId = watch("page.project");

  return (
    <div className="space-y-4">
      {/* Page Logo */}
      <div className="size-10 -ml-[4px] grid place-items-center rounded-sm hover:bg-layer-transparent-hover transition-colors">
        <Controller
          control={control}
          name="page.logo_props"
          render={({ field: { onChange, value } }) => (
            <EmojiPicker
              iconType="lucide"
              isOpen={isEmojiIconPickerOpen}
              handleToggle={(val: boolean) => setIsEmojiIconPickerOpen(val)}
              className="grid place-items-center"
              buttonClassName="grid place-items-center"
              label={
                <span className="size-10 grid place-items-center">
                  {value?.in_use ? (
                    <Logo logo={value} size={36} type="lucide" />
                  ) : (
                    <PageIcon className="size-9 text-tertiary" />
                  )}
                </span>
              }
              onChange={(val) => {
                let logoValue = {};
                if (val?.type === "emoji")
                  logoValue = {
                    value: val.value,
                  };
                else if (val?.type === "icon") logoValue = val.value;
                onChange({
                  in_use: val?.type,
                  [val?.type]: logoValue,
                });
              }}
              defaultIconColor={value?.in_use && value.in_use === "icon" ? value?.icon?.color : undefined}
              defaultOpen={
                value?.in_use && value.in_use === "emoji" ? EmojiIconPickerTypes.EMOJI : EmojiIconPickerTypes.ICON
              }
            />
          )}
        />
      </div>
      {/* Page Name */}
      <div>
        <Controller
          control={control}
          name="page.name"
          rules={{
            validate: (value) => {
              const result = validateWhitespaceI18n(value ?? "");
              if (result) {
                return t(result);
              }
              return undefined;
            },
            maxLength: {
              value: 255,
              message: t("templates.settings.form.page.name.validation.maxLength"),
            },
          }}
          render={({ field: { onChange, value } }) => (
            <Input
              id="page.name"
              name="page.name"
              type="text"
              value={value}
              onChange={(e) => {
                onChange(e.target.value);
              }}
              hasError={Boolean(errors.page?.name)}
              placeholder={t("templates.settings.form.page.name.placeholder")}
              className="w-full text-h5-bold p-0"
              mode="true-transparent"
              inputSize="md"
            />
          )}
        />
        {errors?.page?.name && typeof errors.page.name.message === "string" && (
          <span className="text-caption-sm-medium text-danger-primary">{errors.page.name.message}</span>
        )}
      </div>
      {/* Page Description */}
      <div>
        <Controller
          control={control}
          name="page.description_html"
          render={({ field: { onChange, value } }) => (
            <PageTemplateEditor
              initialValue={value ?? "<p></p>"}
              onChange={(_json, html) => {
                onChange(html);
              }}
              projectId={projectId}
              templateId={templateId}
              workspaceSlug={workspaceSlug}
            />
          )}
        />
      </div>
    </div>
  );
});
