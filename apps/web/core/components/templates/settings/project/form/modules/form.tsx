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

import { Controller, useForm } from "react-hook-form";
import type { Control } from "react-hook-form";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import type { IModule, TProjectModuleBlueprint } from "@plane/types";
import { Input, TextArea } from "@plane/ui";
// components
import { MemberDropdown } from "@/components/dropdowns/member/dropdown";
import { ModuleStatusSelect } from "@/components/modules";
// local imports
import type { TModuleFormValues } from "./types";

const defaultFormValues: TModuleFormValues = {
  name: "",
  description: "",
  status: "planned",
  lead_id: null,
  member_ids: [],
};

const toFormValues = (data?: TProjectModuleBlueprint | null): TModuleFormValues =>
  data
    ? {
        name: data.name,
        description: data.description ?? "",
        status: data.status,
        lead_id: data.lead_id ?? null,
        member_ids: data.member_ids ?? [],
      }
    : defaultFormValues;

type TTemplateModuleFormProps = {
  data?: TProjectModuleBlueprint | null;
  onCancel: () => void;
  onSubmit: (formData: TModuleFormValues) => void;
};

export const TemplateModuleForm = (props: TTemplateModuleFormProps) => {
  const { data, onCancel, onSubmit } = props;
  const isEditMode = !!data;
  const { t } = useTranslation();
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<TModuleFormValues>({
    defaultValues: toFormValues(data),
  });

  return (
    <div>
      <div className="space-y-5 p-5">
        <h3 className="text-20 font-medium text-secondary">
          {isEditMode ? t("common.update") : t("common.create")} {t("common.module")}
        </h3>
        <div className="space-y-3">
          <div className="space-y-1">
            <Controller
              control={control}
              name="name"
              rules={{
                required: t("title_is_required"),
                maxLength: {
                  value: 255,
                  message: t("title_should_be_less_than_255_characters"),
                },
              }}
              render={({ field: { value, onChange } }) => (
                <Input
                  id="module-name"
                  name="module-name"
                  type="text"
                  value={value}
                  onChange={onChange}
                  hasError={Boolean(errors?.name)}
                  placeholder={t("title")}
                  className="w-full text-14"
                  autoFocus
                />
              )}
            />
            <span className="text-11 text-danger-primary">{errors?.name?.message}</span>
          </div>
          <div>
            <Controller
              control={control}
              name="description"
              render={({ field: { value, onChange } }) => (
                <TextArea
                  id="module-description"
                  name="module-description"
                  value={value}
                  onChange={onChange}
                  placeholder={t("description")}
                  className="w-full text-14 resize-none min-h-[100px]"
                />
              )}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="h-7">
              <ModuleStatusSelect control={control as unknown as Control<IModule>} error={errors.status} />
            </div>
            <Controller
              control={control}
              name="lead_id"
              render={({ field: { value, onChange } }) => (
                <div className="h-7">
                  <MemberDropdown
                    value={value}
                    onChange={(val: string | null) => onChange(val === value ? null : val)}
                    multiple={false}
                    buttonVariant="border-with-text"
                    placeholder={t("lead")}
                  />
                </div>
              )}
            />
            <Controller
              control={control}
              name="member_ids"
              render={({ field: { value, onChange } }) => (
                <div className="h-7">
                  <MemberDropdown
                    value={value}
                    onChange={onChange}
                    multiple
                    buttonVariant={value && value.length > 0 ? "transparent-without-text" : "border-with-text"}
                    buttonClassName={value && value.length > 0 ? "hover:bg-transparent px-0" : ""}
                    placeholder={t("members")}
                  />
                </div>
              )}
            />
          </div>
        </div>
      </div>
      <div className="px-5 py-4 flex items-center justify-end gap-2 border-t-[0.5px] border-subtle">
        <Button variant="secondary" size="lg" onClick={onCancel} type="button">
          {t("cancel")}
        </Button>
        <Button variant="primary" size="lg" type="button" onClick={() => void handleSubmit(onSubmit)()}>
          {isEditMode ? t("project_module.update_module") : t("project_module.create_module")}
        </Button>
      </div>
    </div>
  );
};
