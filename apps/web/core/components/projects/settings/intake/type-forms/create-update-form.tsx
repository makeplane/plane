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
import { Button } from "@plane/propel/button";
import { filterIntakeEligibleProperties } from "@plane/propel/domain/intake-form";
import { CloseIcon, EyeOpenIcon } from "@plane/propel/icons";
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
  const workItemType = useIssueType(typeId);
  const { createTypeForm, updateTypeForm } = useIntakeTypeForms();

  const defaultValues: Partial<TIntakeTypeForm> = useMemo(() => {
    const filteredProperties = filterIntakeEligibleProperties(workItemType?.activeProperties ?? []);

    const mandatoryFields: string[] = filteredProperties
      .filter((property) => property?.is_required)
      .map((property) => property.id)
      .filter((id): id is string => !!id);

    const formFields = data ? data.form_fields : mandatoryFields;

    return {
      name: "",
      work_item_type: typeId,
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
      title: "Remove",
      icon: CloseIcon,
      action: handleRemove,
      className: "text-danger-primary",
    },
  ];

  const selectedFields: string[] = watch("form_fields") as string[];

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
          message: data?.id ? "Intake form updated successfully" : "Intake form created successfully",
        });
        onClose();
      })
      .catch(() => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: data?.id ? "Failed to update intake form" : "Failed to create intake form",
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
        <div className="p-3">
          {/* Form Header */}
          <div className="flex justify-between">
            <span className="text-secondary text-14 font-medium">{data?.id ? "Edit form details" : "Create form"}</span>
            <div className="flex gap-2 items-center">
              <Button
                variant="ghost"
                className="flex gap-1 items-center px-0"
                onClick={() => setIsPreviewModalOpen(true)}
              >
                <EyeOpenIcon className="size-4" />
                <span className=" text-11 font-medium">Preview</span>
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
          <div className="flex justify-between mt-3">
            <div className="spacey-1 w-[65%]">
              <label className="text-tertiary text-13 font-medium">Form title</label>
              <Controller
                control={control}
                name="name"
                rules={{
                  required: {
                    value: true,
                    message: "Form title is required",
                  },
                }}
                render={({ field }) => (
                  <Input {...field} placeholder="Form title" className="w-full" hasError={Boolean(errors.name)} />
                )}
              />
              {errors.name && <p className="text-danger-primary text-11">{errors.name.message}</p>}
            </div>
            <div className="spacey-1 w-[30%]">
              <label className="text-tertiary text-13 font-medium">Work item type</label>
              <div className="p-2  border border-subtle-1 rounded-md flex items-center gap-2">
                <IssueTypeIdentifier issueTypeId={typeId} size={"xs"} />
                <span className="text-secondary text-11">{workItemType?.name}</span>
              </div>
            </div>
          </div>
          {/* Properties  List */}
          <div className="mt-2 space-y-2">
            <span className="text-placeholder text-11 uppercase font-medium">Properties</span>
            <div className="flex flex-col gap-2">
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
        <div className="border-t border-subtle flex justify-end gap-2 p-3">
          <Button variant="secondary" onClick={handleDiscard}>
            Discard
          </Button>
          <Button onClick={handleSubmit(onSubmit)} loading={isSubmitting} disabled={isSubmitting}>
            {data?.id ? "Update" : "Save"}
          </Button>
        </div>
      </div>
      <IntakeFormPreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        projectId={projectId.toString()}
        typeId={typeId}
        formTitle={watch("name") as string}
        selectedFields={selectedFields}
      />
    </>
  );
});
