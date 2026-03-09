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

import { useMemo, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { filterIntakeEligibleProperties } from "@plane/propel/domain/intake-form";
import { CloseIcon, EyeOpenIcon } from "@plane/propel/icons";
import { AlignLeft, CaseSensitive, Plus } from "lucide-react";
import { Menu } from "@plane/propel/menu";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import { cn } from "@plane/propel/utils";
import type { TIntakeTypeForm } from "@plane/types";
import { Input } from "@plane/ui";
import type { TContextMenuItem } from "@plane/ui";
import { getChangedFields } from "@plane/utils";
import { IssueTypeIdentifier } from "@/components/issues/issue-detail/issue-identifier";
import { useIssueType } from "@/plane-web/hooks/store";
import { useIntakeTypeForms } from "@/plane-web/hooks/store/use-intake-type-forms";
import { IntakeFormPreviewModal } from "./form-preview-modal";
import { TypePropertiesDropdown } from "./properties-dropdown";
import { TypeFormPropertiesListItem } from "./properties-list-item";

type Props = {
  typeId: string;
  data?: TIntakeTypeForm;
  handleRemove: () => void;
  onClose: () => void;
};

const sanitizeTypeFormData = (formData: Partial<TIntakeTypeForm>): Partial<TIntakeTypeForm> => {
  const { anchor: _anchor, id: _id, ...sanitized } = formData;
  return sanitized;
};

export const TypeFormCreateUpdateRoot = observer(function TypeFormCreateUpdateRoot(props: Props) {
  //router
  const { workspaceSlug, projectId } = useParams();
  // props
  const { typeId, data, handleRemove, onClose } = props;

  // states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  // hooks
  const { t } = useTranslation();
  const workItemType = useIssueType(typeId);
  const { createTypeForm, updateTypeForm } = useIntakeTypeForms();

  const intakeFormT = (path: string) => t(`project_settings.features.intake.form.${path}`);

  const defaultValues: Partial<TIntakeTypeForm> = useMemo(() => {
    const filteredProperties = filterIntakeEligibleProperties(workItemType?.activeProperties ?? []);

    const mandatoryFields: string[] = filteredProperties
      .filter((property) => property?.is_required)
      .map((property) => property.id)
      .filter((id): id is string => !!id);

    const formFields = data ? data.form_fields : mandatoryFields;

    return {
      name: "",
      description: "",
      work_item_type: typeId,
      is_workitem_name_required: true,
      is_workitem_description_required: true,
      ...data,
      form_fields: formFields,
    };
  }, [data, typeId, workItemType]);

  // hook form
  const {
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, dirtyFields },
  } = useForm<Partial<TIntakeTypeForm>>({
    defaultValues,
  });

  if (!typeId || !workItemType || !workspaceSlug || !projectId) return null;

  const QUICK_ACTIONS: TContextMenuItem[] = [
    {
      key: "remove",
      title: t("remove"),
      icon: CloseIcon,
      action: handleRemove,
      className: "text-danger-primary",
    },
  ];

  const selectedFields: string[] = watch("form_fields") as string[];
  const showDescription = watch("is_workitem_description_required") ?? true;

  // handlers
  const handleSelectField = (fields: string[]) => {
    setValue("form_fields", fields, { shouldDirty: true });
  };

  const handleRemoveField = (field: string) => {
    setValue(
      "form_fields",
      selectedFields.filter((f) => f !== field),
      { shouldDirty: true }
    );
  };

  const onSubmit = (formData: Partial<TIntakeTypeForm>) => {
    const sanitizedFormData = sanitizeTypeFormData(formData);

    const payload = data?.id
      ? getChangedFields<Partial<TIntakeTypeForm>>(
          sanitizedFormData,
          dirtyFields as Partial<Record<Extract<keyof TIntakeTypeForm, string>, boolean | undefined>>
        )
      : sanitizedFormData;

    setIsSubmitting(true);
    const promise = data?.id
      ? updateTypeForm(projectId.toString(), data.id.toString(), payload)
      : createTypeForm(workspaceSlug.toString(), projectId.toString(), payload);
    promise
      .then(() => {
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Success!",
          message: data?.id ? intakeFormT("toasts.success_update") : intakeFormT("toasts.success_create"),
        });
        onClose();
      })
      .catch(() => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: data?.id ? intakeFormT("toasts.error_update") : intakeFormT("toasts.error_create"),
        });
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  const handleDiscard = () => {
    reset(defaultValues);
    onClose();
  };

  return (
    <>
      <div className="bg-surface-1 rounded-md border border-subtle">
        <div className="p-4">
          {/* Form Header */}
          <div className="flex justify-between">
            <span className="text-secondary text-14 font-medium">
              {data?.id ? intakeFormT("edit_form") : intakeFormT("create_form")}
            </span>
            <div className="flex gap-2 items-center">
              <Button
                variant="ghost"
                className="flex gap-1 items-center px-0"
                onClick={() => setIsPreviewModalOpen(true)}
              >
                <EyeOpenIcon className="size-4" />
                <span className=" text-11 font-medium">{t("preview")}</span>
              </Button>
              {/* Quick actions */}
              <Menu ellipsis>
                {QUICK_ACTIONS.map((item) => (
                  <Menu.MenuItem
                    key={item.key}
                    onClick={item.action}
                    className={cn("flex items-center gap-2 text-secondary", item.className)}
                  >
                    {item.icon && <item.icon className="size-4" />}
                    <span className=" text-11">{item.title}</span>
                  </Menu.MenuItem>
                ))}
              </Menu>
            </div>
          </div>
          <div className="flex gap-5 justify-between mt-3">
            <div className="flex flex-col gap-2 flex-grow">
              <label className="text-primary text-14 font-medium">
                Form title <span className="text-danger-primary">*</span>
              </label>
              <Controller
                control={control}
                name="name"
                rules={{
                  required: {
                    value: true,
                    message: intakeFormT("form_title_required"),
                  },
                }}
                render={({ field }) => (
                  <Input
                    {...field}
                    placeholder={intakeFormT("form_title")}
                    className="w-full"
                    hasError={Boolean(errors.name)}
                  />
                )}
              />
              {errors.name && <p className="text-danger-primary text-11">{errors.name.message}</p>}
            </div>
            <div className="flex flex-col gap-2 w-[30%]">
              <label className="text-primary text-14 font-medium">Work item type</label>
              <div className="px-3 py-2 border border-subtle rounded-lg flex items-center gap-2">
                <IssueTypeIdentifier issueTypeId={typeId} size={"xs"} />
                <span className="text-placeholder text-14">{workItemType?.name}</span>
              </div>
            </div>
          </div>
          {/* Form Description */}
          <div className="mt-5 flex flex-col gap-2">
            <label className="text-primary text-14 font-medium">Form description</label>
            <Controller
              control={control}
              name="description"
              rules={{}}
              render={({ field }) => (
                <textarea
                  {...field}
                  value={field.value ?? ""}
                  placeholder="Describe your form here"
                  className={cn(
                    "w-full h-[100px] rounded-lg border border-subtle bg-transparent px-3 py-2 text-14 text-secondary placeholder:text-placeholder focus:border-primary focus:outline-none resize-none",
                    errors.description && "border-danger-primary"
                  )}
                />
              )}
            />
            {errors.description && <p className="text-danger-primary text-11">{errors.description.message}</p>}
          </div>
          {/* Properties  List */}
          <div className="mt-5 space-y-2">
            <span className="text-disabled text-11 uppercase font-semibold">Properties</span>
            <div className="flex flex-col gap-3">
              {/* Built-in Title and Description fields */}
              <div className="p-3 rounded-lg border border-subtle flex gap-2 items-center">
                <div className="flex flex-1 gap-2 items-center">
                  <CaseSensitive className="size-4 text-secondary" />
                  <span className="text-secondary text-13 font-medium">Title</span>
                </div>
              </div>
              {showDescription ? (
                <div className="p-3 rounded-lg border border-subtle flex gap-2 items-center">
                  <div className="flex flex-1 gap-2 items-center">
                    <AlignLeft className="size-4 text-secondary" />
                    <span className="text-secondary text-13 font-medium">Description</span>
                  </div>
                  <Menu ellipsis>
                    <Menu.MenuItem
                      onClick={() => setValue("is_workitem_description_required", false, { shouldDirty: true })}
                      className="flex items-center gap-2 text-danger-primary"
                    >
                      <CloseIcon className="size-4" />
                      <span className="text-11">Remove property</span>
                    </Menu.MenuItem>
                  </Menu>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setValue("is_workitem_description_required", true, { shouldDirty: true })}
                  className="flex items-center gap-1 text-13 text-primary-muted hover:text-primary cursor-pointer"
                >
                  <Plus className="size-3.5" />
                  <span>Add description</span>
                </button>
              )}
              {selectedFields.map((field) => (
                <TypeFormPropertiesListItem
                  key={field}
                  typeId={typeId}
                  propertyId={field}
                  handleRemove={() => handleRemoveField(field)}
                />
              ))}
            </div>

            {/* Properties Dropdown */}
            <TypePropertiesDropdown
              workItemType={workItemType}
              selectedFields={selectedFields}
              onSelect={handleSelectField}
            />
          </div>
        </div>
        {/* Form footer */}
        <div className="border-t border-subtle flex justify-end gap-3 p-4">
          <Button variant="secondary" onClick={handleDiscard}>
            {t("discard")}
          </Button>
          <Button onClick={handleSubmit(onSubmit)} loading={isSubmitting} disabled={isSubmitting}>
            {data?.id ? t("update") : t("save")}
          </Button>
        </div>
      </div>
      <IntakeFormPreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        projectId={projectId.toString()}
        typeId={typeId}
        formTitle={watch("name") as string}
        formDescription={watch("description") as string}
        showDescription={showDescription}
        isDescriptionRequired={showDescription}
        isTitleRequired={(watch("is_workitem_name_required") ?? true) as boolean}
        selectedFields={selectedFields}
      />
    </>
  );
});
