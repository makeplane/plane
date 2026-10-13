/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
// plane imports
import { Field } from "@makeplane/propel/components/field";
import { Input, InputGroup } from "@makeplane/propel/components/input";
import { TextArea, TextAreaGroup } from "@makeplane/propel/components/text-area";
import { ETabIndices } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { EmojiPicker, Logo } from "@plane/blocks/emoji-icon-picker";
import { DateRangeSelect } from "@plane/blocks/property-select";
import { Button } from "@makeplane/propel/components/button";
import { CalendarOutline, ModuleOutline } from "@makeplane/propel/icons";
import type { IModule } from "@plane/types";
import { getDate, renderFormattedPayloadDate, getTabIndex } from "@plane/utils";
// components
import { MemberSelect } from "@/components/dropdowns/member/member-select";
import { ProjectSelect } from "@/components/dropdowns/project/project-select";
import { ModuleStatusSelect } from "@/components/modules";
// hooks
import { useUserProfile } from "@/hooks/store/user";
import { useUser } from "@/hooks/store/user/user-user";

type Props = {
  handleFormSubmit: (values: Partial<IModule>, dirtyFields: any) => Promise<void>;
  handleClose: () => void;
  status: boolean;
  projectId: string;
  setActiveProject: React.Dispatch<React.SetStateAction<string | null>>;
  data?: IModule;
  isMobile?: boolean;
};

const defaultValues: Partial<IModule> = {
  name: "",
  description: "",
  status: "backlog",
  lead_id: null,
  member_ids: [],
};

export function ModuleForm(props: Props) {
  const { handleFormSubmit, handleClose, status, projectId, setActiveProject, data, isMobile = false } = props;
  // states
  const [isLogoPickerOpen, setIsLogoPickerOpen] = useState(false);
  // store hooks
  const { projectsWithCreatePermissions } = useUser();
  const { data: userProfile } = useUserProfile();
  // form info
  const {
    formState: { errors, isSubmitting, dirtyFields },
    handleSubmit,
    control,
    reset,
    setValue,
    watch,
  } = useForm<IModule>({
    defaultValues: {
      project_id: projectId,
      name: data?.name || "",
      description: data?.description || "",
      status: data?.status || "backlog",
      lead_id: data?.lead_id || null,
      member_ids: data?.member_ids || [],
      logo_props: data?.logo_props,
    },
  });
  // derived values
  const logoValue = watch("logo_props");

  const { getIndex } = getTabIndex(ETabIndices.PROJECT_MODULE, isMobile);

  const { t } = useTranslation();

  const handleCreateUpdateModule = async (formData: Partial<IModule>) => {
    await handleFormSubmit(formData, dirtyFields);

    reset({
      ...defaultValues,
    });
  };

  useEffect(() => {
    reset({
      ...defaultValues,
      ...data,
    });
  }, [data, reset]);

  return (
    <form onSubmit={handleSubmit(handleCreateUpdateModule)}>
      <div className="space-y-5 p-5">
        <div className="flex items-center gap-x-3">
          {!status && (
            <Controller
              control={control}
              name="project_id"
              render={({ field: { value, onChange } }) => (
                <ProjectSelect
                  value={value}
                  onChange={(val) => {
                    if (!val) return;
                    onChange(val);
                    setActiveProject(val);
                  }}
                  multiple={false}
                  variant="pill-md"
                  filterOption={(id) => !!projectsWithCreatePermissions?.[id]}
                  tabIndex={getIndex("cover_image")}
                />
              )}
            />
          )}
          <h3 className="text-18 font-medium text-secondary">
            {status ? t("common.update") : t("common.create")} {t("common.module").toLowerCase()}
          </h3>
        </div>
        <div className="space-y-3">
          <div className="flex w-full items-start gap-2">
            <EmojiPicker
              iconType="lucide"
              isOpen={isLogoPickerOpen}
              handleToggle={(val: boolean) => setIsLogoPickerOpen(val)}
              className="flex flex-shrink-0 items-center justify-center"
              buttonClassName="flex items-center justify-center"
              label={
                <span className="grid h-9 w-9 place-items-center rounded-md bg-surface-2">
                  {logoValue?.in_use ? (
                    <Logo
                      logo={logoValue}
                      size={18}
                      type="lucide"
                      fallback={<ModuleOutline className="h-4 w-4 text-tertiary" />}
                    />
                  ) : (
                    <ModuleOutline className="h-4 w-4 text-tertiary" />
                  )}
                </span>
              }
              onChange={(val) => {
                setValue(
                  "logo_props",
                  val.type === "emoji"
                    ? { in_use: "emoji", emoji: { value: val.value } }
                    : { in_use: "icon", icon: val.value },
                  { shouldDirty: true }
                );
                setIsLogoPickerOpen(false);
              }}
              onImageChange={({ url }) => {
                setValue("logo_props", { in_use: "image", image: { url } }, { shouldDirty: true });
                setIsLogoPickerOpen(false);
              }}
              defaultIconColor={logoValue?.in_use === "icon" ? logoValue.icon?.color : undefined}
              defaultImageUrl={logoValue?.in_use === "image" ? logoValue.image?.url : undefined}
              defaultOpen={logoValue?.in_use ?? "icon"}
            />
            <div className="w-full space-y-1">
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
                  <Field name="name" invalid={Boolean(errors?.name)}>
                    <InputGroup size="2xl">
                      <Input
                        size="2xl"
                        id="name"
                        name="name"
                        type="text"
                        value={value}
                        onChange={onChange}
                        placeholder={t("title")}
                        tabIndex={getIndex("name")}
                        autoFocus
                      />
                    </InputGroup>
                  </Field>
                )}
              />
              <span className="text-11 text-danger-primary">{errors?.name?.message}</span>
            </div>
          </div>
          <div>
            <Controller
              name="description"
              control={control}
              render={({ field: { value, onChange } }) => (
                <Field name="description" invalid={Boolean(errors?.description)}>
                  <TextAreaGroup resize="none">
                    <TextArea
                      size="lg"
                      surface="field"
                      autoResize
                      maxRows={8}
                      id="description"
                      name="description"
                      value={value}
                      onChange={onChange}
                      placeholder={t("description")}
                      tabIndex={getIndex("description")}
                    />
                  </TextAreaGroup>
                </Field>
              )}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Controller
              control={control}
              name="start_date"
              render={({ field: { value: startDateValue, onChange: onChangeStartDate } }) => (
                <Controller
                  control={control}
                  name="target_date"
                  render={({ field: { value: endDateValue, onChange: onChangeEndDate } }) => (
                    <DateRangeSelect
                      variant="pill-md"
                      value={{
                        from: getDate(startDateValue) ?? null,
                        to: getDate(endDateValue) ?? null,
                      }}
                      onChange={(range) => {
                        onChangeStartDate(range.from ? renderFormattedPayloadDate(range.from) : null);
                        onChangeEndDate(range.to ? renderFormattedPayloadDate(range.to) : null);
                      }}
                      placeholder={`${t("start_date")} - ${t("end_date")}`}
                      icon={<CalendarOutline />}
                      weekStartsOn={userProfile?.start_of_the_week}
                      tabIndex={getIndex("date_range")}
                    />
                  )}
                />
              )}
            />
            <div className="h-7">
              <ModuleStatusSelect control={control} error={errors.status} tabIndex={getIndex("status")} />
            </div>
            <Controller
              control={control}
              name="lead_id"
              render={({ field: { value, onChange } }) => (
                <MemberSelect
                  value={value}
                  onChange={onChange}
                  projectId={projectId}
                  multiple={false}
                  placeholder={t("lead")}
                  variant="pill-md"
                  tabIndex={getIndex("lead")}
                />
              )}
            />
            <Controller
              control={control}
              name="member_ids"
              render={({ field: { value, onChange } }) => (
                <MemberSelect
                  value={value ?? []}
                  onChange={onChange}
                  projectId={projectId}
                  multiple
                  placeholder={t("members")}
                  variant={value?.length ? "avatar-group-md" : "pill-md"}
                  tabIndex={getIndex("member_ids")}
                />
              )}
            />
          </div>
        </div>
      </div>
      <div className="flex items-center justify-end gap-2 border-t-[0.5px] border-subtle px-5 py-4">
        <Button
          variant="secondary"
          size="md"
          stretch="auto"
          onClick={handleClose}
          tabIndex={getIndex("cancel")}
          label={t("cancel")}
        />
        <Button
          variant="primary"
          size="md"
          stretch="auto"
          type="submit"
          loading={isSubmitting}
          tabIndex={getIndex("submit")}
          label={
            status
              ? isSubmitting
                ? t("updating")
                : t("project_module.update_module")
              : isSubmitting
                ? t("creating")
                : t("project_module.create_module")
          }
        />
      </div>
    </form>
  );
}
